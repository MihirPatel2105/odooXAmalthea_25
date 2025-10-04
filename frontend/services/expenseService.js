import api from './api';

const expenseService = {
  async getMyExpenses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/expenses/my?${queryString}`);
    return response.data;
  },

  async createExpense(expenseData) {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  async getExpenseById(id) {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async updateExpense(id, expenseData) {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  async deleteExpense(id) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  async processApproval(id, action, comments) {
    const response = await api.post(`/expenses/${id}/approve`, {
      action,
      comments
    });
    return response.data;
  },

  async getPendingApprovals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/expenses/pending-approvals?${queryString}`);
    return response.data;
  },

  async getAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/expenses/analytics?${queryString}`);
    return response.data;
  },

  async exportExpenses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/expenses/export?${queryString}`, {
      responseType: 'blob'
    });
    return response;
  }
};

export default expenseService;
