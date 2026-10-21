import api from "./api";

export const stockMovementApi = {
  getAll: (params) => api.get("/stock-movements", { params }),
  getById: (id) => api.get(`/stock-movements/${id}`),
  getByInventory: (inventoryId) => api.get(`/stock-movements/inventory/${inventoryId}`),
};
