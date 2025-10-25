import apiClient from "./apiClient";

export const vendorService = {
  // Get all vendors (no pagination)
  getAllVendors: async () => {
    const response = await apiClient.get("/vendors");
    return response.data;
  },
  
  // Get vendors with pagination
  getVendorsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/vendors/page", {
      params: { page, size, sort }
    });
    return response.data;
  },
  
  // Search vendors (no pagination)
  searchVendors: async (keyword) => {
    const response = await apiClient.get("/vendors/search", {
      params: { keyword }
    });
    return response.data;
  },
  
  // Search vendors with pagination
  searchVendorsWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/vendors/search/page", {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },
  
  // Get vendor by ID
  getVendorById: async (id) => {
    const response = await apiClient.get(`/vendors/${id}`);
    return response.data;
  },
  
  // Create vendor
  createVendor: async (vendorData) => {
    const response = await apiClient.post("/vendors", vendorData);
    return response.data;
  },
  
  // Update vendor
  updateVendor: async (id, vendorData) => {
    const response = await apiClient.put(`/vendors/${id}`, vendorData);
    return response.data;
  },
  
  // Delete vendor (soft delete)
  deleteVendor: async (id) => {
    const response = await apiClient.delete(`/vendors/${id}`);
    return response.data;
  },
  
  // Restore vendor
  restoreVendor: async (id) => {
    const response = await apiClient.post(`/vendors/${id}/restore`);
    return response.data;
  },
  
  // Check if vendor code exists
  checkVendorCodeExists: async (vendorCode) => {
    const response = await apiClient.get(`/vendors/exists/${vendorCode}`);
    return response.data;
  },

  generateVendorCode: async () => {
    const response = await apiClient.get("/vendors/generate-code");
    return response.data;
  }
};

// Get detail with transactions
export const getVendorDetail = async (vendorId) => {
  const res = await apiClient.get(`/vendors/${vendorId}/detail`);
  return res.data;
};



export default vendorService;