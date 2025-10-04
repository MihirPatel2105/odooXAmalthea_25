import React from 'react';
import { 
  CalendarIcon, 
  TagIcon, 
  BuildingOfficeIcon,
  DocumentIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ExpenseDetails = ({ expense }) => {
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      processing: 'badge-primary',
      draft: 'bg-gray-100 text-gray-800'
    };
    
    return badges[status] || 'badge-primary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{expense.description}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Submitted on {formatDate(expense.submittedAt)}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(expense.status)}`}>
            {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Amount Details */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Original Amount</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(expense.amount.original.value)} {expense.amount.original.currency}
              </p>
            </div>
          </div>
          
          {expense.amount.converted && (
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Converted Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(expense.amount.converted.value)} {expense.amount.converted.currency}
                </p>
                <p className="text-xs text-gray-400">
                  Rate: {expense.amount.converted.exchangeRate}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Information</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Expense Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(expense.expenseDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <TagIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-sm font-medium text-gray-900">
                {expense.category.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>

          {expense.merchantName && (
            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Merchant</p>
                <p className="text-sm font-medium text-gray-900">
                  {expense.merchantName}
                </p>
              </div>
            </div>
          )}

          {expense.receipt && (
            <div className="flex items-center space-x-3">
              <DocumentIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Receipt</p>
                <a
                  href={`/uploads/${expense.receipt.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View Receipt ({expense.receipt.originalName})
                </a>
              </div>
            </div>
          )}

          {expense.tags && expense.tags.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {expense.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Flow */}
      {expense.approvalFlow && expense.approvalFlow.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Flow</h2>
          <div className="space-y-4">
            {expense.approvalFlow.map((approval, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    approval.status === 'approved' ? 'bg-green-100 text-green-600' :
                    approval.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {approval.approverId?.firstName} {approval.approverId?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{approval.approverRole}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(approval.status)}`}>
                    {approval.status}
                  </span>
                  {approval.actionDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(approval.actionDate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Data */}
      {expense.receipt?.ocrData && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">OCR Analysis</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {expense.receipt.ocrData.extractedAmount && (
                <div>
                  <p className="text-sm text-gray-500">Extracted Amount</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(expense.receipt.ocrData.extractedAmount)}
                  </p>
                </div>
              )}
              
              {expense.receipt.ocrData.merchantName && (
                <div>
                  <p className="text-sm text-gray-500">Detected Merchant</p>
                  <p className="text-sm font-medium text-gray-900">
                    {expense.receipt.ocrData.merchantName}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="text-sm font-medium text-gray-900">
                  {(expense.receipt.ocrData.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetails;
