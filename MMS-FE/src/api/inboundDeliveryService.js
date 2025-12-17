import apiClient from "./apiClient";

const BASE_PATH = "/inbound-deliveries";

const extractData = (response) => {
    const result = response?.data;
    if (result && typeof result === "object" && "data" in result) {
        return result.data;
    }
    return result;
};

export const inboundDeliveryService = {
    // ===================== LIST & SEARCH =====================
    getInboundDeliveriesWithPagination: async (
        page = 0,
        size = 10,
        sort = "createdAt,desc"
    ) => {
        const [sortBy, sortDir] = sort.split(",");
        const response = await apiClient.get(BASE_PATH, {
            params: { page, size, sortBy: sortBy || "createdAt", sortDir: sortDir || "desc" },
        });
        return extractData(response);
    },

    searchInboundDeliveriesWithPagination: async (
        keyword,
        page = 0,
        size = 10,
        sort = "createdAt,desc"
    ) => {
        const [sortBy, sortDir] = sort.split(",");
        const response = await apiClient.get(`${BASE_PATH}/search`, {
            params: { keyword, page, size, sortBy: sortBy || "createdAt", sortDir: sortDir || "desc" },
        });
        return extractData(response);
    },

    getInboundDeliveryById: async (id) => {
        const response = await apiClient.get(`${BASE_PATH}/${id}`);
        return extractData(response);
    },

    getInboundDeliveriesByPurchaseOrderId: async (orderId) => {
        const response = await apiClient.get(`${BASE_PATH}/order/${orderId}`);
        return extractData(response);
    },

    // ===================== GENERATE NUMBER =====================
    generateInboundDeliveryNo: async () => {
        const response = await apiClient.get(`${BASE_PATH}/generate-number`);
        return response.data; // Returns string directly
    },

    // ===================== CREATE & UPDATE =====================
    createInboundDelivery: async (data) => {
        const response = await apiClient.post(BASE_PATH, data);
        return extractData(response);
    },

    createFromPurchaseOrder: async (orderId) => {
        const response = await apiClient.post(`${BASE_PATH}/convert/${orderId}`);
        return extractData(response);
    },

    updateInboundDelivery: async (id, data) => {
        const response = await apiClient.put(`${BASE_PATH}/${id}`, data);
        return extractData(response);
    },

    // ===================== STATUS UPDATES =====================
    updateStatus: async (id, status) => {
        const response = await apiClient.patch(`${BASE_PATH}/${id}/status`, null, {
            params: { status },
        });
        return extractData(response);
    },

    cancelInboundDelivery: async (id) => {
        const response = await apiClient.post(`${BASE_PATH}/${id}/cancel`);
        return extractData(response);
    },

    // ===================== DELETE =====================
    deleteInboundDelivery: async (id) => {
        const response = await apiClient.delete(`${BASE_PATH}/${id}`);
        return extractData(response);
    },
};
