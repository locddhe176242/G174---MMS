import apiClient from "./apiClient";

export const goodsReceiptService = {
  getGoodsReceiptsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/goods-receipts/page", {
      params: { page, size, sort }
    });
    return response.data;
  },

  searchGoodsReceiptsWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/goods-receipts/search/page", {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },

  getGoodsReceiptById: async (id) => {
    const response = await apiClient.get(`/goods-receipts/${id}`);
    return response.data;
  },

  createGoodsReceipt: async (payload) => {
    const response = await apiClient.post("/goods-receipts", payload);
    return response.data;
  },

  updateGoodsReceipt: async (id, payload) => {
    const response = await apiClient.put(`/goods-receipts/${id}`, payload);
    return response.data;
  },

  deleteGoodsReceipt: async (id) => {
    const response = await apiClient.delete(`/goods-receipts/${id}`);
    return response.data;
  },

  approveGoodsReceipt: async (id) => {
    const response = await apiClient.post(`/goods-receipts/${id}/approve`);
    return response.data;
  },

  rejectGoodsReceipt: async (id, reason) => {
    const response = await apiClient.post(`/goods-receipts/${id}/reject`, { reason });
    return response.data;
  },

  generateReceiptNo: async () => {
    const response = await apiClient.get("/goods-receipts/generate-number");
    return response.data;
  },

  getReceiptItems: async (id) => {
    const response = await apiClient.get(`/goods-receipts/${id}/items`);
    return response.data;
  }
};

export default goodsReceiptService;


