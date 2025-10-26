import apiClient from "./apiClient";

export const customerService = {
  generateCustomerCode: async () => {
    const response = await apiClient.get("/customers/generate-code");
    return response.data;
  },


  // Get all customers (no pagination)
  getAllCustomers: async () => {
    const response = await apiClient.get("/customers");
    return response.data;
  },

  // Get customers with pagination
  getCustomersWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/customers/page", {
      params: { page, size, sort }
    });
    return response.data;
  },

  // Search customers (no pagination)
  searchCustomers: async (keyword) => {
    const response = await apiClient.get("/customers/search", {
      params: { keyword }
    });
    return response.data;
  },

  // Search customers with pagination
  searchCustomersWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get("/customers/search/page", {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },



  // Create customer
  createCustomer: async (customerData) => {
    const response = await apiClient.post("/customers", customerData);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await apiClient.put(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer (soft delete)
  deleteCustomer: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },

  // Restore customer
  restoreCustomer: async (id) => {
    const response = await apiClient.post(`/customers/${id}/restore`);
    return response.data;
  },
};

// Get detail with transactions
export const getCustomerDetail = async (customerId) => {
  const res = await apiClient.get(`/customers/${customerId}/detail`);
  return res.data;
};





export default customerService;