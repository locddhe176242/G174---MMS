import apiClient from "./apiClient";

export const rfqService = {
  // Get all RFQs (no pagination) - nếu cần
  getAllRFQs: async () => {
    const response = await apiClient.get("/rfqs");
    return response.data;
  },

  // Get RFQs with pagination
  getRFQsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/rfqs/page", {
      params: { page, size, sort }
    });
    return response.data;
  },

  // Search RFQs (no pagination) - nếu cần
  searchRFQs: async (keyword) => {
    const response = await apiClient.get("/rfqs/search", {
      params: { keyword }
    });
    return response.data;
  },

  // Search RFQs with pagination
  searchRFQsWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/rfqs/search/page", {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },

  // Get RFQ by ID
  getRFQById: async (id) => {
    const response = await apiClient.get(`/rfqs/${id}`);
    return response.data;
  },

  // Create RFQ
  createRFQ: async (rfqData) => {
    const response = await apiClient.post("/rfqs", rfqData);
    return response.data;
  },

  // Update RFQ
  updateRFQ: async (id, rfqData) => {
    const response = await apiClient.put(`/rfqs/${id}`, rfqData);
    return response.data;
  },

  // Delete RFQ (soft delete nếu backend hỗ trợ)
  deleteRFQ: async (id) => {
    const response = await apiClient.delete(`/rfqs/${id}`);
    return response.data;
  },

  // Optional: Generate RFQ number (nếu backend có)
  generateRFQNo: async () => {
    const response = await apiClient.get("/rfqs/generate-number");
    return response.data;
  },
};

export default rfqService;