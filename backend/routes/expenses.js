const express = require('express');
const router = express.Router();
const { authenticate, authorize, isAdminOrManager } = require('../middleware/auth');
const { validateExpense, handleValidationErrors } = require('../middleware/validation');
const { uploadReceipt, handleUploadError } = require('../middleware/upload');
const {
  submitExpense,
  getMyExpenses,
  getPendingApprovals,
  processApproval,
  getExpenseDetails,
  getExpenseAnalytics,
  updateExpense,
  deleteExpense,
  exportExpenses
} = require('../controllers/expenseController');

// @route   POST /api/expenses
// @desc    Submit new expense
// @access  Private (Employee, Manager, Admin)
router.post('/', 
  authenticate,
  uploadReceipt,
  handleUploadError,
  validateExpense,
  handleValidationErrors,
  submitExpense
);

// @route   GET /api/expenses/my
// @desc    Get current user's expenses
// @access  Private (Employee, Manager, Admin)
router.get('/my', authenticate, getMyExpenses);

// @route   GET /api/expenses/pending-approvals
// @desc    Get pending approvals for manager/admin
// @access  Private (Manager, Admin)
router.get('/pending-approvals', authenticate, isAdminOrManager, getPendingApprovals);

// @route   GET /api/expenses/analytics
// @desc    Get expense analytics
// @access  Private (Manager, Admin)
router.get('/analytics', authenticate, isAdminOrManager, getExpenseAnalytics);

// @route   GET /api/expenses/export
// @desc    Export expenses
// @access  Private (Manager, Admin)
router.get('/export', authenticate, isAdminOrManager, exportExpenses);

// @route   GET /api/expenses/:expenseId
// @desc    Get expense details
// @access  Private (Owner, Approver, Admin)
router.get('/:expenseId', authenticate, getExpenseDetails);

// @route   PUT /api/expenses/:expenseId
// @desc    Update expense (draft/rejected only)
// @access  Private (Owner)
router.put('/:expenseId', 
  authenticate,
  uploadReceipt,
  handleUploadError,
  validateExpense,
  handleValidationErrors,
  updateExpense
);

// @route   DELETE /api/expenses/:expenseId
// @desc    Delete expense (draft only)
// @access  Private (Owner, Admin)
router.delete('/:expenseId', authenticate, deleteExpense);

// @route   POST /api/expenses/:expenseId/approve
// @desc    Approve or reject expense
// @access  Private (Approver)
router.post('/:expenseId/approve', authenticate, processApproval);

module.exports = router;
