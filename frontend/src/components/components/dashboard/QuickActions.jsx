import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  ClipboardDocumentCheckIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const QuickActions = () => {
  const { user } = useAuth();

  const actions = [
    {
      name: 'New Expense',
      href: '/expenses/create',
      icon: PlusIcon,
      description: 'Submit a new expense',
      color: 'bg-primary-600 hover:bg-primary-700'
    },
    {
      name: 'View Expenses',
      href: '/expenses',
      icon: DocumentTextIcon,
      description: 'See all your expenses',
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  // Add manager/admin specific actions
  if (user?.role === 'manager' || user?.role === 'admin') {
    actions.push(
      {
        name: 'Pending Approvals',
        href: '/approvals',
        icon: ClipboardDocumentCheckIcon,
        description: 'Review pending expenses',
        color: 'bg-yellow-600 hover:bg-yellow-700'
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: ChartBarIcon,
        description: 'View expense analytics',
        color: 'bg-purple-600 hover:bg-purple-700'
      }
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.name}
          to={action.href}
          className={`${action.color} text-white rounded-xl p-6 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
        >
          <div className="flex items-center">
            <action.icon className="h-8 w-8" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold">{action.name}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;