import UserCreate from './pages/admin/UserCreate';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Expense Pages
import ExpensesList from './pages/expenses/ExpensesList';
import CreateExpense from './pages/expenses/CreateExpense';
import ExpenseDetail from './pages/expenses/ExpenseDetail';

// Approval Pages
import Approvals from './pages/approvals/Approvals';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import AdminReports from './pages/admin/AdminReports';
import UserEdit from './pages/admin/UserEdit';

// Profile Pages
import Profile from './pages/profile/Profile';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* Expense Routes */}
                  <Route path="expenses" element={<ExpensesList />} />
                  <Route path="expenses/create" element={<CreateExpense />} />
                  <Route path="expenses/:id" element={<ExpenseDetail />} />
                  
                  {/* Approval Routes */}
                  <Route path="approvals" element={<Approvals />} />
                  
                  {/* Profile Routes */}
                  <Route path="profile" element={<Profile />} />
                  
                  {/* Admin Routes */}
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="admin/users" element={<Users />} />
                  <Route path="admin/users/create" element={<UserCreate />} />
                  <Route path="admin/users/:userId/edit" element={<UserEdit />} />
                  <Route path="admin/settings" element={<Settings />} />
                  <Route path="admin/reports" element={<AdminReports />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    style: {
                      background: '#10b981',
                    },
                  },
                  error: {
                    duration: 5000,
                    style: {
                      background: '#ef4444',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
