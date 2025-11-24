import apiClient from "./apiClient";

export const apPaymentService = {
  getPaymentsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/ap-payments/page", {
      params: { page, size, sort }
    });
    return response.data;
  },

  searchPaymentsWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/ap-payments/search/page", {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await apiClient.get(`/ap-payments/${id}`);
    return response.data;
  },

  createPayment: async (payload) => {
    const response = await apiClient.post("/ap-payments", payload);
    return response.data;
  },

  updatePayment: async (id, payload) => {
    const response = await apiClient.put(`/ap-payments/${id}`, payload);
    return response.data;
  },

  deletePayment: async (id) => {
    const response = await apiClient.delete(`/ap-payments/${id}`);
    return response.data;
  },

  getInvoices: async (params = {}) => {
    const response = await apiClient.get("/ap-invoices", { params });
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await apiClient.get(`/ap-invoices/${id}`);
    return response.data;
  },
};

export default apPaymentService;

