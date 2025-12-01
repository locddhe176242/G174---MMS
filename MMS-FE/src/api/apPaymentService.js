import apiClient from "./apiClient";

export const apPaymentService = {
  // ===== Payment CRUD =====
  createPayment: async (payload) => {
    const response = await apiClient.post("/ap-payments", payload);
    return response.data;
  },

  getPaymentsByInvoice: async (invoiceId) => {
    const response = await apiClient.get(`/ap-payments/invoice/${invoiceId}`);
    return response.data;
  },

  // ===== Get all payments with pagination =====
  getAllPayments: async (page = 0, size = 10, sortBy = "paymentDate", sortDir = "desc", keyword = "") => {
    const params = {
      page,
      size,
      sortBy,
      sortDir,
    };
    if (keyword.trim()) {
      params.keyword = keyword.trim();
    }
    const response = await apiClient.get("/ap-payments", { params });
    return response.data;
  },
};

export default apPaymentService;
