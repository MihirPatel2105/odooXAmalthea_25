const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');
const {
  getCompanyDashboard,
  getAllExpenses,
  overrideApproval,
  getCompanySettings,
  updateCompanySettings,
  createApprovalRule,
  getApprovalRules,
  updateApprovalRule,
  deleteApprovalRule,
  getExpenseReports
} = require('../controllers/adminController');

// Validation rules for approval rule creation
const validateApprovalRule = [
  body('name').trim().isLength({ min: 2 }).withMessage('Rule name must be at least 2 characters'),
  body('conditions.amountRange.min').isFloat({ min: 0 }).withMessage('Minimum amount must be positive'),
  body('conditions.amountRange.max').isFloat({ min: 0 }).withMessage('Maximum amount must be positive'),
  body('approvalFlow').isArray({ min: 1 }).withMessage('At least one approval step is required'),
  body('approvalFlow.*.sequence').isInt({ min: 1 }).withMessage('Sequence must be a positive integer'),
  body('approvalFlow.*.approverType').isIn(['manager', 'specific_user', 'role_based', 'department_head']).withMessage('Invalid approver type')
];

// Validation rules for company settings update
const validateCompanySettings = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('settings.maxExpenseAmount').optional().isFloat({ min: 0 }).withMessage('Max expense amount must be positive'),
  body('settings.autoApprovalLimit').optional().isFloat({ min: 0 }).withMessage('Auto approval limit must be positive')
];

// @route   GET /api/admin/dashboard
// @desc    Get company dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', authenticate, authorize('admin'), getCompanyDashboard);

// @route   GET /api/admin/expenses
// @desc    Get all expenses for admin
// @access  Private (Admin only)
router.get('/expenses', authenticate, authorize('admin'), getAllExpenses);

// @route   POST /api/admin/expenses/:expenseId/override
// @desc    Override expense approval (Admin only)
// @access  Private (Admin only)
router.post('/expenses/:expenseId/override', authenticate, authorize('admin'), overrideApproval);

// @route   GET /api/admin/settings
// @desc    Get company settings
// @access  Private (Admin only)
router.get('/settings', authenticate, authorize('admin'), getCompanySettings);

// @route   PUT /api/admin/settings
// @desc    Update company settings
// @access  Private (Admin only)
router.put('/settings', 
  authenticate, 
  authorize('admin'), 
  validateCompanySettings,
  handleValidationErrors,
  updateCompanySettings
);

// @route   POST /api/admin/approval-rules
// @desc    Create approval rule
// @access  Private (Admin only)
router.post('/approval-rules', 
  authenticate,
  authorize('admin'),
  validateApprovalRule,
  handleValidationErrors,
  createApprovalRule
);

// @route   GET /api/admin/approval-rules
// @desc    Get approval rules
// @access  Private (Admin only)
router.get('/approval-rules', authenticate, authorize('admin'), getApprovalRules);

// @route   PUT /api/admin/approval-rules/:ruleId
// @desc    Update approval rule
// @access  Private (Admin only)
router.put('/approval-rules/:ruleId', 
  authenticate,
  authorize('admin'),
  validateApprovalRule,
  handleValidationErrors,
  updateApprovalRule
);

// @route   DELETE /api/admin/approval-rules/:ruleId
// @desc    Delete approval rule
// @access  Private (Admin only)
router.delete('/approval-rules/:ruleId', authenticate, authorize('admin'), deleteApprovalRule);

// @route   GET /api/admin/reports
// @desc    Get expense reports
// @access  Private (Admin only)
router.get('/reports', authenticate, authorize('admin'), getExpenseReports);

module.exports = router;
