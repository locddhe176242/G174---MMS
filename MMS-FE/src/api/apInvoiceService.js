import apiClient from "./apiClient";

export const apInvoiceService = {
  // ===== Invoice CRUD =====
  createInvoice: async (payload) => {
    const response = await apiClient.post("/ap-invoices", payload);
    return response.data;
  },

  createInvoiceFromGoodsReceipt: async (receiptId) => {
    const response = await apiClient.post(`/ap-invoices/from-goods-receipt/${receiptId}`);
    return response.data;
  },

  getInvoiceById: async (invoiceId) => {
    const response = await apiClient.get(`/ap-invoices/${invoiceId}`);
    return response.data;
  },

  getAllInvoices: async () => {
    const response = await apiClient.get("/ap-invoices");
    return response.data;
  },

  getInvoicesWithPagination: async (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") => {
    const response = await apiClient.get("/ap-invoices/paged", {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  searchInvoices: async (keyword) => {
    const response = await apiClient.get("/ap-invoices/search", {
      params: { keyword }
    });
    return response.data;
  },

  searchInvoicesWithPagination: async (keyword, page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") => {
    const response = await apiClient.get("/ap-invoices/search/paged", {
      params: { keyword, page, size, sortBy, sortDir }
    });
    return response.data;
  },

  updateInvoice: async (invoiceId, payload) => {
    const response = await apiClient.put(`/ap-invoices/${invoiceId}`, payload);
    return response.data;
  },

  deleteInvoice: async (invoiceId) => {
    const response = await apiClient.delete(`/ap-invoices/${invoiceId}`);
    return response.data;
  },

  // ===== Filter by Relations =====
  getInvoicesByVendor: async (vendorId) => {
    const response = await apiClient.get(`/ap-invoices/vendor/${vendorId}`);
    return response.data;
  },

  getInvoicesByPurchaseOrder: async (orderId) => {
    const response = await apiClient.get(`/ap-invoices/purchase-order/${orderId}`);
    return response.data;
  },

  getInvoicesByGoodsReceipt: async (receiptId) => {
    const response = await apiClient.get(`/ap-invoices/goods-receipt/${receiptId}`);
    return response.data;
  },

  getInvoicesByStatus: async (status) => {
    const response = await apiClient.get(`/ap-invoices/status/${status}`);
    return response.data;
  },

  // ===== Invoice Number =====
  checkInvoiceNoExists: async (invoiceNo) => {
    const response = await apiClient.get("/ap-invoices/check-invoice-no", {
      params: { invoiceNo }
    });
    return response.data;
  },

  generateInvoiceNo: async () => {
    const response = await apiClient.get("/ap-invoices/generate-invoice-no");
    return response.data;
  },

};

export default apInvoiceService;
