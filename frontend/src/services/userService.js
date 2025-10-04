import api from './api';

const userService = {
  async getCompanyUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/users?${queryString}`);
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async deactivateUser(id) {
    const response = await api.post(`/users/${id}/deactivate`);
    return response.data;
  },

  async getUserStats(id) {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },

  async getTeamMembers() {
    const response = await api.get('/users/team');
    return response.data;
  },

  async changePassword(passwordData) {
    const response = await api.post('/users/change-password', passwordData);
    return response.data;
  }
};

export default userService;
