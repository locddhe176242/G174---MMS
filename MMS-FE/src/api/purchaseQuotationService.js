import apiClient from "./apiClient";

const BASE_PATH = "/purchase-quotations";

export const purchaseQuotationService = {
    // ===================== GET QUOTATIONS WITH PAGINATION (REQUIRED) =====================
    // Note: getAllQuotations() without pagination is not supported for ERP safety
    getQuotationsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
        const response = await apiClient.get(`${BASE_PATH}/page`, {
            params: {page, size, sort}
        });
        return response.data;
    },

    // ===================== SEARCH QUOTATIONS WITH PAGINATION (REQUIRED) =====================
    // Note: searchQuotations() without pagination is not supported for ERP safety
    searchQuotationsWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
        const response = await apiClient.get(`${BASE_PATH}/search/page`, {
            params: {keyword, page, size, sort}
        });
        return response.data;
    },

    // ===================== GET QUOTATION BY ID =====================
    getQuotationById: async (id) => {
        const response = await apiClient.get(`${BASE_PATH}/${id}`);
        return response.data;
    },

    // ===================== GET QUOTATIONS BY RFQ ID =====================
    getQuotationsByRfqId: async (rfqId) => {
        const response = await apiClient.get(`${BASE_PATH}/rfq/${rfqId}`);
        return response.data;
    },

    // ===================== GET QUOTATIONS BY VENDOR ID =====================
    getQuotationsByVendorId: async (vendorId) => {
        const response = await apiClient.get(`${BASE_PATH}/vendor/${vendorId}`);
        return response.data;
    },

    // ===================== CREATE QUOTATION =====================
    createQuotation: async (quotationData, createdById = null) => {
        const params = createdById ? { createdById } : {};
        const response = await apiClient.post(BASE_PATH, quotationData, { params });
        return response.data;
    },

    // ===================== UPDATE QUOTATION =====================
    updateQuotation: async (id, quotationData) => {
        const response = await apiClient.put(`${BASE_PATH}/${id}`, quotationData);
        return response.data;
    },

    // ===================== APPROVE QUOTATION =====================
    approveQuotation: async (id, approverId) => {
        const response = await apiClient.put(`${BASE_PATH}/${id}/approve`, null, {
            params: {approverId}
        });
        return response.data;
    },

    // ===================== REJECT QUOTATION =====================
    rejectQuotation: async (id, approverId, reason) => {
        const response = await apiClient.put(`${BASE_PATH}/${id}/reject`, null, {
            params: {approverId, reason}
        });
        return response.data;
    },

    // ===================== DELETE QUOTATION =====================
    deleteQuotation: async (id) => {
        const response = await apiClient.delete(`${BASE_PATH}/${id}`);
        return response.data;
    },

    // ===================== GENERATE QUOTATION NUMBER =====================
    generateQuotationNo: async () => {
        const response = await apiClient.get(`${BASE_PATH}/generate-number`);
        return response.data;
    },
};

export default purchaseQuotationService;

