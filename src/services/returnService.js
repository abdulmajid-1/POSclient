import api from './api';

export const getReturns = (params) => api.get('/returns', { params });
export const getReturn = (id) => api.get(`/returns/${id}`);
export const createReturn = (data) => api.post('/returns', data);
export const reportReturnToZatca = (id, otp = '12345') => api.post(`/returns/${id}/report-zatca`, { otp });
