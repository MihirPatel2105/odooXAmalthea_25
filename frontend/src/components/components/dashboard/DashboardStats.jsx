import React from 'react';
import { 
  CreditCardIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters';

const DashboardStats = ({ data }) => {
  const stats = [
    {
      name: 'Total Expenses',
      value: data?.overview?.totalExpenses || 0,
      icon: CreditCardIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      name: 'Pending Approval',
      value: data?.overview?.pendingExpenses || 0,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      name: 'Approved',
      value: data?.overview?.approvedExpenses || 0,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      name: 'Rejected',
      value: data?.overview?.rejectedExpenses || 0,
      icon: XCircleIcon,
      color: 'text-red-600',
      bg: 'bg-red-50'
    }
  ];

  const amounts = [
    {
      name: 'Total Amount',
      value: formatCurrency(data?.overview?.totalAmount || 0),
      color: 'text-gray-900'
    },
    {
      name: 'Pending Amount',
      value: formatCurrency(data?.overview?.pendingAmount || 0),
      color: 'text-yellow-600'
    },
    {
      name: 'Approved Amount',
      value: formatCurrency(data?.overview?.approvedAmount || 0),
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Count Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Amount Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {amounts.map((amount) => (
          <div key={amount.name} className="card text-center">
            <p className="text-sm font-medium text-gray-500">{amount.name}</p>
            <p className={`text-3xl font-bold ${amount.color}`}>{amount.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
