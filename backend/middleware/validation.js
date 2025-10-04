const { body, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Registration validation rules
exports.validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  
  body('companyName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Company name must be at least 2 characters long'),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
];

// Login validation rules
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Expense validation rules
exports.validateExpense = [
  body('amount.value')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  
  body('amount.currency')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  
  body('category')
    .isIn(['travel', 'meals', 'accommodation', 'transportation', 'office_supplies', 'entertainment', 'other'])
    .withMessage('Invalid expense category'),
  
  body('description')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Description must be at least 5 characters long'),
  
  body('expenseDate')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const expenseDate = new Date(value);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (expenseDate > today) {
        throw new Error('Expense date cannot be in the future');
      }
      
      if (expenseDate < oneYearAgo) {
        throw new Error('Expense date cannot be more than one year old');
      }
      
      return true;
    })
];
