import apiClient from "./apiClient";

const BASE_PATH = "/rfqs";

/**
 * Extract data from backend response format: { success, message, data }
 */
const extractData = (response) => {
  const result = response.data;
  if (result && typeof result === 'object' && 'data' in result) {
    return result.data;
  }
  return result;
};

export const rfqService = {
  // ===================== GET RFQs WITH PAGINATION (REQUIRED) =====================
  // Note: getAllRFQs() without pagination is not supported for ERP safety
  getRFQsWithPagination: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get(`${BASE_PATH}/page`, {
      params: { page, size, sort }
    });
    return extractData(response);
  },

  // ===================== SEARCH RFQs WITH PAGINATION (REQUIRED) =====================
  // Note: searchRFQs() without pagination is not supported for ERP safety
  searchRFQsWithPagination: async (keyword, page = 0, size = 10, sort = "createdAt,desc") => {
    const response = await apiClient.get(`${BASE_PATH}/search/page`, {
      params: { keyword, page, size, sort }
    });
    return extractData(response);
  },

  // ===================== GET RFQ BY ID =====================
  getRFQById: async (id) => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return extractData(response);
  },

  // ===================== CREATE RFQ =====================
  createRFQ: async (rfqData, sendEmail = true) => {
    const response = await apiClient.post(BASE_PATH, rfqData, {
      params: { sendEmail }
    });
    return extractData(response);
  },

  // ===================== UPDATE RFQ =====================
  updateRFQ: async (id, rfqData, sendEmail = true) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}`, rfqData, {
      params: { sendEmail }
    });
    return extractData(response);
  },

  // ===================== UPDATE RFQ STATUS =====================
  updateRFQStatus: async (id, status) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}/status`, null, {
      params: { status }
    });
    return extractData(response);
  },

  // ===================== CLOSE RFQ =====================
  closeRFQ: async (id) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}/close`);
    return extractData(response);
  },

  // ===================== CANCEL RFQ =====================
  cancelRFQ: async (id) => {
    const response = await apiClient.put(`${BASE_PATH}/${id}/cancel`);
    return extractData(response);
  },

  // ===================== DELETE RFQ =====================
  deleteRFQ: async (id) => {
    const response = await apiClient.delete(`${BASE_PATH}/${id}`);
    return extractData(response);
  },

  // ===================== GENERATE RFQ NUMBER =====================
  generateRFQNo: async () => {
    const response = await apiClient.get(`${BASE_PATH}/generate-number`);
    const data = extractData(response);
    // Backend trả về string trong data field
    return typeof data === 'string' ? data : (data?.rfqNo || data);
  },

  // ===================== GET RFQs BY REQUISITION ID =====================
  getRFQsByRequisitionId: async (requisitionId) => {
    const response = await apiClient.get(`${BASE_PATH}/requisition/${requisitionId}`);
    return extractData(response);
  },
};

export default rfqService;