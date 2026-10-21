import api from "./api";

export const activityApi = {
  getAll: (params) => api.get("/activity", { params }),
};
