import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardStats from '../../components/dashboard/DashboardStats';
import ExpenseChart from '../../components/dashboard/ExpenseChart';
import RecentActivity from '../../components/dashboard/RecentActivity';
import QuickActions from '../../components/dashboard/QuickActions';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch different data based on user role
        if (user?.role === 'admin') {
          const response = await get('/admin/dashboard');
          setDashboardData(response.data);
        } else {
          // For regular users, fetch their expense data
          const [expensesResponse, analyticsResponse] = await Promise.all([
            get('/expenses/my?limit=5'),
            get('/expenses/analytics')
          ]);
          
          setDashboardData({
            expenses: expensesResponse.data.expenses,
            summary: expensesResponse.data.summary,
            analytics: analyticsResponse.data
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-primary-100">
          Here's what's happening with your expenses today.
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Dashboard Stats */}
      <DashboardStats data={dashboardData} />

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExpenseChart data={dashboardData?.analytics} />
        <RecentActivity data={dashboardData?.expenses || dashboardData?.recentActivity} />
      </div>
    </div>
  );
};

export default Dashboard;
