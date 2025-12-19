import apiClient from "./apiClient";

export const reportService = {
    // Generate Inventory Report
    generateInventoryReport: async (data) => {
        const response = await apiClient.post("/reports/generate/inventory", data);
        return response.data;
    },
    
    // Generate Sales Report
    generateSalesReport: async (data) => {
        const response = await apiClient.post("/reports/generate/sales", data);
        return response.data;
    },
    
    // Get all reports
    getAllReports: async (page = 0, size = 20) => {
        const response = await apiClient.get(`/reports?page=${page}&size=${size}`);
        return response.data;
    },
    
    // Get report by ID
    getReportById: async (reportId) => {
        const response = await apiClient.get(`/reports/${reportId}`);
        return response.data;
    },
    
    // Filter reports
    filterReports: async (params) => {
        const response = await apiClient.get("/reports/filter", { params });
        return response.data;
    }
};

