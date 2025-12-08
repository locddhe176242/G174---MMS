import apiClient from "./apiClient";

const BASE_PATH = "/warehouse-stocks";

export const warehouseStockService = {
  // Lấy số lượng của một product trong một warehouse cụ thể
  getQuantityByWarehouseAndProduct: async (warehouseId, productId) => {
    const response = await apiClient.get(
      `${BASE_PATH}/warehouse/${warehouseId}/product/${productId}/quantity`
    );
    return response.data;
  },

  // Lấy stock của một product trong một warehouse cụ thể
  getStockByWarehouseAndProduct: async (warehouseId, productId) => {
    const response = await apiClient.get(
      `${BASE_PATH}/warehouse/${warehouseId}/product/${productId}`
    );
    return response.data;
  },

  // Lấy danh sách stock trong một warehouse
  getStockByWarehouse: async (warehouseId) => {
    const response = await apiClient.get(`${BASE_PATH}/warehouse/${warehouseId}`);
    return response.data;
  },
};

export default warehouseStockService;

