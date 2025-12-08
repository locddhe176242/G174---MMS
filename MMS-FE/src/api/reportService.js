import apiClient from "./apiClient";

export const reportService = {
    // Get all reports
    getAllReports: async (page = 0, size = 10, sortBy = "generatedAt", sortDir = "desc") => {
        const response = await apiClient.get("/reports", {
            params: { page, size, sortBy, sortDir }
        });
        return response.data;
    },

    // Get report by ID
    getReportById: async (id) => {
        const response = await apiClient.get(`/reports/${id}`);
        return response.data;
    },

    // Filter reports
    filterReports: async (filters) => {
        const response = await apiClient.get("/reports/filter", {
            params: filters
        });
        return response.data;
    },

    // Generate Inventory Report
    generateInventoryReport: async (data) => {
        const response = await apiClient.post("/reports/generate/inventory", data);
        return response.data;
    },

    // Generate Purchase Report
    generatePurchaseReport: async (data) => {
        const response = await apiClient.post("/reports/generate/purchase", data);
        return response.data;
    },

    // Generate Sales Report
    generateSalesReport: async (data) => {
        const response = await apiClient.post("/reports/generate/sales", data);
        return response.data;
    },

    // Generate Financial Report
    generateFinancialReport: async (data) => {
        const response = await apiClient.post("/reports/generate/financial", data);
        return response.data;
    },

    // Delete report
    deleteReport: async (id) => {
        const response = await apiClient.delete(`/reports/${id}`);
        return response.data;
    }
};
