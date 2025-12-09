import apiClient from "./apiClient";

export const creditNoteService = {
  getAllCreditNotes: async (params = {}) => {
    const response = await apiClient.get("/credit-notes/all", { params });
    return response.data;
  },

  getCreditNote: async (id) => {
    const response = await apiClient.get(`/credit-notes/${id}`);
    return response.data;
  },

  createCreditNote: async (data) => {
    const response = await apiClient.post("/credit-notes", data);
    return response.data;
  },

  updateCreditNote: async (id, data) => {
    const response = await apiClient.put(`/credit-notes/${id}`, data);
    return response.data;
  },

  deleteCreditNote: async (id) => {
    await apiClient.delete(`/credit-notes/${id}`);
  },

  changeStatus: async (id, status) => {
    const response = await apiClient.patch(`/credit-notes/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  createFromInvoice: async (invoiceId) => {
    const response = await apiClient.post(`/credit-notes/from-invoice/${invoiceId}`);
    return response.data;
  },
};
