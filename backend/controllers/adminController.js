const User = require('../models/User');
const Company = require('../models/Company');
const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');
const mongoose = require('mongoose');

// Get company dashboard statistics
exports.getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const [
      totalUsers,
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      monthlyExpenses,
      topCategories,
      recentActivity
    ] = await Promise.all([
      // Total users
      User.countDocuments({ companyId, isActive: true }),

      // Total expenses
      Expense.countDocuments({ companyId }),

      // Pending expenses
      Expense.countDocuments({ companyId, status: 'pending' }),

      // Approved expenses
      Expense.countDocuments({ companyId, status: 'approved' }),

      // Rejected expenses
      Expense.countDocuments({ companyId, status: 'rejected' }),

      // Monthly expenses (last 12 months)
      Expense.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            expenseDate: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$expenseDate' },
              month: { $month: '$expenseDate' }
            },
            count: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),

      // Top expense categories
      Expense.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 }
      ]),

      // Recent activity
      Expense.find({ companyId })
        .populate('employeeId', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .limit(10)
        .select('employeeId category amount status submittedAt')
    ]);

    // Calculate total amounts
    const totalAmounts = await Expense.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: '$status',
          totalAmount: {
            $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
          }
        }
      }
    ]);

    const amountsByStatus = {};
    totalAmounts.forEach(item => {
      amountsByStatus[item._id] = item.totalAmount;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalExpenses,
          pendingExpenses,
          approvedExpenses,
          rejectedExpenses,
          totalAmount: (amountsByStatus.approved || 0) + (amountsByStatus.pending || 0),
          approvedAmount: amountsByStatus.approved || 0,
          pendingAmount: amountsByStatus.pending || 0
        },
        monthlyExpenses,
        topCategories,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Get company dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: error.message
    });
  }
};

// Get all expenses for admin
exports.getAllExpenses = async (req, res) => {
  try {
    const {
      status,
      category,
      employeeId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const companyId = req.user.companyId;

    const filter = { companyId };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (employeeId) filter.employeeId = employeeId;
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
    console.error('Get all expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses',
      error: error.message
    });
  }
};

// Override expense approval (Admin only)
exports.overrideApproval = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { action, comments } = req.body;
    const adminId = req.user.userId;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approved" or "rejected"'
      });
    }

    const expense = await Expense.findById(expenseId)
      .populate('employeeId', 'firstName lastName email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Override all pending approvals
    expense.approvalFlow.forEach(approval => {
      if (approval.status === 'pending') {
        approval.status = action;
        approval.comments = `Admin override: ${comments || 'No comments'}`;
        approval.actionDate = new Date();
      }
    });

    expense.status = action;
    if (action === 'approved') {
      expense.finalApprovedAt = new Date();
    } else {
      expense.rejectedAt = new Date();
      expense.rejectionReason = comments || 'Admin override';
    }

    expense.auditLog.push({
      action: `admin_override_${action}`,
      performedBy: adminId,
      details: `Admin override: ${action}${comments ? ': ' + comments : ''}`,
      timestamp: new Date()
    });

    await expense.save();

    res.json({
      success: true,
      message: `Expense ${action} by admin override`,
      data: { expense }
    });

  } catch (error) {
    console.error('Override approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override approval',
      error: error.message
    });
  }
};

// Get company settings
exports.getCompanySettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await Company.findById(companyId)
      .populate('adminId', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: { company }
    });

  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve company settings',
      error: error.message
    });
  }
};

// Update company settings
exports.updateCompanySettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const updates = req.body;

    const allowedUpdates = [
      'name',
      'settings.maxExpenseAmount',
      'settings.autoApprovalLimit',
      'settings.isManagerApprover'
    ];

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Apply updates
    if (updates.name) company.name = updates.name;
    if (updates.settings) {
      if (updates.settings.maxExpenseAmount !== undefined) {
        company.settings.maxExpenseAmount = updates.settings.maxExpenseAmount;
      }
      if (updates.settings.autoApprovalLimit !== undefined) {
        company.settings.autoApprovalLimit = updates.settings.autoApprovalLimit;
      }
      if (updates.settings.isManagerApprover !== undefined) {
        company.settings.isManagerApprover = updates.settings.isManagerApprover;
      }
    }

    await company.save();

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: { company }
    });

  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company settings',
      error: error.message
    });
  }
};

