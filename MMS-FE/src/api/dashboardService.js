import apiClient from "./apiClient";

const DASHBOARD_API = "/dashboard";

export const dashboardService = {
  // Lấy tất cả thống kê dashboard
  getDashboardStats: async () => {
    const response = await apiClient.get(`${DASHBOARD_API}/stats`);
    return response.data;
  },

  // Lấy sản phẩm sắp hết hàng
  getLowStockProducts: async (limit = 10) => {
    const response = await apiClient.get(`${DASHBOARD_API}/low-stock`, {
      params: { limit }
    });
    return response.data;
  }
};

export default dashboardService;
