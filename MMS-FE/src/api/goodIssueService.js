import apiClient from "./apiClient";

const BASE_PATH = "/good-issues";

export const goodIssueService = {
    // Get all good issues with pagination
    getGoodIssuesWithPagination(page = 0, size = 10, sort = "createdAt,desc") {
        return apiClient
            .get(`${BASE_PATH}/page`, {
                params: { page, size, sort },
            })
            .then((response) => response.data);
    },

    // Search good issues
    searchGoodIssuesWithPagination(keyword, page = 0, size = 10, sort = "createdAt,desc") {
        return apiClient
            .get(`${BASE_PATH}/search/page`, {
                params: { keyword, page, size, sort },
            })
            .then((response) => response.data);
    },

    // Get good issue by ID
    getGoodIssueById(id) {
        return apiClient.get(`${BASE_PATH}/${id}`).then((response) => response.data);
    },

    // Get issues by delivery ID
    getIssuesByDeliveryId(deliveryId) {
        return apiClient.get(`${BASE_PATH}/delivery/${deliveryId}`).then((response) => response.data);
    },

    // Get issues by warehouse ID
    getIssuesByWarehouseId(warehouseId) {
        return apiClient.get(`${BASE_PATH}/warehouse/${warehouseId}`).then((response) => response.data);
    },

    // Create good issue
    createGoodIssue(payload, createdById) {
        const config = createdById ? { params: { createdById } } : undefined;
        return apiClient.post(BASE_PATH, payload, config).then((response) => response.data);
    },

    // Create good issue from Delivery
    createGoodIssueFromDelivery(deliveryId, payload, createdById) {
        const config = createdById ? { params: { createdById } } : undefined;
        return apiClient.post(`${BASE_PATH}/from-delivery/${deliveryId}`, payload, config).then((response) => response.data);
    },

    // Update good issue
    updateGoodIssue(id, payload, updatedById) {
        const config = updatedById ? { params: { updatedById } } : undefined;
        return apiClient.put(`${BASE_PATH}/${id}`, payload, config).then((response) => response.data);
    },

    // Delete good issue
    deleteGoodIssue(id) {
        return apiClient.delete(`${BASE_PATH}/${id}`).then((response) => response.data);
    },

    // Complete good issue (submit for approval = complete immediately)
    submitForApproval(issueId, submittedById) {
        const config = submittedById ? { params: { submittedById } } : undefined;
        return apiClient
            .post(`${BASE_PATH}/${issueId}/submit-for-approval`, null, config)
            .then((response) => response.data);
    },

    // Generate issue number
    generateIssueNo() {
        return apiClient.get(`${BASE_PATH}/generate-number`).then((response) => response.data);
    },
};
