const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../middleware/validation');
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile
} = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register new user and company
// @access  Public
router.post('/register', validateRegistration, handleValidationErrors, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, handleValidationErrors, login);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, logout);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, getProfile);

module.exports = router;
