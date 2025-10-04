import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';

const ExpenseDetail = () => {
// Helper for status badge CSS class
function getStatusBadge(status) {
  switch (status) {
    case 'approved': return 'badge-success';
    case 'pending': return 'badge-warning';
    case 'rejected': return 'badge-danger';
    default: return 'badge-secondary';
  }
}
  const { id } = useParams();
  const { get } = useApi();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        const response = await get(`/expenses/${id}`);
        setExpense(response.data);
      } catch (error) {
        console.error('Failed to fetch expense:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id, get]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900">Expense not found</h3>
        <p className="mt-1 text-sm text-gray-500">The expense you are looking for does not exist.</p>
        <Link to="/expenses">
          <Button variant="primary">Back to Expenses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
      <div className="mt-6 space-y-4">
        <div className="card">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="text-gray-900">{expense.description}</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Amount</h2>
          <p className="text-gray-900">{
            (() => {
              const amt = expense.amount;
              if (typeof amt === 'number' || typeof amt === 'string') {
                return formatCurrency(Number(amt) || 0);
              }
              if (amt?.converted?.value !== undefined) {
                return formatCurrency(amt.converted.value);
              }
              if (amt?.original?.value !== undefined) {
                return formatCurrency(amt.original.value);
              }
              if (amt?.original && typeof amt.original === 'number') {
                return formatCurrency(amt.original);
              }
              // If amt is an object with only {original}, try to extract a primitive
              if (amt && typeof amt === 'object' && 'original' in amt) {
                const val = amt.original;
                if (typeof val === 'number' || typeof val === 'string') {
                  return formatCurrency(Number(val) || 0);
                }
              }
              return 'N/A';
            })()
          }</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Category</h2>
          <p className="text-gray-900">{expense.category}</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Merchant Name</h2>
          <p className="text-gray-900">{expense.merchantName || 'N/A'}</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Expense Date</h2>
          <p className="text-gray-900">{formatDate(expense.expenseDate)}</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Status</h2>
          <span className={`badge ${getStatusBadge(expense.status)}`}>{expense.status}</span>
        </div>

        <div className="flex justify-between">
          <Link to={`/expenses/${id}/edit`}>
            <Button variant="secondary">Edit Expense</Button>
          </Link>
          <Link to="/expenses">
            <Button variant="outline">Back to Expenses</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetail;
