const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const { getCurrencyByCountry } = require('../utils/currencyService');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
  
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d'
  });
  
  return { accessToken, refreshToken };
};

// Register new user and company
// Register new user and company
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, country } = req.body;

    if (!email || !password || !firstName || !lastName || !companyName || !country) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const currencyInfo = await getCurrencyByCountry(country);
    if (!currencyInfo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid country selected'
      });
    }

    // Create company first WITHOUT adminId
    const company = new Company({
      name: companyName,
      country,
      currency: currencyInfo
      // Don't set adminId yet
    });

    const savedCompany = await company.save();

    // Create admin user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      companyId: savedCompany._id
    });

    const savedUser = await user.save();

    // Now update company with admin ID
    savedCompany.adminId = savedUser._id;
    await savedCompany.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(savedUser._id);

    // Save refresh token
    savedUser.refreshToken = refreshToken;
    await savedUser.save();

    // Send welcome email (optional - skip if email not configured)
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Expense Management System',
        template: 'welcome',
        data: {
          firstName,
          companyName
        }
      });
    } catch (emailError) {
      console.log('Email sending failed (non-critical):', emailError.message);
      // Continue without failing the registration
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          companyId: savedUser.companyId
        },
        company: {
          id: savedCompany._id,
          name: savedCompany.name,
          country: savedCompany.country,
          currency: savedCompany.currency
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email, isActive: true })
      .populate('companyId')
      .populate('managerId', 'firstName lastName email');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          companyId: user.companyId._id,
          managerId: user.managerId
        },
        company: {
          id: user.companyId._id,
          name: user.companyId.name,
          country: user.companyId.country,
          currency: user.companyId.currency
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('companyId')
      .populate('managerId', 'firstName lastName email')
      .select('-password -refreshToken');

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};
