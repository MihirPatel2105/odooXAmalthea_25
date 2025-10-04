const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  currency: {
    code: {
      type: String,
      required: [true, 'Currency code is required']
    },
    name: {
      type: String,
      required: [true, 'Currency name is required']
    },
    symbol: {
      type: String,
      required: [true, 'Currency symbol is required']
    }
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Remove required: true - we'll set this after user creation
  },
  settings: {
    maxExpenseAmount: {
      type: Number,
      default: 10000
    },
    autoApprovalLimit: {
      type: Number,
      default: 100
    },
    isManagerApprover: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
