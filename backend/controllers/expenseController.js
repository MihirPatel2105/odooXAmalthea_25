const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');
const ApprovalRule = require('../models/ApprovalRule');
const { convertCurrency } = require('../utils/currencyService');
const { sendEmail } = require('../utils/emailService');
const { processReceiptOCR } = require('../utils/tesseractOcrService');
const mongoose = require('mongoose');

// Submit new expense
exports.submitExpense = async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      merchantName,
      expenseDate,
      tags
    } = req.body;

    const employeeId = req.user.userId;
    const companyId = req.user.companyId;

    const [employee, company] = await Promise.all([
      User.findById(employeeId).populate('managerId'),
      Company.findById(companyId)
    ]);

    if (!employee || !company) {
      return res.status(404).json({
        success: false,
        message: 'Employee or company not found'
      });
    }

    const expenseData = {
      employeeId,
      companyId,
      amount: {
        original: {
          value: parseFloat(amount.value),
          currency: amount.currency.toUpperCase()
        }
      },
      category,
      description,
      merchantName,
      expenseDate: new Date(expenseDate),
      tags: tags || []
    };

    // Convert currency if different from company currency
    if (amount.currency.toUpperCase() !== company.currency.code) {
      try {
        const conversion = await convertCurrency(
          parseFloat(amount.value),
          amount.currency.toUpperCase(),
          company.currency.code
        );
        
        expenseData.amount.converted = {
          value: conversion.convertedAmount,
          currency: company.currency.code,
          exchangeRate: conversion.exchangeRate,
          convertedAt: conversion.convertedAt
        };
      } catch (conversionError) {
        console.error('Currency conversion failed:', conversionError);
      }
    }

    // Process receipt if uploaded
    if (req.file) {
      expenseData.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      };

      try {
        const ocrResult = await processReceiptOCR(req.file.path);
        if (ocrResult.success) {
          expenseData.receipt.ocrData = {
            ...ocrResult.data,
            processedAt: new Date()
          };
        }
      } catch (ocrError) {
        console.error('OCR processing failed:', ocrError);
      }
    }

    const expense = new Expense(expenseData);

    // Check for auto-approval
    const autoApproved = expense.checkAutoApproval(company.settings);

    if (!autoApproved) {
      const applicableRules = await ApprovalRule.findApplicableRules(companyId, expense, employee);
      
      if (applicableRules.length === 0) {
        if (company.settings.isManagerApprover && employee.managerId) {
          expense.addApprovalStep(employee.managerId._id, 'manager', 1);
        } else {
          const admin = await User.findOne({ companyId, role: 'admin' });
          if (admin) {
            expense.addApprovalStep(admin._id, 'admin', 1);
          }
        }
      } else {
        const rule = applicableRules[0];
        
        for (const step of rule.approvalFlow) {
          let approverId;
          
          switch (step.approverType) {
            case 'manager':
              approverId = employee.managerId?._id;
              break;
            case 'specific_user':
              approverId = step.approverId;
              break;
            case 'role_based':
              const roleUser = await User.findOne({ 
                companyId, 
                role: step.approverRole,
                isActive: true 
              });
              approverId = roleUser?._id;
              break;
            case 'department_head':
              const deptHead = await User.findOne({
                companyId,
                department: step.department,
                role: { $in: ['manager', 'admin'] },
                isActive: true
              });
              approverId = deptHead?._id;
              break;
          }

          if (approverId) {
            expense.addApprovalStep(approverId, step.approverRole || 'manager', step.sequence, step.isRequired);
          }
        }

        if (rule.conditionalRules.isEnabled) {
          expense.conditionalApproval.isEnabled = true;
          expense.conditionalApproval.rules = rule.conditionalRules.rules;
          
          const percentageRule = rule.conditionalRules.rules.find(r => r.type === 'percentage');
          if (percentageRule) {
            const totalApprovers = expense.approvalFlow.length;
            expense.conditionalApproval.requiredApprovals = Math.ceil(
              (totalApprovers * percentageRule.percentage) / 100
            );
          }
        }
      }
    }

    await expense.save();

    // Send notifications to approvers
    if (!autoApproved && expense.approvalFlow.length > 0) {
      const firstApprover = await User.findById(expense.approvalFlow[0].approverId);
      if (firstApprover) {
        await sendEmail({
          to: firstApprover.email,
          template: 'expenseSubmitted',
          data: {
            approverName: firstApprover.firstName,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            expenseId: expense._id,
            amount: expense.totalAmount,
            currency: company.currency.symbol,
            category: expense.category,
            description: expense.description,
            expenseDate: expense.expenseDate.toDateString()
          }
        });
      }
    }

    await expense.populate([
      { path: 'employeeId', select: 'firstName lastName email' },
      { path: 'approvalFlow.approverId', select: 'firstName lastName email role' }
    ]);

    res.status(201).json({
      success: true,
      message: autoApproved ? 'Expense submitted and auto-approved' : 'Expense submitted successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit expense',
      error: error.message
    });
  }
};

