import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';

const ExpenseList = ({ expenses = [], loading = false }) => {
  const statusIcons = {
    pending: <ClockIcon className="h-5 w-5 text-yellow-500" />,
    approved: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    rejected: <XCircleIcon className="h-5 w-5 text-red-500" />,
    paid: <CheckCircleIcon className="h-5 w-5 text-blue-500" />
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    paid: 'bg-blue-100 text-blue-800'
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating your first expense.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {expenses.map((expense) => (
        <div key={expense._id || expense.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {expense.description || 'Untitled Expense'}
                </h3>
                {statusIcons[expense.status] || statusIcons.pending}
              </div>
              
              <p className="text-sm text-gray-500 mt-1">
                {expense.category} • {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
              </p>
              
              <div className="mt-2">
                <span className="text-xl font-semibold text-gray-900">
                  ${expense.amount || 0}
                </span>
              </div>
              
              <div className="mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[expense.status] || statusColors.pending}`}>
                  {(expense.status || 'pending').charAt(0).toUpperCase() + (expense.status || 'pending').slice(1)}
                </span>
              </div>
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <Link to={`/expenses/${expense._id || expense.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<EyeIcon className="h-4 w-4" />}
                  aria-label="View expense"
                />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;
