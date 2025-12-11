import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { rfqService } from "../../../api/rfqService";
import Pagination from "../../common/Pagination";

export default function RFQList() {
  const navigate = useNavigate();

  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rfqToDelete, setRfqToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getPaginationButtonClass = (isActive) => {
    if (isActive) {
      return "px-3 py-1 border rounded-md bg-black text-white border-black";
    }
    return "px-3 py-1 border rounded-md border-gray-300 hover:bg-gray-50";
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === "asc") {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
        </svg>
      );
    }
  };

  const fetchRFQs = async (page = 0, keyword = "", sortField = "createdAt", sortDirection = "desc") => {
    try {
      setLoading(true);
      setError(null);

      const sort = `${sortField},${sortDirection}`;
      let response;
      if (keyword.trim()) {
        response = await rfqService.searchRFQsWithPagination(keyword, page, pageSize, sort);
      } else {
        response = await rfqService.getRFQsWithPagination(page, pageSize, sort);
      }

      setRfqs(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      setError("Không thể tải danh sách Yêu cầu báo giá");
      console.error("Error fetching RFQs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  useEffect(() => {
    fetchRFQs(currentPage, searchKeyword, sortField, sortDirection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortDirection]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRFQs(0, searchKeyword, sortField, sortDirection);
  };

  const handlePageChange = (newPage) => {
    fetchRFQs(newPage, searchKeyword, sortField, sortDirection);
  };

  const handleDeleteClick = (rfq) => {
    setRfqToDelete(rfq);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rfqToDelete) return;

    try {
      setIsDeleting(true);
      await rfqService.deleteRFQ(rfqToDelete.rfqId || rfqToDelete.id || rfqToDelete.rfq_id);
      toast.success("Xóa Yêu cầu báo giá thành công!");
      setShowDeleteModal(false);
      setRfqToDelete(null);
      fetchRFQs(currentPage, searchKeyword, sortField, sortDirection);
    } catch (err) {
      toast.error("Không thể xóa Yêu cầu báo giá");
      console.error("Error deleting RFQ:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRfqToDelete(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status) => {
    // Handle both string and enum object formats
    const statusStr = typeof status === 'string' ? status : (status?.name || status?.toString() || 'Draft');
    
    const map = {
      Draft: { label: "Nháp", color: "bg-gray-100 text-gray-800" },
      Pending: { label: "Chờ phản hồi", color: "bg-yellow-100 text-yellow-800" },
      Sent: { label: "Đã gửi", color: "bg-blue-100 text-blue-800" },
      Closed: { label: "Đã đóng", color: "bg-gray-200 text-gray-800" },
      Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };

    const statusInfo = map[statusStr] || { label: statusStr || "Nháp", color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Yêu cầu báo giá</h1>
            </div>
            <button
              onClick={() => navigate("/purchase/rfqs/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Tạo Yêu cầu báo giá
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <form onSubmit={handleSearch} className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm Yêu cầu báo giá..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tìm kiếm
                </button>
              </form>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600">{error}</div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SỐ YÊU CẦU BÁO GIÁ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TRẠNG THÁI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NGÀY PHÁT HÀNH
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HẠN PHẢN HỒI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCC ĐƯỢC CHỌN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NGÀY TẠO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GHI CHÚ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rfqs.map((rfq) => (
                    <tr key={rfq.rfqId || rfq.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(rfq.rfqId || rfq.id)?.toString().padStart(3, "0")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {rfq.rfqNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(rfq.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(rfq.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(rfq.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rfq.selectedVendorName || 
                         (Array.isArray(rfq.selectedVendors) && rfq.selectedVendors.length > 0
                           ? rfq.selectedVendors.map(v => v.vendorName || v.name).join(", ")
                           : "") || 
                         "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(rfq.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {rfq.notes || rfq.note || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/purchase/rfqs/${rfq.rfqId || rfq.id}`)}
                            className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                            title="Xem chi tiết"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {/* Chỉ hiển thị nút edit khi status là Draft */}
                          {(() => {
                            const statusStr = typeof rfq.status === 'string' ? rfq.status : (rfq.status?.name || rfq.status?.toString() || 'Draft');
                            return statusStr === 'Draft' && (
                              <button
                                onClick={() => navigate(`/purchase/rfqs/${rfq.rfqId || rfq.id}/edit`)}
                                className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                                title="Chỉnh sửa"
                              >
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            );
                          })()}
                          {/* Chỉ hiển thị nút delete khi status là Draft */}
                          {(() => {
                            const statusStr = typeof rfq.status === 'string' ? rfq.status : (rfq.status?.name || rfq.status?.toString() || 'Draft');
                            return statusStr === 'Draft' && (
                              <button
                                onClick={() => handleDeleteClick(rfq)}
                                className="group p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-red-200 hover:border-red-300"
                                title="Xóa"
                              >
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && !error && rfqs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalElements={totalElements}
              onPageChange={handlePageChange}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                fetchRfqs(0, searchKeyword, sortField, sortDirection);
              }}
            />
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Xác nhận xóa Yêu cầu báo giá
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa Yêu cầu báo giá <strong>"{rfqToDelete?.rfqNo}"</strong> không? Hành động này không thể hoàn tác.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xóa...
                    </>
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}