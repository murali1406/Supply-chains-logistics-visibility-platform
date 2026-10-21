import api from "./api";

export const shipmentApi = {
  getAll: (params) => api.get("/shipments", { params }),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post("/shipments", data),
  update: (id, data) => api.put(`/shipments/${id}`, data),
  updateStatus: (id, status) => api.patch(`/shipments/${id}/status`, { status }),
  delete: (id) => api.delete(`/shipments/${id}`),
};
