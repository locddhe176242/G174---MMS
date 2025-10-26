import apiClient from "./apiClient";

const BASE_PATH = "/warehouses";

export const warehouseService = {
	getAllWarehouses: async () => {
		const response = await apiClient.get(`${BASE_PATH}`);
		return response.data;
	},

	getWarehousesWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
		const response = await apiClient.get(`${BASE_PATH}/page`, {
			params: { page, size, sort }
		});
		return response.data;
	},

	searchWarehouses: async (keyword = "") => {
		const response = await apiClient.get(`${BASE_PATH}/search`, {
			params: { keyword }
		});
		return response.data;
	},

	searchWarehousesWithPagination: async (keyword = "", page = 0, size = 10, sort = "createdAt,desc") => {
		const response = await apiClient.get(`${BASE_PATH}/search/page`, {
			params: { keyword, page, size, sort }
		});
		return response.data;
	},

	getWarehouseById: async (id) => {
		const response = await apiClient.get(`${BASE_PATH}/${id}`);
		return response.data;
	},

	createWarehouse: async (data, createdById) => {
		const response = await apiClient.post(`${BASE_PATH}`, data, {
			params: createdById != null ? { createdById } : undefined,
		});
		return response.data;
	},

	updateWarehouse: async (id, data, updatedById) => {
		const response = await apiClient.put(`${BASE_PATH}/${id}`, data, {
			params: updatedById != null ? { updatedById } : undefined,
		});
		return response.data;
	},

	deactivateWarehouse: async (id) => {
		const response = await apiClient.patch(`${BASE_PATH}/${id}/deactivate`);
		return response.data;
	},

	restoreWarehouse: async (id) => {
		const response = await apiClient.patch(`${BASE_PATH}/${id}/restore`);
		return response.data;
	},

	deleteWarehouse: async (id) => {
		const response = await apiClient.delete(`${BASE_PATH}/${id}`);
		return response.data;
	},

	existsByCode: async (code) => {
		const response = await apiClient.get(`${BASE_PATH}/exists/${encodeURIComponent(code)}`);
		return response.data;
	},
};

export default warehouseService;
