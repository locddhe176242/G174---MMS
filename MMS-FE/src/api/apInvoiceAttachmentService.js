import apiClient from './apiClient';

const AP_INVOICE_ATTACHMENT_API = '/ap-invoice-attachments';

export const apInvoiceAttachmentService = {
  // Upload file đính kèm
  uploadAttachment: async (invoiceId, file, fileType = 'VENDOR_INVOICE', description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('invoiceId', invoiceId);
    if (fileType) formData.append('fileType', fileType);
    if (description) formData.append('description', description);

    const response = await apiClient.post(`${AP_INVOICE_ATTACHMENT_API}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Tạo attachment record
  createAttachment: async (attachmentData) => {
    const response = await apiClient.post(AP_INVOICE_ATTACHMENT_API, attachmentData);
    return response.data;
  },

  // Lấy danh sách attachments của invoice
  getAttachmentsByInvoice: async (invoiceId) => {
    const response = await apiClient.get(`${AP_INVOICE_ATTACHMENT_API}/invoice/${invoiceId}`);
    return response.data;
  },

  // Lấy chi tiết attachment
  getAttachmentById: async (attachmentId) => {
    const response = await apiClient.get(`${AP_INVOICE_ATTACHMENT_API}/${attachmentId}`);
    return response.data;
  },

  // Lấy download URL
  getDownloadUrl: async (attachmentId) => {
    const response = await apiClient.get(`${AP_INVOICE_ATTACHMENT_API}/${attachmentId}/download-url`);
    return response.data;
  },

  // Xóa attachment
  deleteAttachment: async (attachmentId) => {
    const response = await apiClient.delete(`${AP_INVOICE_ATTACHMENT_API}/${attachmentId}`);
    return response.data;
  },
};

export default apInvoiceAttachmentService;
