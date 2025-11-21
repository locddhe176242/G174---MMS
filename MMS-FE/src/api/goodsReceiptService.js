import apiClient from "./apiClient";

const BASE_PATH = "/goods-receipts";

export const goodsReceiptService = {
    // Get all goods receipts with pagination
    getGoodsReceiptsWithPagination(page = 0, size = 10, sort = "createdAt,desc") {
        return apiClient
            .get(`${BASE_PATH}/page`, {
                params: { page, size, sort },
            })
            .then((response) => response.data);
    },

    // Search goods receipts
    searchGoodsReceiptsWithPagination(keyword, page = 0, size = 10, sort = "createdAt,desc") {
        return apiClient
            .get(`${BASE_PATH}/search/page`, {
                params: { keyword, page, size, sort },
            })
            .then((response) => response.data);
    },

    // Get goods receipt by ID
    getGoodsReceiptById(id) {
        return apiClient.get(`${BASE_PATH}/${id}`).then((response) => response.data);
    },

    // Get receipt items by receipt ID
    getReceiptItems(receiptId) {
        return apiClient.get(`${BASE_PATH}/${receiptId}/items`).then((response) => response.data);
    },

    // Create goods receipt
    createGoodsReceipt(payload, createdById) {
        const config = createdById ? { params: { createdById } } : undefined;
        return apiClient.post(BASE_PATH, payload, config).then((response) => response.data);
    },

    // Update goods receipt
    updateGoodsReceipt(id, payload, updatedById) {
        const config = updatedById ? { params: { updatedById } } : undefined;
        return apiClient.put(`${BASE_PATH}/${id}`, payload, config).then((response) => response.data);
    },

    // Delete goods receipt
    deleteGoodsReceipt(id) {
        return apiClient.delete(`${BASE_PATH}/${id}`).then((response) => response.data);
    },

    // Approve goods receipt
    approveGoodsReceipt(id, approverId) {
        return apiClient
            .put(`${BASE_PATH}/${id}/approve`, null, {
                params: { approverId },
            })
            .then((response) => response.data);
    },

    // Reject goods receipt
    rejectGoodsReceipt(id, approverId, reason) {
        return apiClient
            .put(`${BASE_PATH}/${id}/reject`, null, {
                params: { approverId, reason },
            })
            .then((response) => response.data);
    },

    // Generate receipt number
    generateReceiptNo() {
        return apiClient.get(`${BASE_PATH}/generate-number`).then((response) => response.data);
    },
};
