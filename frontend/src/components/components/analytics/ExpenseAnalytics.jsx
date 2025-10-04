import React, { useState, useEffect } from 'react';
import CategoryChart from './CategoryChart';
import TrendChart from './TrendChart';
import Input from '../common/Input';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/formatters';

const ExpenseAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'month'
  });
  const { get } = useApi();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await get(`/expenses/analytics?${queryParams}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Expense Analytics</h2>
        <p className="mt-1 text-sm text-gray-600">
          Analyze your expense patterns and trends.
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
          <div>
            <label className="label">Group By</label>
            <select
              className="input"
              value={filters.groupBy}
              onChange={(e) => handleFilterChange('groupBy', e.target.value)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </div>

      {/* Summary Stats */}
      {analyticsData?.totalStats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card text-center">
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <p className="text-2xl font-semibold text-gray-900">
              {analyticsData.totalStats.totalExpenses}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm font-medium text-gray-500">Total Amount</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(analyticsData.totalStats.totalAmount)}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm font-medium text-gray-500">Average Amount</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(analyticsData.totalStats.avgAmount)}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm font-medium text-gray-500">Highest Expense</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(analyticsData.totalStats.maxAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={analyticsData?.expensesByPeriod} />
        <CategoryChart data={analyticsData?.expensesByCategory} />
      </div>

      {/* Status Breakdown */}
      {analyticsData?.expensesByStatus && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {analyticsData.expensesByStatus.map((status) => (
              <div key={status._id} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500 capitalize">
                  {status._id} Expenses
                </p>
                <p className="text-xl font-semibold text-gray-900">
                  {status.count}
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(status.totalAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseAnalytics;
