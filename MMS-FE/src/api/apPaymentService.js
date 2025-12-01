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
};

export default apPaymentService;
