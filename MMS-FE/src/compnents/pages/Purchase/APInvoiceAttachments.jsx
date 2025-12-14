import React, { useState, useEffect } from 'react';
import { apInvoiceAttachmentService } from '../../../api/apInvoiceAttachmentService';
import { formatDateTime } from '../../../utils/formatters';

const APInvoiceAttachments = ({ invoiceId, readonly = false }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('VENDOR_INVOICE');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchAttachments();
    }
  }, [invoiceId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const data = await apInvoiceAttachmentService.getAttachmentsByInvoice(invoiceId);
      setAttachments(data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      alert('Lỗi khi tải danh sách file đính kèm');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file PDF hoặc hình ảnh (JPG, PNG)');
        e.target.value = '';
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 10MB');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file');
      return;
    }

    try {
      setUploading(true);
      await apInvoiceAttachmentService.uploadAttachment(
        invoiceId,
        selectedFile,
        fileType,
        description
      );
      
      alert('Upload file thành công!');
      setSelectedFile(null);
      setDescription('');
      setFileType('VENDOR_INVOICE');
      document.getElementById('fileInput').value = '';
      
      // Refresh list
      await fetchAttachments();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error.response?.data?.error || 'Lỗi khi upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa file này?')) {
      return;
    }

    try {
      await apInvoiceAttachmentService.deleteAttachment(attachmentId);
      alert('Xóa file thành công!');
      await fetchAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Lỗi khi xóa file');
    }
  };

  const handleView = async (attachment) => {
    try {
      const { downloadUrl } = await apInvoiceAttachmentService.getDownloadUrl(attachment.attachmentId);
      setPreviewUrl(downloadUrl);
      setShowPreview(true);
    } catch (error) {
      console.error('Error getting download URL:', error);
      alert('Lỗi khi xem file');
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const { downloadUrl } = await apInvoiceAttachmentService.getDownloadUrl(attachment.attachmentId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Lỗi khi tải file');
    }
  };

  const getFileTypeLabel = (type) => {
    const labels = {
      VENDOR_INVOICE: 'Hóa đơn gốc',
      RECEIPT: 'Biên lai',
      CONTRACT: 'Hợp đồng',
      OTHER: 'Khác'
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">File đính kèm</h3>

      {/* Upload Form */}
      {!readonly && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-3">Upload file mới</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Chọn file (PDF hoặc Hình ảnh, tối đa 10MB)
              </label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Loại file</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="VENDOR_INVOICE">Hóa đơn gốc từ Vendor</option>
                <option value="RECEIPT">Biên lai thanh toán</option>
                <option value="CONTRACT">Hợp đồng</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mô tả (tùy chọn)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Nhập mô tả cho file..."
              />
            </div>

            {selectedFile && (
              <div className="text-sm text-gray-600">
                Đã chọn: <span className="font-medium">{selectedFile.name}</span> ({formatFileSize(selectedFile.size)})
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploading ? 'Đang upload...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Attachments List */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Đang tải...</div>
        ) : attachments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Chưa có file đính kèm</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên file</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kích thước</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người upload</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attachments.map((attachment) => (
                  <tr key={attachment.attachmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        {attachment.mimeType?.startsWith('image/') ? (
                          <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <div>
                          <div className="font-medium">{attachment.fileName}</div>
                          {attachment.description && (
                            <div className="text-xs text-gray-500">{attachment.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {getFileTypeLabel(attachment.fileType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatFileSize(attachment.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {attachment.uploadedByName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(attachment.uploadedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(attachment)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Xem"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownload(attachment)}
                          className="text-green-600 hover:text-green-800"
                          title="Tải xuống"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        {!readonly && (
                          <button
                            onClick={() => handleDelete(attachment.attachmentId)}
                            className="group p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-red-200 hover:border-red-300"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Xem trước file</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={previewUrl}
                className="w-full h-full min-h-[600px] border rounded"
                title="File Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APInvoiceAttachments;
