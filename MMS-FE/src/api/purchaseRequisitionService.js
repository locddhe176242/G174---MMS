import apiClient from "./apiClient";

const BASE_PATH = "/purchase-requisitions";

const handleResponse = (response) => {
    // Tự động unwrap ApiResponse trong backend
    if (response.data && response.data.success) {
        return response.data.data;
    }
    console.warn("API Warning:", response.data?.message);
    return response.data?.data ?? null;
};

export const purchaseRequisitionService = {
    // ------------------- CREATE -------------------
    createRequisition: async (data) => {
        const response = await apiClient.post(`${BASE_PATH}`, data);
        return handleResponse(response);
    },

    // ------------------- UPDATE -------------------
    updateRequisition: async (id, data) => {
        const response = await apiClient.put(`${BASE_PATH}/${id}`, data);
        return handleResponse(response);
    },

    // ------------------- GET BY ID -------------------
    getRequisitionById: async (id) => {
        const response = await apiClient.get(`${BASE_PATH}/${id}`);
        return handleResponse(response);
    },

    // ------------------- GET ALL -------------------
    getAllRequisitions: async () => {
        const response = await apiClient.get(`${BASE_PATH}`);
        return handleResponse(response);
    },

    // ------------------- PAGINATION -------------------
    getRequisitionsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
        const response = await apiClient.get(`${BASE_PATH}/page`, {
            params: { page, size, sort },
        });
        return handleResponse(response);
    },

    // ------------------- SEARCH -------------------
    searchRequisitions: async (keyword = "") => {
        const response = await apiClient.get(`${BASE_PATH}/search`, { params: { keyword } });
        return handleResponse(response);
    },

    // ------------------- SEARCH + PAGINATION -------------------
    searchRequisitionsWithPagination: async (keyword = "", page = 0, size = 10, sort = "createdAt,desc") => {
        const response = await apiClient.get(`${BASE_PATH}/search/page`, {
            params: { keyword, page, size, sort },
        });
        return handleResponse(response);
    },

    // ------------------- APPROVE / REJECT / CLOSE / RESTORE -------------------
    approveRequisition: async (id) => {
        const response = await apiClient.post(`${BASE_PATH}/${id}/approve`);
        return handleResponse(response);
    },

    rejectRequisition: async (id, reason = "") => {
        const response = await apiClient.post(`${BASE_PATH}/${id}/reject`, null, {
            params: { reason },
        });
        return handleResponse(response);
    },

    closeRequisition: async (id) => {
        const response = await apiClient.post(`${BASE_PATH}/${id}/close`);
        return handleResponse(response);
    },

    restoreRequisition: async (id) => {
        const response = await apiClient.post(`${BASE_PATH}/${id}/restore`);
        return handleResponse(response);
    },

    // ------------------- DELETE -------------------
    deleteRequisition: async (id) => {
        const response = await apiClient.delete(`${BASE_PATH}/${id}`);
        return handleResponse(response);
    },

    // ------------------- UTILITIES -------------------
    generateRequisitionNumber: async () => {
        const response = await apiClient.get(`${BASE_PATH}/generate-number`);
        return handleResponse(response);
    },

    existsByRequisitionNo: async (requisitionNo) => {
        const response = await apiClient.get(`${BASE_PATH}/exists/${encodeURIComponent(requisitionNo)}`);
        return handleResponse(response);
    },
};

export default purchaseRequisitionService;
