import apiClient from "./apiClient";

export const apInvoiceService = {
  // Get all AP Invoices (no pagination)
  getAllInvoices: async () => {
    const response = await apiClient.get("/ap-invoices");
    return response.data;
  },

  // Get AP Invoices with pagination
  getInvoicesWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/ap-invoices/page", {
      params: { page, size, sort }
    });
    return response.data;
  },

  // Search AP Invoices (no pagination)
  searchInvoices: async (keyword) => {
    const response = await apiClient.get("/ap-invoices/search", {
      params: { keyword }
    });
    return response.data;
  },

  // Search AP Invoices with pagination
  searchInvoicesWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/ap-invoices/search/page", {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },

  // Get AP Invoice by ID
  getInvoiceById: async (id) => {
    const response = await apiClient.get(`/ap-invoices/${id}`);
    return response.data;
  },

  // Create AP Invoice
  createInvoice: async (invoiceData) => {
    const response = await apiClient.post("/ap-invoices", invoiceData);
    return response.data;
  },

  // Update AP Invoice
  updateInvoice: async (id, invoiceData) => {
    const response = await apiClient.put(`/ap-invoices/${id}`, invoiceData);
    return response.data;
  },

  // Delete AP Invoice (soft delete if backend supports)
  deleteInvoice: async (id) => {
    const response = await apiClient.delete(`/ap-invoices/${id}`);
    return response.data;
  },

  // Get Invoice Items
  getInvoiceItems: async (id) => {
    const response = await apiClient.get(`/ap-invoices/${id}/items`);
    return response.data;
  },

  // Generate Invoice number (if backend has)
  generateInvoiceNo: async () => {
    const response = await apiClient.get("/ap-invoices/generate-number");
    return response.data;
  },
};

export default apInvoiceService;

