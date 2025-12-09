import apiClient from "./apiClient";

const BASE_PATH = "/deliveries";

export const deliveryService = {
  getDeliveries: async (params = {}) => {
    const response = await apiClient.get(BASE_PATH, { params });
    return response.data;
  },

  getAllDeliveries: async (params = {}) => {
    const response = await apiClient.get(`${BASE_PATH}/all`, { params });
    return response.data;
  },

  getDeliveryById: async (id) => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  createDelivery: async (payload) => {
    const response = await apiClient.post(BASE_PATH, payload);
    return response.data;
  },

  updateDelivery: async (id, payload) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}`, payload);
    return response.data;
  },

  changeStatus: async (id, status) => {
    const response = await apiClient.patch(`${BASE_PATH}/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  deleteDelivery: async (id) => {
    const response = await apiClient.delete(`${BASE_PATH}/${id}`);
    return response.data;
  },
};

export default deliveryService;