import api from './api';

export const getSales = (params) => api.get('/sales', { params });
export const getSale = (id) => api.get(`/sales/${id}`);
export const createSale = (data) => api.post('/sales', data);
export const updateSale = (id, data) => api.put(`/sales/${id}`, data);
export const getDailySummary = () => api.get('/sales/summary/daily');
export const getWeeklySummary = () => api.get('/sales/summary/weekly');
export const getMonthlySummary = () => api.get('/sales/summary/monthly');
