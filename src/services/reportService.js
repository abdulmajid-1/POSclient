import api from './api';

export const getSalesReport = (params) => api.get('/reports/sales', { params });
export const getExpenseReport = (params) => api.get('/reports/expenses', { params });
export const getProfitReport = (params) => api.get('/reports/profit', { params });
export const getInventoryReport = () => api.get('/reports/inventory');
