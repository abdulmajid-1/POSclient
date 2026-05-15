import api from './api';

export const getDashboardStats = (params) => api.get('/dashboard/stats', { params });
