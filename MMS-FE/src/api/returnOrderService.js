import apiClient from "./apiClient";

export const returnOrderService = {
  getAllReturnOrders: async (params = {}) => {
    const response = await apiClient.get("/return-orders/all", { params });
    return response.data;
  },

  getReturnOrder: async (id) => {
    const response = await apiClient.get(`/return-orders/${id}`);
    return response.data;
  },

  createReturnOrder: async (data) => {
    const response = await apiClient.post("/return-orders", data);
    return response.data;
  },

  updateReturnOrder: async (id, data) => {
    const response = await apiClient.put(`/return-orders/${id}`, data);
    return response.data;
  },

  deleteReturnOrder: async (id) => {
    await apiClient.delete(`/return-orders/${id}`);
  },

  changeStatus: async (id, status) => {
    const response = await apiClient.patch(`/return-orders/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  createFromDelivery: async (deliveryId) => {
    const response = await apiClient.post(`/return-orders/convert/${deliveryId}`);
    return response.data;
  },
};

