import apiClient from "./apiClient";

const BASE_PATH = "/ar-invoices";

export const invoiceService = {
  getInvoices: async (params = {}) => {
    const response = await apiClient.get(BASE_PATH, { params });
    return response.data;
  },

  getAllInvoices: async () => {
    const response = await apiClient.get(`${BASE_PATH}/all`);
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  createInvoice: async (payload) => {
    const response = await apiClient.post(BASE_PATH, payload);
    return response.data;
  },

  createInvoiceFromDelivery: async (deliveryId) => {
    const response = await apiClient.post(`${BASE_PATH}/from-delivery/${deliveryId}`);
    return response.data;
  },

  updateInvoice: async (id, payload) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}`, payload);
    return response.data;
  },

  deleteInvoice: async (id) => {
    const response = await apiClient.delete(`${BASE_PATH}/${id}`);
    return response.data;
  },

  addPayment: async (invoiceId, payload) => {
    const response = await apiClient.post(`${BASE_PATH}/${invoiceId}/payments`, payload);
    return response.data;
  },

  getPayments: async (invoiceId) => {
    const response = await apiClient.get(`${BASE_PATH}/${invoiceId}/payments`);
    return response.data;
  },
};

export default invoiceService;

