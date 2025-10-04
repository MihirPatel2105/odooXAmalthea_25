import React, { useState, useEffect } from 'react';
import { CalendarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import ExpenseChart from '../dashboard/ExpenseChart';
import { useApi } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/formatters';
import { downloadFile } from '../../utils/helpers';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    reportType: 'summary',
    startDate: '',
    endDate: '',
    groupBy: 'month'
  });
  const { get } = useApi();

  const reportTypes = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'category', label: 'Category Report' },
    { value: 'employee', label: 'Employee Report' }
  ];

  const groupByOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'year', label: 'Yearly' }
  ];

  const generateReport = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await get(`/admin/reports?${queryParams}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = 'csv') => {
    try {
      const queryParams = new URLSearchParams({ ...filters, format }).toString();
      const response = await get(`/admin/reports/export?${queryParams}`, {
        responseType: 'blob'
      });
      
      const filename = `expense-report-${Date.now()}.${format}`;
      downloadFile(response.data, filename);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Expense Reports</h2>
        <p className="mt-1 text-sm text-gray-600">
          Generate detailed reports and analytics for company expenses.
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Report Type</label>
            <select
              className="input"
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Group By</label>
            <select
              className="input"
              value={filters.groupBy}
              onChange={(e) => handleFilterChange('groupBy', e.target.value)}
            >
              {groupByOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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
        </div>

        <div className="mt-6 flex justify-between">
          <Button
            onClick={generateReport}
            loading={loading}
            icon={<CalendarIcon className="h-4 w-4" />}
          >
            Generate Report
          </Button>
          
          {reportData && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => exportReport('csv')}
                icon={<DocumentArrowDownIcon className="h-4 w-4" />}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => exportReport('pdf')}
                icon={<DocumentArrowDownIcon className="h-4 w-4" />}
              >
                Export PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Report Results */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {reportData && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {filters.reportType === 'summary' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card text-center">
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reportData.data?.reduce((sum, item) => sum + item.totalExpenses, 0) || 0}
                </p>
              </div>
              <div className="card text-center">
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(reportData.data?.reduce((sum, item) => sum + item.totalAmount, 0) || 0)}
                </p>
              </div>
              <div className="card text-center">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-green-600">
                  {reportData.data?.reduce((sum, item) => sum + item.approvedExpenses, 0) || 0}
                </p>
              </div>
              <div className="card text-center">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {reportData.data?.reduce((sum, item) => sum + item.pendingExpenses, 0) || 0}
                </p>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart data={{ expensesByPeriod: reportData.data }} />
          </div>

          {/* Data Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    {filters.reportType === 'summary' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approved
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.data?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.totalExpenses || item.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      {filters.reportType === 'summary' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            {item.approvedExpenses}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                            {item.pendingExpenses}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
