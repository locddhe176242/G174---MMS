import apiClient from "./apiClient";

const BASE_PATH = "/purchase-requisitions";

export const purchaseRequisitionService = {
	// Generate requisition number
	generateRequisitionNo: async () => {
		const response = await apiClient.get(`${BASE_PATH}/generate-number`);
		return response.data;
	},

	// Check if requisition number exists
	existsByRequisitionNo: async (requisitionNo) => {
		const response = await apiClient.get(`${BASE_PATH}/exists/${encodeURIComponent(requisitionNo)}`);
		return response.data;
	},

	// Get all requisitions
	getAllRequisitions: async () => {
		const response = await apiClient.get(`${BASE_PATH}`);
		return response.data;
	},

	// Get requisitions with pagination
	getRequisitionsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
		const response = await apiClient.get(`${BASE_PATH}/page`, {
			params: { page, size, sort }
		});
		return response.data;
	},

	// Search requisitions
	searchRequisitions: async (keyword = "") => {
		const response = await apiClient.get(`${BASE_PATH}/search`, {
			params: { keyword }
		});
		return response.data;
	},

	// Search requisitions with pagination
	searchRequisitionsWithPagination: async (keyword = "", page = 0, size = 10, sort = "createdAt,desc") => {
		const response = await apiClient.get(`${BASE_PATH}/search/page`, {
			params: { keyword, page, size, sort }
		});
		return response.data;
	},

	// Get requisition by ID
	getRequisitionById: async (id) => {
		const response = await apiClient.get(`${BASE_PATH}/${id}`);
		return response.data;
	},

	// Create requisition
	createRequisition: async (data) => {
		const response = await apiClient.post(`${BASE_PATH}`, data);
		return response.data;
	},

	// Update requisition
	updateRequisition: async (id, data) => {
		const response = await apiClient.put(`${BASE_PATH}/${id}`, data);
		return response.data;
	},

	// Approve requisition
	approveRequisition: async (id) => {
		const response = await apiClient.post(`${BASE_PATH}/${id}/approve`);
		return response.data;
	},

	// Reject requisition
	rejectRequisition: async (id, reason = "") => {
		const response = await apiClient.post(`${BASE_PATH}/${id}/reject`, null, {
			params: { reason }
		});
		return response.data;
	},

	// Close requisition
	closeRequisition: async (id) => {
		const response = await apiClient.post(`${BASE_PATH}/${id}/close`);
		return response.data;
	},

	// Restore requisition
	restoreRequisition: async (id) => {
		const response = await apiClient.post(`${BASE_PATH}/${id}/restore`);
		return response.data;
	},

	// Delete requisition (soft delete)
	deleteRequisition: async (id) => {
		const response = await apiClient.delete(`${BASE_PATH}/${id}`);
		return response.data;
	},
};

export default purchaseRequisitionService;

