import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ExpenseList from '../../components/expenses/ExpenseList';
import ExpenseFilters from '../../components/expenses/ExpenseFilters';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 12,
    search: ''
  });
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState(null);
  
  const { get } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await get(`/expenses/my?${queryParams.toString()}`);
      setExpenses(response.data.expenses || []);
      setPagination(response.data.pagination || {});
      setSummary(response.data.summary || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      category: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 12,
      search: ''
    });
    setSearchTerm('');
  };

  // Calculate summary totals
  const summaryTotals = summary?.reduce((acc, item) => {
    acc.count += item.count;
    acc.totalAmount += item.totalAmount;
    return acc;
  }, { count: 0, totalAmount: 0 }) || { count: 0, totalAmount: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Expenses</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track and manage all your expense submissions
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            icon={<FunnelIcon className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          
          <Link to="/expenses/create">
            <Button
              variant="primary"
              icon={<PlusIcon className="h-4 w-4" />}
            >
              New Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && summary.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card text-center">
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <p className="text-2xl font-semibold text-gray-900">{summaryTotals.count}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm font-medium text-gray-500">Total Amount</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${summaryTotals.totalAmount.toLocaleString()}
            </p>
          </div>
          {summary.map((item) => (
            <div key={item._id} className="card text-center">
              <p className="text-sm font-medium text-gray-500 capitalize">
                {item._id} Expenses
              </p>
              <p className="text-xl font-semibold text-gray-900">{item.count}</p>
              <p className="text-sm text-gray-600">
                ${item.totalAmount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
          />
        </div>
      </div>

      {showFilters && (
        <div className="card">
          <ExpenseFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <ExpenseList expenses={expenses} loading={loading} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && expenses.length === 0 && (
        <div className="card text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.status || filters.category 
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by creating your first expense.'
            }
          </p>
          <div className="mt-6">
            {filters.search || filters.status || filters.category ? (
              <Button onClick={handleResetFilters} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Link to="/expenses/create">
                <Button variant="primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Expense
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesList;
