import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Custom hook for checking permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasRole = (role) => {
    return user?.role === role;
  };
  
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };
  
  const isAdmin = () => hasRole('admin');
  const isManager = () => hasRole('manager');
  const isEmployee = () => hasRole('employee');
  const isAdminOrManager = () => hasAnyRole(['admin', 'manager']);
  
  const canApproveExpenses = () => {
    return isAdminOrManager();
  };
  
  const canManageUsers = () => {
    return isAdmin();
  };
  
  const canViewReports = () => {
    return isAdminOrManager();
  };
  
  const canManageSettings = () => {
    return isAdmin();
  };
  
  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isEmployee,
    isAdminOrManager,
    canApproveExpenses,
    canManageUsers,
    canViewReports,
    canManageSettings
  };
};

export default useAuth;
