import apiClient from "./apiClient";

export const reportService = {
    // Generate Inventory Report
    generateInventoryReport: async (data) => {
        const response = await apiClient.post("/reports/generate/inventory", data);
        return response.data;
    }
};

