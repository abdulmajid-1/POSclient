import api from './api';

// @desc    Get all expenses (with filters, pagination)
export const getExpenses = (params) => {
    return api.get('/expenses', { params });
};

// @desc    Create new expense
export const createExpense = (data) => {
    return api.post('/expenses', data);
};

// @desc    Update expense
export const updateExpense = (id, data) => {
    return api.put(`/expenses/${id}`, data);
};

// @desc    Delete expense
export const deleteExpense = (id) => {
    return api.delete(`/expenses/${id}`);
};