// Get expenses for current user
exports.getMyExpenses = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const employeeId = req.user.userId;

    const filter = { employeeId };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('approvalFlow.approverId', 'firstName lastName role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(filter)
    ]);

    const summary = await Expense.aggregate([
      { $match: { employeeId: new mongoose.Types.ObjectId(employeeId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { 
            $sum: { 
              $ifNull: ['$amount.converted.value', '$amount.original.value'] 
            } 
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        summary
      }
    });

  } catch (error) {
    console.error('Get my expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses',
      error: error.message
    });
  }
};

// Get pending approvals for manager/admin
exports.getPendingApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;
    const approverId = req.user.userId;

    const filter = {
      status: 'pending',
      'approvalFlow.approverId': approverId,
      'approvalFlow.status': 'pending'
    };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('employeeId', 'firstName lastName email department')
        .populate('approvalFlow.approverId', 'firstName lastName role')
        .populate('companyId', 'currency')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending approvals',
      error: error.message
    });
  }
};

// Approve or reject expense
exports.processApproval = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { action, comments } = req.body;
    const approverId = req.user.userId;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approved" or "rejected"'
      });
    }

    const expense = await Expense.findById(expenseId)
      .populate('employeeId', 'firstName lastName email')
      .populate('companyId', 'currency');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const hasPermission = expense.approvalFlow.some(
      approval => approval.approverId.toString() === approverId && 
                  approval.status === 'pending'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve this expense'
      });
    }

    await expense.processApproval(approverId, action, comments);

    const approver = await User.findById(approverId);
    const emailTemplate = action === 'approved' ? 'expenseApproved' : 'expenseRejected';
    
    await sendEmail({
      to: expense.employeeId.email,
      template: emailTemplate,
      data: {
        employeeName: expense.employeeId.firstName,
        expenseId: expense._id,
        amount: expense.totalAmount,
        currency: expense.companyId.currency.symbol,
        category: expense.category,
        description: expense.description,
        approverName: `${approver.firstName} ${approver.lastName}`,
        comments: comments,
        rejectionReason: action === 'rejected' ? comments : undefined
      }
    });

    if (action === 'approved' && expense.status === 'approved') {
      console.log(`Expense ${expense._id} fully approved`);
    }

    await expense.populate('approvalFlow.approverId', 'firstName lastName role');

    res.json({
      success: true,
      message: `Expense ${action} successfully`,
      data: { expense }
    });

  } catch (error) {
    console.error('Process approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval',
      error: error.message
    });
  }
};

// Get expense details
exports.getExpenseDetails = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const expense = await Expense.findById(expenseId)
      .populate('employeeId', 'firstName lastName email department')
      .populate('approvalFlow.approverId', 'firstName lastName email role')
      .populate('companyId', 'name currency');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const canView = expense.employeeId._id.toString() === userId || 
                   userRole === 'admin' ||
                   (userRole === 'manager' && expense.approvalFlow.some(
                     approval => approval.approverId._id.toString() === userId
                   ));

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });

  } catch (error) {
    console.error('Get expense details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense details',
      error: error.message
    });
  }
};

// Get expense analytics
exports.getExpenseAnalytics = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = 'month',
      employeeId 
    } = req.query;

    const userId = req.user.userId;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    let baseFilter = { companyId };

    if (userRole === 'employee') {
      baseFilter.employeeId = userId;
    } else if (employeeId && userRole !== 'admin') {
      const employee = await User.findById(employeeId);
      if (!employee || employee.managerId?.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      baseFilter.employeeId = employeeId;
    } else if (employeeId) {
      baseFilter.employeeId = employeeId;
    }

    if (startDate || endDate) {
      baseFilter.expenseDate = {};
      if (startDate) baseFilter.expenseDate.$gte = new Date(startDate);
      if (endDate) baseFilter.expenseDate.$lte = new Date(endDate);
    }

    let groupByFormat;
    switch (groupBy) {
      case 'day':
        groupByFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupByFormat = '%Y-%U';
        break;
      case 'month':
        groupByFormat = '%Y-%m';
        break;
      case 'year':
        groupByFormat = '%Y';
        break;
      default:
        groupByFormat = '%Y-%m';
    }

    const [
      expensesByPeriod,
      expensesByCategory,
      expensesByStatus,
      totalStats
    ] = await Promise.all([
      Expense.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: { $dateToString: { format: groupByFormat, date: '$expenseDate' } },
            count: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            },
            avgAmount: {
              $avg: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Expense.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),

      Expense.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            }
          }
        }
      ]),

      Expense.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            },
            avgAmount: {
              $avg: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            },
            maxAmount: {
              $max: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            },
            minAmount: {
              $min: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        expensesByPeriod,
        expensesByCategory,
        expensesByStatus,
        totalStats: totalStats[0] || {
          totalExpenses: 0,
          totalAmount: 0,
          avgAmount: 0,
          maxAmount: 0,
          minAmount: 0
        }
      }
    });

  } catch (error) {
    console.error('Get expense analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense analytics',
      error: error.message
    });
  }
};

