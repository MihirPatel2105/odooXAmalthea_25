import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import Button from '../common/Button';

const UserCard = ({ user }) => {
  const getStatusBadge = (isActive) => {
    return isActive ? 'badge-success' : 'badge-danger';
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'badge-primary',
      manager: 'badge-warning',
      employee: 'badge-secondary'
    };
    return badges[role] || 'badge-secondary';
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.isActive)}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Role:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
            {user.role}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Department:</span>
          <span className="text-sm font-medium text-gray-900">
            {user.department || 'N/A'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Joined:</span>
          <span className="text-sm text-gray-600">
            {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex justify-between space-x-2">
        <Link to={`/admin/users/${user._id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
        <Link to={`/admin/users/${user._id}/edit`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full">
            Edit
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UserCard;
