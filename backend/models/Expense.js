const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  amount: {
    original: {
      value: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be positive']
      },
      currency: {
        type: String,
        required: [true, 'Currency is required'],
        uppercase: true,
        minlength: 3,
        maxlength: 3
      }
    },
    converted: {
      value: Number,
      currency: String,
      exchangeRate: Number,
      convertedAt: Date
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['travel', 'meals', 'accommodation', 'transportation', 'office_supplies', 'entertainment', 'other'],
      message: 'Invalid expense category'
    },
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [5, 'Description must be at least 5 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  merchantName: {
    type: String,
    trim: true,
    maxlength: [100, 'Merchant name cannot exceed 100 characters']
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    validate: {
      validator: function(date) {
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return date <= now && date >= oneYearAgo;
      },
      message: 'Expense date must be within the last year and not in the future'
    }
  },
  receipt: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    ocrData: {
      extractedText: String,
      merchantName: String,
      extractedAmount: Number,
      extractedDate: Date,
      confidence: Number,
      suggestedCategory: String,
      items: [{
        name: String,
        price: Number
      }],
      additionalData: {
        subtotal: Number,
        taxAmount: Number,
        paymentMethod: String,
        receiptNumber: String,
        address: String,
        phone: String
      },
      processedAt: Date,
      processingTime: Number
    }
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'pending', 'approved', 'rejected', 'processing', 'reimbursed'],
      message: 'Invalid expense status'
    },
    default: 'pending',
    index: true
  },
  approvalFlow: [{
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approverRole: {
      type: String,
      enum: ['manager', 'admin', 'finance'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: {
      type: String,
      maxlength: [500, 'Comments cannot exceed 500 characters']
    },
    actionDate: Date,
    sequence: {
      type: Number,
      required: true,
      min: 1
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  conditionalApproval: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    rules: [{
      type: {
        type: String,
        enum: ['percentage', 'specific_approver', 'hybrid']
      },
      percentage: Number,
      specificApproverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    currentApprovals: Number,
    requiredApprovals: Number
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  finalApprovedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  auditLog: [{
    action: {
      type: String,
      enum: ['created', 'submitted', 'approved', 'rejected', 'modified', 'reimbursed'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    previousValues: mongoose.Schema.Types.Mixed
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
expenseSchema.index({ employeeId: 1, status: 1 });
expenseSchema.index({ companyId: 1, submittedAt: -1 });
expenseSchema.index({ status: 1, submittedAt: -1 });
expenseSchema.index({ 'approvalFlow.approverId': 1, 'approvalFlow.status': 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ category: 1, expenseDate: -1 });

// Virtual for total amount in company currency
expenseSchema.virtual('totalAmount').get(function() {
  return this.amount.converted?.value || this.amount.original.value;
});

// Virtual for current approver
expenseSchema.virtual('currentApprover').get(function() {
  if (this.status !== 'pending') return null;
  if (!Array.isArray(this.approvalFlow)) return null;
  const pendingApproval = this.approvalFlow.find(approval => 
    approval.status === 'pending'
  );
  return pendingApproval?.approverId || null;
});

// Pre-save middleware to add audit log
expenseSchema.pre('save', function(next) {
  if (this.isNew) {
    this.auditLog.push({
      action: 'created',
      performedBy: this.employeeId,
      details: 'Expense created'
    });
  }
  next();
});

// Method to add approval step
expenseSchema.methods.addApprovalStep = function(approverId, approverRole, sequence, isRequired = true) {
  this.approvalFlow.push({
    approverId,
    approverRole,
    sequence,
    isRequired,
    status: 'pending'
  });
  
  this.approvalFlow.sort((a, b) => a.sequence - b.sequence);
};

// Method to process approval
expenseSchema.methods.processApproval = async function(approverId, action, comments = '') {
  const approvalIndex = this.approvalFlow.findIndex(
    approval => approval.approverId.toString() === approverId.toString() && 
                approval.status === 'pending'
  );

  if (approvalIndex === -1) {
    throw new Error('No pending approval found for this user');
  }

  this.approvalFlow[approvalIndex].status = action;
  this.approvalFlow[approvalIndex].comments = comments;
  this.approvalFlow[approvalIndex].actionDate = new Date();

  this.auditLog.push({
    action: action,
    performedBy: approverId,
    details: `Expense ${action}${comments ? ': ' + comments : ''}`,
    timestamp: new Date()
  });

  if (action === 'rejected') {
    this.status = 'rejected';
    this.rejectedAt = new Date();
    this.rejectionReason = comments;
  } else if (action === 'approved') {
    const pendingRequired = this.approvalFlow.filter(
      approval => approval.isRequired && approval.status === 'pending'
    );

    if (pendingRequired.length === 0) {
      this.status = 'approved';
      this.finalApprovedAt = new Date();
    }
  }

  return this.save();
};

// Method to check if expense can be auto-approved
expenseSchema.methods.checkAutoApproval = function(companySettings) {
  if (this.amount.converted?.value <= companySettings.autoApprovalLimit ||
      this.amount.original.value <= companySettings.autoApprovalLimit) {
    this.status = 'approved';
    this.finalApprovedAt = new Date();
    
    this.auditLog.push({
      action: 'approved',
      performedBy: this.employeeId,
      details: 'Auto-approved based on amount threshold',
      timestamp: new Date()
    });
    
    return true;
  }
  return false;
};

module.exports = mongoose.model('Expense', expenseSchema);
