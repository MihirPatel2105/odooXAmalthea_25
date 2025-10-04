import React from 'react';
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES } from '../../utils/constants';
import Button from '../common/Button';
import Input from '../common/Input';

const ExpenseFilters = ({ filters = {}, onFilterChange, onReset }) => {
  // Provide default values to prevent undefined errors
  const safeFilters = {
    status: '',
    category: '',
    startDate: '',
    endDate: '',
    ...filters
  };

  const handleFilterChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange({ [key]: value });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={safeFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {EXPENSE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={safeFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="From Date"
          type="date"
          value={safeFilters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
        />

        <Input
          label="To Date"
          type="date"
          value={safeFilters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default ExpenseFilters;
