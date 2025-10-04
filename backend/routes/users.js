const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');
const {
  getCompanyUsers,
  createUser,
  updateUser,
  changePassword,
  deactivateUser,
  getUserStats,
  getTeamMembers
} = require('../controllers/userController');

// Validation rules for user creation
const validateUserCreation = [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['employee', 'manager', 'admin']).withMessage('Invalid role')
];

// Validation rules for password change
const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// @route   GET /api/users
// @desc    Get company users
// @access  Private (Manager, Admin)
router.get('/', authenticate, authorize('manager', 'admin'), getCompanyUsers);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', 
  authenticate,
  authorize('admin'),
  validateUserCreation,
  handleValidationErrors,
  createUser
);

// @route   GET /api/users/team
// @desc    Get team members
// @access  Private (Manager, Admin)
router.get('/team', authenticate, authorize('manager', 'admin'), getTeamMembers);

// @route   GET /api/users/:userId/stats
// @desc    Get user statistics
// @access  Private (Owner, Manager of user, Admin)
router.get('/:userId/stats', authenticate, getUserStats);

// @route   PUT /api/users/:userId
// @desc    Update user
// @access  Private (Admin, or user updating themselves)
router.put('/:userId', authenticate, updateUser);

// @route   POST /api/users/change-password
// @desc    Change password
// @access  Private
router.post('/change-password', 
  authenticate,
  validatePasswordChange,
  handleValidationErrors,
  changePassword
);

// @route   POST /api/users/:userId/deactivate
// @desc    Deactivate user
// @access  Private (Admin only)
router.post('/:userId/deactivate', authenticate, authorize('admin'), deactivateUser);

module.exports = router;
