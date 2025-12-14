import apiClient from "./apiClient";

const BASE_PATH = "/sales/orders";

export const salesOrderService = {
  getOrders: async (params = {}) => {
    const response = await apiClient.get(BASE_PATH, { params });
    return response.data;
  },

  getAllOrders: async (params = {}) => {
    const response = await apiClient.get(`${BASE_PATH}/all`, { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  createOrder: async (payload) => {
    const response = await apiClient.post(BASE_PATH, payload);
    return response.data;
  },

  updateOrder: async (id, payload) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}`, payload);
    return response.data;
  },

  changeApprovalStatus: async (id, newApprovalStatus) => {
    const response = await apiClient.patch(`${BASE_PATH}/${id}/approval-status`, null, {
      params: { approvalStatus: newApprovalStatus },
    });
    return response.data;
  },

  submitForApproval: async (id) => {
    const response = await apiClient.post(`${BASE_PATH}/${id}/submit-for-approval`);
    return response.data;
  },

  deleteOrder: async (id) => {
    const response = await apiClient.delete(`${BASE_PATH}/${id}`);
    return response.data;
  },

  createFromQuotation: async (quotationId) => {
    const response = await apiClient.post(`${BASE_PATH}/from-quotation/${quotationId}`);
    return response.data;
  },
};

export default salesOrderService;