import apiClient from "./apiClient";

const BASE_PATH = "/purchase/rfqs";

export const rfqService = {
  // Lấy danh sách RFQ có phân trang
  getRFQsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get(BASE_PATH, {
      params: { page, size, sort },
    });
    return response.data;
  },

  // Tìm kiếm RFQ có phân trang
  searchRFQsWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get(`${BASE_PATH}/search`, {
      params: { keyword, page, size, sort },
    });
    return response.data;
  },

  // Lấy chi tiết RFQ
  getRFQById: async (id) => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // Tạo RFQ mới
  createRFQ: async (rfqData) => {
    const response = await apiClient.post(BASE_PATH, rfqData);
    return response.data;
  },

  // Cập nhật RFQ
  updateRFQ: async (id, rfqData) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}`, rfqData);
    return response.data;
  },

  // Xóa (soft delete) RFQ
  deleteRFQ: async (id) => {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },

  // Sinh số RFQ tự động
  generateRFQNo: async () => {
    const response = await apiClient.get(`${BASE_PATH}/generate-number`);
    return response.data;
  },
};

export default rfqService;