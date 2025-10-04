import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ApprovalModal = ({ isOpen, onClose, expense, onApprove, onReject }) => {
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const handleApproval = async (data) => {
    setLoading(true);
    try {
      if (action === 'approve') {
        await onApprove(expense._id, data.comments);
      } else {
        await onReject(expense._id, data.comments);
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Approval action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (actionType) => {
    setAction(actionType);
  };

  if (!expense) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Expense"
      size="lg"
    >
      <div className="space-y-6">
        {/* Expense Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Expense Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Description:</span>
              <p className="font-medium">{expense.description}</p>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>
              <p className="font-medium">
                {formatCurrency(expense.amount?.converted?.value || expense.amount?.original?.value)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Category:</span>
              <p className="font-medium">{expense.category}</p>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <p className="font-medium">{formatDate(expense.expenseDate)}</p>
            </div>
            <div>
              <span className="text-gray-500">Employee:</span>
              <p className="font-medium">
                {expense.employeeId?.firstName} {expense.employeeId?.lastName}
              </p>
            </div>
            {expense.merchantName && (
              <div>
                <span className="text-gray-500">Merchant:</span>
                <p className="font-medium">{expense.merchantName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Receipt */}
        {expense.receipt && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Receipt</h4>
            <a
              href={`/uploads/${expense.receipt.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-500 text-sm"
            >
              View Receipt ({expense.receipt.originalName})
            </a>
          </div>
        )}

        {/* Action Form */}
        <form onSubmit={handleSubmit(handleApproval)}>
          <div className="mb-4">
            <label className="label">Comments</label>
            <textarea
              className="input"
              rows="3"
              placeholder={action === 'reject' ? 'Please provide a reason for rejection...' : 'Add any comments (optional)...'}
              {...register('comments', {
                required: action === 'reject' ? 'Comments are required for rejection' : false
              })}
            />
            {errors.comments && (
              <p className="mt-1 text-sm text-red-600">{errors.comments.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => handleAction('reject')}
              disabled={loading}
            >
              Reject
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={loading && action === 'approve'}
              onClick={() => handleAction('approve')}
              disabled={loading}
            >
              Approve
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ApprovalModal;
