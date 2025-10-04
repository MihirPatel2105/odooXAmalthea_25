import api from './api';

const adminService = {
  // Dashboard
  async getDashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Expenses Management
  async getAllExpenses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/expenses?${queryString}`);
    return response.data;
  },

  async overrideApproval(expenseId, action, comments) {
    const response = await api.post(`/admin/expenses/${expenseId}/override`, {
      action,
      comments
    });
    return response.data;
  },

  // Company Settings
  async getCompanySettings() {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  async updateCompanySettings(settings) {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  // Approval Rules
  async createApprovalRule(ruleData) {
    const response = await api.post('/admin/approval-rules', ruleData);
    return response.data;
  },

  async getApprovalRules(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/approval-rules?${queryString}`);
    return response.data;
  },

  async getApprovalRule(id) {
    const response = await api.get(`/admin/approval-rules/${id}`);
    return response.data;
  },

  async updateApprovalRule(id, ruleData) {
    const response = await api.put(`/admin/approval-rules/${id}`, ruleData);
    return response.data;
  },

  async deleteApprovalRule(id) {
    const response = await api.delete(`/admin/approval-rules/${id}`);
    return response.data;
  },

  async toggleApprovalRule(id, isActive) {
    const response = await api.patch(`/admin/approval-rules/${id}`, { isActive });
    return response.data;
  },

  // Reports
  async getReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/reports?${queryString}`);
    return response.data;
  },

  async exportReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/reports/export?${queryString}`, {
      responseType: 'blob'
    });
    return response;
  },

  // User Management (Admin specific)
  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/users?${queryString}`);
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  async deactivateUser(id) {
    const response = await api.post(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  async reactivateUser(id) {
    const response = await api.post(`/admin/users/${id}/reactivate`);
    return response.data;
  },

  async resetUserPassword(id, newPassword) {
    const response = await api.post(`/admin/users/${id}/reset-password`, {
      newPassword
    });
    return response.data;
  },

  // Company Analytics
  async getCompanyAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/analytics?${queryString}`);
    return response.data;
  },

  // Bulk Operations
  async bulkApproveExpenses(expenseIds, comments = '') {
    const response = await api.post('/admin/expenses/bulk-approve', {
      expenseIds,
      comments
    });
    return response.data;
  },

  async bulkRejectExpenses(expenseIds, comments) {
    const response = await api.post('/admin/expenses/bulk-reject', {
      expenseIds,
      comments
    });
    return response.data;
  },

  // System Settings
  async getSystemSettings() {
    const response = await api.get('/admin/system-settings');
    return response.data;
  },

  async updateSystemSettings(settings) {
    const response = await api.put('/admin/system-settings', settings);
    return response.data;
  },

  // Audit Logs
  async getAuditLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/audit-logs?${queryString}`);
    return response.data;
  },

  // Email Templates
  async getEmailTemplates() {
    const response = await api.get('/admin/email-templates');
    return response.data;
  },

  async updateEmailTemplate(templateId, templateData) {
    const response = await api.put(`/admin/email-templates/${templateId}`, templateData);
    return response.data;
  },

  // Notifications
  async sendBulkNotification(notificationData) {
    const response = await api.post('/admin/notifications/bulk', notificationData);
    return response.data;
  },

  // Data Export
  async exportAllData(format = 'csv') {
    const response = await api.get(`/admin/export/all?format=${format}`, {
      responseType: 'blob'
    });
    return response;
  },

  async exportUserData(userId, format = 'csv') {
    const response = await api.get(`/admin/export/user/${userId}?format=${format}`, {
      responseType: 'blob'
    });
    return response;
  },

  // System Health
  async getSystemHealth() {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  async getSystemStats() {
    const response = await api.get('/admin/system/stats');
    return response.data;
  }
};

export default adminService;
