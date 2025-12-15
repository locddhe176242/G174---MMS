import apiClient from "./apiClient";

export const debtManagementService = {
  /**
   * Lấy danh sách giao dịch công nợ có phân trang
   * @param {number} page - Số trang (bắt đầu từ 0)
   * @param {number} size - Số lượng items mỗi trang
   * @param {string} sort - Thứ tự sắp xếp (format: "field,direction", ví dụ: "transactionDate,desc")
   * @returns {Promise} Response chứa danh sách transactions với pagination info
   */
  getDebtTransactionsWithPagination: async (page = 0, size = 10, sort = "transactionDate,desc") => {
    const response = await apiClient.get("/debt-transactions/page", {
      params: { page, size, sort }
    });
    return response.data;
  },

  /**
   * Tìm kiếm giao dịch công nợ có phân trang
   * @param {string} keyword - Từ khóa tìm kiếm (mã KH/NCC, nội dung giao dịch, etc.)
   * @param {number} page - Số trang (bắt đầu từ 0)
   * @param {number} size - Số lượng items mỗi trang
   * @param {string} sort - Thứ tự sắp xếp (format: "field,direction")
   * @returns {Promise} Response chứa danh sách transactions với pagination info
   */
  searchDebtTransactionsWithPagination: async (keyword = "", page = 0, size = 10, sort = "transactionDate,desc") => {
    const response = await apiClient.get("/debt-transactions/search/page", {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },

  /**
   * Lấy danh sách tổng hợp công nợ theo tháng hiện tại (group by KH/NCC)
   */
  getMonthlySummary: async (page = 0, size = 10) => {
    const response = await apiClient.get("/debt-transactions/summary/page", {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Lấy tất cả giao dịch công nợ (không phân trang)
   * @returns {Promise} Response chứa danh sách tất cả transactions
   */
  getAllDebtTransactions: async () => {
    const response = await apiClient.get("/debt-transactions");
    return response.data;
  },

  /**
   * Tìm kiếm giao dịch công nợ (không phân trang)
   * @param {string} keyword - Từ khóa tìm kiếm
   * @returns {Promise} Response chứa danh sách transactions
   */
  searchDebtTransactions: async (keyword = "") => {
    const response = await apiClient.get("/debt-transactions/search", {
      params: { keyword }
    });
    return response.data;
  },
};

export default debtManagementService;


