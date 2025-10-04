import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ExpenseChart = ({ data }) => {
  // Monthly expense chart data
  const monthlyData = {
    labels: data?.expensesByPeriod?.map(item => {
      const [year, month] = item._id.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    }) || [],
    datasets: [
      {
        label: 'Expenses',
        data: data?.expensesByPeriod?.map(item => item.totalAmount) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 8,
      }
    ]
  };

  // Category distribution chart data
  const categoryData = {
    labels: data?.expensesByCategory?.map(item => 
      item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('_', ' ')
    ) || [],
    datasets: [
      {
        data: data?.expensesByCategory?.map(item => item.totalAmount) || [],
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
          '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Monthly Expenses Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Expenses</h3>
        </div>
        <div className="h-64">
          <Bar data={monthlyData} options={chartOptions} />
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
        </div>
        <div className="h-64">
          <Doughnut data={categoryData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;