// Create approval rule
exports.createApprovalRule = async (req, res) => {
  try {
    const {
      name,
      description,
      conditions,
      approvalFlow,
      conditionalRules,
      priority
    } = req.body;

    const companyId = req.user.companyId;
    const createdBy = req.user.userId;

    const approvalRule = new ApprovalRule({
      companyId,
      name,
      description,
      conditions,
      approvalFlow,
      conditionalRules,
      priority: priority || 1,
      createdBy,
      isActive: true
    });

    await approvalRule.save();

    await approvalRule.populate([
      { path: 'approvalFlow.approverId', select: 'firstName lastName email role' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Approval rule created successfully',
      data: { approvalRule }
    });

  } catch (error) {
    console.error('Create approval rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create approval rule',
      error: error.message
    });
  }
};

// Get approval rules
exports.getApprovalRules = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const companyId = req.user.companyId;

    const filter = { companyId };
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rules, total] = await Promise.all([
      ApprovalRule.find(filter)
        .populate('approvalFlow.approverId', 'firstName lastName email role')
        .populate('createdBy', 'firstName lastName email')
        .populate('lastModifiedBy', 'firstName lastName email')
        .sort({ priority: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ApprovalRule.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        rules,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve approval rules',
      error: error.message
    });
  }
};

// Update approval rule
exports.updateApprovalRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    const lastModifiedBy = req.user.userId;

    const rule = await ApprovalRule.findById(ruleId);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Approval rule not found'
      });
    }

    const allowedUpdates = [
      'name', 'description', 'conditions', 'approvalFlow', 
      'conditionalRules', 'priority', 'isActive'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        rule[field] = updates[field];
      }
    });

    rule.lastModifiedBy = lastModifiedBy;
    await rule.save();

    await rule.populate([
      { path: 'approvalFlow.approverId', select: 'firstName lastName email role' },
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'lastModifiedBy', select: 'firstName lastName email' }
    ]);

    res.json({
      success: true,
      message: 'Approval rule updated successfully',
      data: { rule }
    });

  } catch (error) {
    console.error('Update approval rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update approval rule',
      error: error.message
    });
  }
};

// Delete approval rule
exports.deleteApprovalRule = async (req, res) => {
  try {
    const { ruleId } = req.params;

    const rule = await ApprovalRule.findById(ruleId);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Approval rule not found'
      });
    }

    await ApprovalRule.findByIdAndDelete(ruleId);

    res.json({
      success: true,
      message: 'Approval rule deleted successfully'
    });

  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete approval rule',
      error: error.message
    });
  }
};

// Get expense reports
exports.getExpenseReports = async (req, res) => {
  try {
    const {
      reportType = 'summary',
      startDate,
      endDate,
      groupBy = 'month'
    } = req.query;

    const companyId = req.user.companyId;

    let matchStage = { companyId: new mongoose.Types.ObjectId(companyId) };

    if (startDate || endDate) {
      matchStage.expenseDate = {};
      if (startDate) matchStage.expenseDate.$gte = new Date(startDate);
      if (endDate) matchStage.expenseDate.$lte = new Date(endDate);
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

    let reportData;

    if (reportType === 'summary') {
      reportData = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: groupByFormat, date: '$expenseDate' } },
            totalExpenses: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            },
            approvedExpenses: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            approvedAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'approved'] },
                  { $ifNull: ['$amount.converted.value', '$amount.original.value'] },
                  0
                ]
              }
            },
            pendingExpenses: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            rejectedExpenses: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } else if (reportType === 'category') {
      reportData = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              period: { $dateToString: { format: groupByFormat, date: '$expenseDate' } },
              category: '$category'
            },
            count: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            }
          }
        },
        { $sort: { '_id.period': 1, '_id.category': 1 } }
      ]);
    } else if (reportType === 'employee') {
      reportData = await Expense.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        {
          $group: {
            _id: {
              period: { $dateToString: { format: groupByFormat, date: '$expenseDate' } },
              employeeId: '$employeeId',
              employeeName: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] }
            },
            count: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
            }
          }
        },
        { $sort: { '_id.period': 1, '_id.employeeName': 1 } }
      ]);
    }

    res.json({
      success: true,
      data: {
        reportType,
        groupBy,
        dateRange: { startDate, endDate },
        data: reportData
      }
    });

  } catch (error) {
    console.error('Get expense reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate expense reports',
      error: error.message
    });
  }
};
