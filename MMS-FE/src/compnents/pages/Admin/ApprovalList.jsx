import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function ApprovalList() {
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // State cho modal approve/reject
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Helper function để tránh nested ternary
  const getPaginationButtonClass = (isActive) => {
    if (isActive) {
      return "px-3 py-1 border rounded-md bg-black text-white border-black";
    }
    return "px-3 py-1 border rounded-md border-gray-300 hover:bg-gray-50";
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
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

  // Fetch requisitions pending approval
  const fetchRequisitions = async (page = 0, keyword = "", sortField = "createdAt", sortDirection = "desc") => {
    try {
      setLoading(true);
      setError(null);

      const sort = `${sortField},${sortDirection}`;
      // Filter by status = Pending or Draft (cần duyệt)
      let url = `/api/purchase-requisitions?page=${page}&size=${pageSize}&sort=${sort}&status=Pending`;
      
      if (keyword.trim()) {
        url += `&search=${encodeURIComponent(keyword)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.content) {
        setRequisitions(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setRequisitions(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setRequisitions([]);
        setTotalPages(0);
        setTotalElements(0);
      }

      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching requisitions:", err);
      setError("Không thể tải danh sách đơn cần duyệt");
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions(currentPage, searchKeyword, sortField, sortDirection);
  }, [currentPage, sortField, sortDirection]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchRequisitions(0, searchKeyword, sortField, sortDirection);
  };

  // Handle approve
  const handleApprove = async () => {
    if (!selectedRequisition) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/purchase-requisitions/${selectedRequisition.requisition_id || selectedRequisition.id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved: true })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Đã duyệt đơn thành công!");
      setShowApproveModal(false);
      setSelectedRequisition(null);
      fetchRequisitions(currentPage, searchKeyword, sortField, sortDirection);
    } catch (err) {
      console.error("Error approving requisition:", err);
      toast.error("Không thể duyệt đơn. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedRequisition) return;

    if (!rejectReason.trim()) {
      toast.warn("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/purchase-requisitions/${selectedRequisition.requisition_id || selectedRequisition.id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          approved: false,
          rejectReason: rejectReason
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Đã từ chối đơn thành công!");
      setShowRejectModal(false);
      setSelectedRequisition(null);
      setRejectReason("");
      fetchRequisitions(currentPage, searchKeyword, sortField, sortDirection);
    } catch (err) {
      console.error("Error rejecting requisition:", err);
      toast.error("Không thể từ chối đơn. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Open approve modal
  const openApproveModal = (requisition) => {
    setSelectedRequisition(requisition);
    setShowApproveModal(true);
  };

  // Open reject modal
  const openRejectModal = (requisition) => {
    setSelectedRequisition(requisition);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      Draft: { label: "Nháp", color: "bg-gray-100 text-gray-800" },
      Pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
      Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800" },
      Rejected: { label: "Từ chối", color: "bg-red-100 text-red-800" },
    };
    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
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
            <h1 className="text-2xl font-bold text-gray-900">Duyệt đơn yêu cầu</h1>
            <button
              onClick={() => navigate("/purchase-requisitions")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm theo số đơn, người yêu cầu..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                setCurrentPage(0);
                fetchRequisitions(0, "", sortField, sortDirection);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Làm mới
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("requisition_no")}>
                        <div className="flex items-center gap-2">
                          Số đơn
                          {getSortIcon("requisition_no")}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người yêu cầu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mục đích
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("createdAt")}>
                        <div className="flex items-center gap-2">
                          Ngày tạo
                          {getSortIcon("createdAt")}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng giá trị
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requisitions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          Không có đơn nào cần duyệt
                        </td>
                      </tr>
                    ) : (
                      requisitions.map((requisition) => (
                        <tr key={requisition.requisition_id || requisition.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {requisition.requisition_no || requisition.requisitionNo || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {requisition.requester_name || requisition.requesterName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="max-w-xs truncate" title={requisition.purpose}>
                              {requisition.purpose || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(requisition.created_at || requisition.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(requisition.status)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {formatCurrency(requisition.total_value || requisition.totalValue || 0)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => navigate(`/purchase-requisitions/${requisition.requisition_id || requisition.id}`)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Xem chi tiết"
                              >
                                Xem
                              </button>
                              <button
                                onClick={() => openApproveModal(requisition)}
                                className="text-green-600 hover:text-green-800"
                                title="Duyệt đơn"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => openRejectModal(requisition)}
                                className="text-red-600 hover:text-red-800"
                                title="Từ chối đơn"
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} đơn
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(0)}
                        disabled={currentPage === 0}
                        className={getPaginationButtonClass(false)}
                      >
                        Đầu
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className={getPaginationButtonClass(false)}
                      >
                        Trước
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (currentPage < 3) {
                          pageNum = i;
                        } else if (currentPage > totalPages - 4) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={getPaginationButtonClass(pageNum === currentPage)}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className={getPaginationButtonClass(false)}
                      >
                        Sau
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1}
                        className={getPaginationButtonClass(false)}
                      >
                        Cuối
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận duyệt đơn</h3>
              <p className="text-sm text-gray-600 mb-6">
                Bạn có chắc chắn muốn duyệt đơn <strong>{selectedRequisition?.requisition_no || selectedRequisition?.requisitionNo}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRequisition(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  Hủy
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận duyệt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Từ chối đơn</h3>
              <p className="text-sm text-gray-600 mb-4">
                Bạn có chắc chắn muốn từ chối đơn <strong>{selectedRequisition?.requisition_no || selectedRequisition?.requisitionNo}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequisition(null);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