// Update expense (only for draft status)
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.employeeId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!['draft', 'rejected'].includes(expense.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update expense in current status'
      });
    }

    const allowedUpdates = ['amount', 'category', 'description', 'merchantName', 'expenseDate', 'tags'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (updates.amount) {
      const company = await Company.findById(expense.companyId);
      if (updates.amount.currency.toUpperCase() !== company.currency.code) {
        try {
          const conversion = await convertCurrency(
            parseFloat(updates.amount.value),
            updates.amount.currency.toUpperCase(),
            company.currency.code
          );
          
          updateData['amount.converted'] = {
            value: conversion.convertedAmount,
            currency: company.currency.code,
            exchangeRate: conversion.exchangeRate,
            convertedAt: conversion.convertedAt
          };
        } catch (conversionError) {
          console.error('Currency conversion failed:', conversionError);
        }
      }
    }

    expense.auditLog.push({
      action: 'modified',
      performedBy: userId,
      details: 'Expense updated',
      previousValues: expense.toObject(),
      timestamp: new Date()
    });

    Object.assign(expense, updateData);
    await expense.save();

    await expense.populate([
      { path: 'employeeId', select: 'firstName lastName email' },
      { path: 'approvalFlow.approverId', select: 'firstName lastName email role' }
    ]);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

// Delete expense (only for draft status)
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.userId;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.employeeId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (expense.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete expense in current status'
      });
    }

    if (expense.receipt && expense.receipt.path) {
      const fs = require('fs');
      
      try {
        if (fs.existsSync(expense.receipt.path)) {
          fs.unlinkSync(expense.receipt.path);
        }
      } catch (fileError) {
        console.error('Failed to delete receipt file:', fileError);
      }
    }

    await Expense.findByIdAndDelete(expenseId);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

// Export expenses
exports.exportExpenses = async (req, res) => {
  try {
    const {
      format = 'csv',
      startDate,
      endDate,
      status,
      category,
      employeeId
    } = req.query;

    const userId = req.user.userId;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    let filter = { companyId };

    if (userRole === 'employee') {
      filter.employeeId = userId;
    } else if (employeeId && userRole !== 'admin') {
      const employee = await User.findById(employeeId);
      if (!employee || employee.managerId?.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      filter.employeeId = employeeId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'firstName lastName email department')
      .populate('companyId', 'name currency')
      .sort({ expenseDate: -1 });

    if (format === 'csv') {
      const csv = require('csv-stringify');
      
      const csvData = expenses.map(expense => [
        expense._id,
        `${expense.employeeId.firstName} ${expense.employeeId.lastName}`,
        expense.employeeId.email,
        expense.employeeId.department || '',
        expense.category,
        expense.description,
        expense.merchantName || '',
        expense.expenseDate.toISOString().split('T')[0],
        expense.totalAmount,
        expense.companyId.currency.code,
        expense.status,
        expense.submittedAt.toISOString().split('T')[0],
        expense.finalApprovedAt ? expense.finalApprovedAt.toISOString().split('T')[0] : ''
      ]);

      csvData.unshift([
        'Expense ID',
        'Employee Name',
        'Employee Email',
        'Department',
        'Category',
        'Description',
        'Merchant',
        'Expense Date',
        'Amount',
        'Currency',
        'Status',
        'Submitted Date',
        'Approved Date'
      ]);

      csv.stringify(csvData, (err, output) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Failed to generate CSV',
            error: err.message
          });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=expenses-${Date.now()}.csv`);
        res.send(output);
      });
    } else {
      res.json({
        success: true,
        data: { expenses }
      });
    }

  } catch (error) {
    console.error('Export expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export expenses',
      error: error.message
    });
  }
};
