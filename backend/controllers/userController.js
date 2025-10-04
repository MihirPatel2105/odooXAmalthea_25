const User = require('../models/User');
const Company = require('../models/Company');
const Expense = require('../models/Expense');
const { sendEmail } = require('../utils/emailService');
const mongoose = require('mongoose');

// Get all users in company (Admin/Manager only)
exports.getCompanyUsers = async (req, res) => {
  try {
    const { 
      role, 
      department, 
      isActive = true, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const companyId = req.user.companyId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    let filter = { companyId };

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (userRole === 'manager') {
      filter.$or = [
        { managerId: userId },
        { _id: userId }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('managerId', 'firstName lastName email')
        .select('-password -refreshToken')
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

// Create new user (Admin only)
exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      managerId,
      approvalLimit
    } = req.body;

    const companyId = req.user.companyId;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    if (managerId) {
      const manager = await User.findOne({ 
        _id: managerId, 
        companyId, 
        role: { $in: ['manager', 'admin'] },
        isActive: true 
      });
      
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager assignment'
        });
      }
    }

    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: role || 'employee',
      department,
      companyId,
      approvalLimit: approvalLimit || 0,
      isActive: true
    };

    if (managerId) {
      userData.managerId = managerId;
    }

    const user = new User(userData);
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Welcome to Expense Management System',
      template: 'userCreated',
      data: {
        firstName,
        companyName: 'Your Company',
        temporaryPassword: password,
        loginUrl: process.env.FRONTEND_URL
      }
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user (Admin only, or user updating themselves)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    const canUpdate = currentUserRole === 'admin' || currentUserId === userId;
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let allowedUpdates;
    if (currentUserRole === 'admin') {
      allowedUpdates = [
        'firstName', 'lastName', 'department', 'role', 
        'managerId', 'approvalLimit', 'isActive'
      ];
    } else {
      allowedUpdates = ['firstName', 'lastName', 'department'];
    }

    const updateData = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (updates.managerId) {
      const manager = await User.findOne({ 
        _id: updates.managerId, 
        companyId: user.companyId, 
        role: { $in: ['manager', 'admin'] },
        isActive: true 
      });
      
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager assignment'
        });
      }
    }

    Object.assign(user, updateData);
    await user.save();

    await user.populate('managerId', 'firstName lastName email');

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Deactivate user (Admin only)
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const pendingExpenses = await Expense.countDocuments({
      employeeId: userId,
      status: { $in: ['pending', 'processing'] }
    });

    if (pendingExpenses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot deactivate user with ${pendingExpenses} pending expenses`
      });
    }

    user.isActive = false;
    user.refreshToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    const canView = currentUserRole === 'admin' || 
                   currentUserId === userId ||
                   (currentUserRole === 'manager' && await User.findOne({ 
                     _id: userId, 
                     managerId: currentUserId 
                   }));

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [
      totalStats,
      monthlyStats,
      categoryStats,
      recentExpenses
    ] = await Promise.all([
      Expense.aggregate([
        { $match: { employeeId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: 1 },
            totalAmount: {
              $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
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
            pendingAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'pending'] },
                  { $ifNull: ['$amount.converted.value', '$amount.original.value'] },
                  0
                ]
              }
            }
          }
        }
      ]),

      Expense.aggregate([
        {
          $match: {
            employeeId: new mongoose.Types.ObjectId(userId),
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
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      Expense.aggregate([
        { $match: { employeeId: new mongoose.Types.ObjectId(userId) } },
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

      Expense.find({ employeeId: userId })
        .sort({ submittedAt: -1 })
        .limit(5)
        .select('category description amount status submittedAt')
    ]);

    res.json({
      success: true,
      data: {
        totalStats: totalStats[0] || {
          totalExpenses: 0,
          totalAmount: 0,
          approvedAmount: 0,
          pendingAmount: 0
        },
        monthlyStats,
        categoryStats,
        recentExpenses
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user statistics',
      error: error.message
    });
  }
};

// Get user's team members (Manager only)
exports.getTeamMembers = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'manager' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    const teamMembers = await User.find({ 
      managerId,
      isActive: true 
    })
    .select('-password -refreshToken')
    .sort({ firstName: 1, lastName: 1 });

    const teamStats = await Promise.all(
      teamMembers.map(async (member) => {
        const stats = await Expense.aggregate([
          { $match: { employeeId: member._id } },
          {
            $group: {
              _id: null,
              totalExpenses: { $sum: 1 },
              totalAmount: {
                $sum: { $ifNull: ['$amount.converted.value', '$amount.original.value'] }
              },
              pendingExpenses: {
                $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
              }
            }
          }
        ]);

        return {
          user: member,
          stats: stats[0] || {
            totalExpenses: 0,
            totalAmount: 0,
            pendingExpenses: 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: { teamMembers: teamStats }
    });

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team members',
      error: error.message
    });
  }
};
