import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarIcon,
  TagIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../common/Button';
import ApprovalModal from './ApprovalModal';

const ApprovalCard = ({ expense, onApprovalAction }) => {
  const [showModal, setShowModal] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      processing: 'badge-primary'
    };
    
    return badges[status] || 'badge-primary';
  };

  const handleApprovalAction = async (action, comments) => {
    if (onApprovalAction) {
      await onApprovalAction(expense._id, action, comments);
    }
    setShowModal(false);
  };

  return (
    <>
      <div className="card hover:shadow-lg transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {expense.description}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              ID: {expense._id.slice(-8)}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(expense.status)}`}>
            {expense.status}
          </span>
        </div>

        {/* Employee Info */}
        <div className="flex items-center space-x-2 mb-3">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {expense.employeeId?.firstName} {expense.employeeId?.lastName}
          </span>
          {expense.employeeId?.department && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {expense.employeeId.department}
              </span>
            </>
          )}
        </div>

        {/* Expense Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {formatDate(expense.expenseDate)}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <TagIcon className="h-4 w-4 mr-2" />
            {expense.category.replace('_', ' ').toUpperCase()}
          </div>
          
          {expense.merchantName && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4 h-4 mr-2 flex items-center justify-center">🏪</span>
              {expense.merchantName}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(expense.amount?.converted?.value || expense.amount?.original?.value)}
          </p>
          {expense.amount?.converted && expense.amount.original.currency !== expense.amount.converted.currency && (
            <p className="text-sm text-gray-500">
              Original: {formatCurrency(expense.amount.original.value)} {expense.amount.original.currency}
            </p>
          )}
        </div>

        {/* Receipt Indicator */}
        {expense.receipt && (
          <div className="mb-4">
            <div className="flex items-center text-sm text-green-600">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Receipt attached
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link to={`/expenses/${expense._id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full" icon={<EyeIcon className="h-4 w-4" />}>
              View Details
            </Button>
          </Link>
          
          <Button
            variant="success"
            size="sm"
            onClick={() => setShowModal(true)}
            icon={<CheckCircleIcon className="h-4 w-4" />}
          >
            Review
          </Button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex space-x-2 mt-3">
          <Button
            variant="success"
            size="sm"
            className="flex-1"
            onClick={() => handleApprovalAction('approved', 'Quick approval')}
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={() => setShowModal(true)}
          >
            <XCircleIcon className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>

        {/* Submitted Time */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Submitted {formatDate(expense.submittedAt)}
          </p>
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        expense={expense}
        onApprove={(expenseId, comments) => handleApprovalAction('approved', comments)}
        onReject={(expenseId, comments) => handleApprovalAction('rejected', comments)}
      />
    </>
  );
};

export default ApprovalCard;
