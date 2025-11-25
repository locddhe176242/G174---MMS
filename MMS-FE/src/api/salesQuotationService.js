import apiClient from "./apiClient";

const BASE_PATH = "/sales/quotations";

export const salesQuotationService = {
  getQuotations: async (params = {}) => {
    const response = await apiClient.get(BASE_PATH, { params });
    return response.data;
  },

  getAllQuotations: async (params = {}) => {
    const response = await apiClient.get(`${BASE_PATH}/all`, { params });
    return response.data;
  },

  getQuotationById: async (id) => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  createQuotation: async (payload) => {
    const response = await apiClient.post(BASE_PATH, payload);
    return response.data;
  },

  updateQuotation: async (id, payload) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}`, payload);
    return response.data;
  },

  changeStatus: async (id, status) => {
    const response = await apiClient.patch(`${BASE_PATH}/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  deleteQuotation: async (id) => {
    const response = await apiClient.delete(`${BASE_PATH}/${id}`);
    return response.data;
  },
};

export default salesQuotationService;
