import api from "./api";

export const inventoryApi = {
  getAll: (params) => api.get("/inventory", { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post("/inventory", data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  updateStock: (id, data) => api.patch(`/inventory/${id}/stock`, data),
  getLowStock: () => api.get("/inventory/low-stock"),
  getOutOfStock: () => api.get("/inventory/out-of-stock"),
};
