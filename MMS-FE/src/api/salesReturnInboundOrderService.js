import apiClient from "./apiClient";

export const salesReturnInboundOrderService = {
  // Tạo Đơn nhập hàng lại từ Đơn trả hàng
  createFromReturnOrder: async (payload) => {
    const response = await apiClient.post(
      "/sales-return-inbound-orders/from-return-order",
      payload
    );
    return response.data;
  },

  // Lấy tất cả Đơn nhập hàng lại (active)
  getAll: async () => {
    const response = await apiClient.get("/sales-return-inbound-orders/all");
    return response.data;
  },

  // Lấy chi tiết theo ID
  getById: async (id) => {
    const response = await apiClient.get(`/sales-return-inbound-orders/${id}`);
    return response.data;
  },

  // Lấy danh sách theo Đơn trả hàng
  getByReturnOrder: async (roId) => {
    const response = await apiClient.get(
      `/sales-return-inbound-orders/by-return-order/${roId}`
    );
    return response.data;
  },
};

