import React from 'react';
import { Link } from 'react-router-dom';
import { 
  EyeIcon, 
  PencilIcon, 
  DocumentIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { STATUS_BADGES } from '../../utils/constants';
import Button from '../common/Button';

const ExpenseCard = ({ expense }) => {
  // Safely handle expense object
  if (!expense) {
    return null;
  }

  const getStatusBadge = (status) => {
    return STATUS_BADGES[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category) => {
    return <TagIcon className="h-4 w-4" />;
  };

  const canEdit = expense.status === 'draft' || expense.status === 'rejected';

  // Safely get amount value
  const getAmount = () => {
    if (expense.amount?.converted?.value) {
      return expense.amount.converted.value;
    }
    if (expense.amount?.original?.value) {
      return expense.amount.original.value;
    }
    return 0;
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getCategoryIcon(expense.category)}
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {expense.description || 'No description'}
          </h3>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(expense.status)}`}>
          {expense.status || 'unknown'}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {expense.expenseDate ? formatDate(expense.expenseDate) : 'No date'}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <TagIcon className="h-4 w-4 mr-2" />
          {expense.category ? expense.category.replace('_', ' ').toUpperCase() : 'NO CATEGORY'}
        </div>
        
        {expense.merchantName && (
          <div className="flex items-center text-sm text-gray-600">
            <DocumentIcon className="h-4 w-4 mr-2" />
            {expense.merchantName}
          </div>
        )}
        
        {expense.receipt && (
          <div className="flex items-center text-sm text-green-600">
            <DocumentIcon className="h-4 w-4 mr-2" />
            Receipt attached
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(getAmount())}
          </p>
          {expense.amount?.converted && expense.amount?.original && (
            <p className="text-sm text-gray-500">
              Original: {formatCurrency(expense.amount.original.value)} {expense.amount.original.currency}
            </p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Link to={`/expenses/${expense._id}`}>
            <Button variant="outline" size="sm" icon={<EyeIcon className="h-4 w-4" />}>
              View
            </Button>
          </Link>
          
          {canEdit && (
            <Link to={`/expenses/${expense._id}/edit`}>
              <Button variant="secondary" size="sm" icon={<PencilIcon className="h-4 w-4" />}>
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Approval Progress */}
      {expense.approvalFlow && expense.approvalFlow.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Approval Progress</span>
            <span className="text-gray-900">
              {expense.approvalFlow.filter(a => a.status === 'approved').length} / {expense.approvalFlow.length}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(expense.approvalFlow.filter(a => a.status === 'approved').length / expense.approvalFlow.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCard;
