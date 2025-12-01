import apiClient from "./apiClient";

const BASE_PATH = "/purchase-requisitions";

export const purchaseRequisitionService = {
  // ------------------- CREATE -------------------
  createRequisition: async (requisitionData) => {
    const response = await apiClient.post(BASE_PATH, requisitionData);
    return response.data;
  },

  // ------------------- GET BY ID -------------------
  getRequisitionById: async (id) => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // ------------------- GET ALL WITH PAGINATION (REQUIRED) -------------------
  // Note: getAllRequisitions() without pagination is not supported for ERP safety
        getRequisitionsWithPagination: async (page = 0, size = 20, sort = "createdAt,desc", status) => {
          const params = { page, size, sort };
          if (status) {
            params.status = status;
          }
          const response = await apiClient.get(`${BASE_PATH}/page`, {
            params
          });
    return response.data;
  },

  // ------------------- SEARCH WITH PAGINATION (REQUIRED) -------------------
  // Note: searchRequisitions() without pagination is not supported for ERP safety
  searchRequisitionsWithPagination: async (keyword, page = 0, size = 20, sort = "createdAt,desc") => {
    const response = await apiClient.get(`${BASE_PATH}/search/page`, {
      params: { keyword, page, size, sort }
    });
    return response.data;
  },

  // ------------------- UPDATE -------------------
  updateRequisition: async (id, requisitionData) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}`, requisitionData);
    return response.data;
  },

  // ------------------- SUBMIT (Draft → Pending) -------------------
  submitRequisition: async (id) => {
    const response = await apiClient.post(`${BASE_PATH}/${id}/submit`);
    return response.data;
  },

  // ------------------- APPROVE -------------------
  approveRequisition: async (id) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}/approve`);
    return response.data;
  },

  // ------------------- REJECT -------------------
  rejectRequisition: async (id, reason) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}/reject`, null, {
      params: { reason }
    });
    return response.data;
  },

  // ------------------- CLOSE -------------------
  closeRequisition: async (id) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}/close`);
    return response.data;
  },

  // ------------------- DELETE (Only Draft) -------------------
  deleteRequisition: async (id) => {
    const response = await apiClient.delete(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // ------------------- GENERATE NUMBER -------------------
  generateRequisitionNo: async () => {
    const response = await apiClient.get(`${BASE_PATH}/generate-number`);
    return response.data;
  },
};

export default purchaseRequisitionService;

