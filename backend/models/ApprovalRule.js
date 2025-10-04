const mongoose = require('mongoose');

const approvalRuleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    maxlength: [100, 'Rule name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  conditions: {
    amountRange: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: Number.MAX_SAFE_INTEGER
      }
    },
    categories: [{
      type: String,
      enum: ['travel', 'meals', 'accommodation', 'transportation', 'office_supplies', 'entertainment', 'other']
    }],
    departments: [String],
    employeeRoles: [{
      type: String,
      enum: ['employee', 'manager', 'admin']
    }]
  },
  approvalFlow: [{
    sequence: {
      type: Number,
      required: true,
      min: 1
    },
    approverType: {
      type: String,
      enum: ['manager', 'specific_user', 'role_based', 'department_head'],
      required: true
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approverRole: {
      type: String,
      enum: ['manager', 'admin', 'finance']
    },
    department: String,
    isRequired: {
      type: Boolean,
      default: true
    },
    autoApprove: {
      type: Boolean,
      default: false
    }
  }],
  conditionalRules: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    rules: [{
      type: {
        type: String,
        enum: ['percentage', 'specific_approver', 'hybrid'],
        required: true
      },
      percentage: {
        type: Number,
        min: 1,
        max: 100,
        validate: {
          validator: function(v) {
            return this.type !== 'percentage' || (v >= 1 && v <= 100);
          },
          message: 'Percentage must be between 1 and 100'
        }
      },
      specificApproverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        validate: {
          validator: function(v) {
            return this.type !== 'specific_approver' || v != null;
          },
          message: 'Specific approver is required for specific_approver rule type'
        }
      },
      priority: {
        type: Number,
        default: 1,
        min: 1
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
approvalRuleSchema.index({ companyId: 1, isActive: 1, priority: 1 });
approvalRuleSchema.index({ 'conditions.amountRange.min': 1, 'conditions.amountRange.max': 1 });

// Method to check if rule applies to expense
approvalRuleSchema.methods.appliesTo = function(expense, employee) {
  const amount = expense.amount.converted?.value || expense.amount.original.value;
  if (amount < this.conditions.amountRange.min || amount > this.conditions.amountRange.max) {
    return false;
  }

  if (this.conditions.categories.length > 0 && !this.conditions.categories.includes(expense.category)) {
    return false;
  }

  if (this.conditions.departments.length > 0 && !this.conditions.departments.includes(employee.department)) {
    return false;
  }

  if (this.conditions.employeeRoles.length > 0 && !this.conditions.employeeRoles.includes(employee.role)) {
    return false;
  }

  return true;
};

// Static method to find applicable rules
approvalRuleSchema.statics.findApplicableRules = async function(companyId, expense, employee) {
  const rules = await this.find({
    companyId,
    isActive: true
  }).populate('approvalFlow.approverId').sort({ priority: 1 });

  return rules.filter(rule => rule.appliesTo(expense, employee));
};

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
