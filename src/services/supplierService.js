import api from "./api";

export const getSuppliers = () => api.get("/suppliers");
export const createSupplier = (data) => api.post("/suppliers", data);