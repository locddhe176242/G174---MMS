import apiClient from "./apiClient";

const BASE_PATH = "/purchase-orders";

const extractData = (response) => {
    const result = response?.data;
    if (result && typeof result === "object" && "data" in result) {
        return result.data;
    }
    return result;
};

export const purchaseOrderService = {
    // ===================== LIST & SEARCH =====================
    getPurchaseOrdersWithPagination: async (
        page = 0,
        size = 10,
        sort = "createdAt,desc"
    ) => {
        const response = await apiClient.get(`${BASE_PATH}/page`, {
            params: {page, size, sort},
        });
        return extractData(response);
    },

    searchPurchaseOrdersWithPagination: async (
        keyword,
        page = 0,
        size = 10,
        sort = "createdAt,desc"
    ) => {
        const response = await apiClient.get(`${BASE_PATH}/search/page`, {
            params: {keyword, page, size, sort},
        });
        return extractData(response);
    },

    getPurchaseOrderById: async (id) => {
        const response = await apiClient.get(`${BASE_PATH}/${id}`);
        return extractData(response);
    },

    getPurchaseOrdersByVendorId: async (vendorId) => {
        const response = await apiClient.get(`${BASE_PATH}/vendor/${vendorId}`);
        return extractData(response);
    },

    getPurchaseOrdersByQuotationId: async (pqId) => {
        const response = await apiClient.get(`${BASE_PATH}/pq/${pqId}`);
        return extractData(response);
    },

    // ===================== MUTATIONS =====================
    createPurchaseOrder: async (payload, createdById) => {
        const config = createdById ? {params: {createdById}} : undefined;
        const response = await apiClient.post(`${BASE_PATH}`, payload, config);
        return extractData(response);
    },

    updatePurchaseOrder: async (id, payload, updatedById) => {
        const config = updatedById ? {params: {updatedById}} : undefined;
        const response = await apiClient.put(`${BASE_PATH}/${id}`, payload, config);
        return extractData(response);
    },

    deletePurchaseOrder: async (id) => {
        const response = await apiClient.delete(`${BASE_PATH}/${id}`);
        return extractData(response);
    },

    approvePurchaseOrder: async (id, approverId) => {
        const response = await apiClient.put(
            `${BASE_PATH}/${id}/approve`,
            null,
            {
                params: {approverId},
            }
        );
        return extractData(response);
    },

    rejectPurchaseOrder: async (id, approverId, reason) => {
        const response = await apiClient.put(
            `${BASE_PATH}/${id}/reject`,
            null,
            {
                params: {approverId, reason},
            }
        );
        return extractData(response);
    },

    sendPurchaseOrder: async (id) => {
        const response = await apiClient.put(`${BASE_PATH}/${id}/send`);
        return extractData(response);
    },

    completePurchaseOrder: async (id) => {
        const response = await apiClient.put(`${BASE_PATH}/${id}/complete`);
        return extractData(response);
    },

    cancelPurchaseOrder: async (id) => {
        const response = await apiClient.put(`${BASE_PATH}/${id}/cancel`);
        return extractData(response);
    },

    // ===================== UTILITIES =====================
    generatePONo: async () => {
        const response = await apiClient.get(`${BASE_PATH}/generate-number`);
        return extractData(response);
    },
};

export default purchaseOrderService;

