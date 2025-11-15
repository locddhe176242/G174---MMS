import apiClient from "./apiClient";

export const purchaseOrderService = {
  // Get all Purchase Orders (no pagination)
  getAllPurchaseOrders: async () => {
    const response = await apiClient.get("/purchase-orders");
    return response.data;
  },

  // Get Purchase Orders with pagination
  getPurchaseOrdersWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/purchase-orders/page", {
      params: { page, size, sort }
    });
    return response.data;
  },

  // Search Purchase Orders (no pagination)
  searchPurchaseOrders: async (keyword) => {
    const response = await apiClient.get("/purchase-orders/search", {
      params: { keyword }
    });
    return response.data;
  },

  // Search Purchase Orders with pagination
  searchPurchaseOrdersWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/purchase-orders/search/page", {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },

  // Get Purchase Order by ID
  getPurchaseOrderById: async (id) => {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data;
  },

  // Create Purchase Order
  createPurchaseOrder: async (orderData) => {
    const response = await apiClient.post("/purchase-orders", orderData);
    return response.data;
  },

  // Update Purchase Order
  updatePurchaseOrder: async (id, orderData) => {
    const response = await apiClient.put(`/purchase-orders/${id}`, orderData);
    return response.data;
  },

  // Delete Purchase Order (soft delete if backend supports)
  deletePurchaseOrder: async (id) => {
    const response = await apiClient.delete(`/purchase-orders/${id}`);
    return response.data;
  },

  // Approve Purchase Order
  approvePurchaseOrder: async (id, approverId) => {
    const response = await apiClient.post(`/purchase-orders/${id}/approve`, {
      approverId
    });
    return response.data;
  },

  // Reject Purchase Order
  rejectPurchaseOrder: async (id, approverId, reason) => {
    const response = await apiClient.post(`/purchase-orders/${id}/reject`, {
      approverId,
      reason
    });
    return response.data;
  },

  // Send Purchase Order
  sendPurchaseOrder: async (id) => {
    const response = await apiClient.post(`/purchase-orders/${id}/send`);
    return response.data;
  },

  // Generate PO number (if backend has)
  generatePONo: async () => {
    const response = await apiClient.get("/purchase-orders/generate-number");
    return response.data;
  },
};

export default purchaseOrderService;

