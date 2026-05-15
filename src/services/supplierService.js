import api from "./api";

// CREATE SUPPLIER
export const createSupplier = (data) =>
    api.post("/suppliers", data);

// GET ALL SUPPLIERS
export const getSuppliers = () =>
    api.get("/suppliers");

// GET SINGLE SUPPLIER
export const getSupplier = (id) =>
    api.get(`/suppliers/${id}`);

// UPDATE SUPPLIER
export const updateSupplier = (id, data) =>
    api.put(`/suppliers/${id}`, data);

// DELETE (SOFT DELETE)
export const deleteSupplier = (id) =>
    api.delete(`/suppliers/${id}`);

// UPDATE PAYMENT
export const updateSupplierPayment = (id, data) =>
    api.patch(`/suppliers/${id}/payment`, data);

export const getSupplierPayments = (id) =>
    api.get(`/suppliers/${id}/payments`);

export const addSupplierPurchase = (id, data) =>
    api.patch(`/suppliers/${id}/purchase`, data);