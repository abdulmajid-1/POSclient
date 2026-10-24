import api from './api';

export const login = (credentials) => api.post('auth/login', credentials);
export const getCaptcha = () => api.get('/auth/captcha');
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const changePassword = (data) => api.put('/auth/change-password', data);
