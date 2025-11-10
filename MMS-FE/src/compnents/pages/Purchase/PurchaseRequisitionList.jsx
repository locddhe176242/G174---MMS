import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import purchaseRequisitionService from "../../../api/purchaseRequisitionService";
import Pagination from "../../common/Pagination.jsx";


export default function PurchaseRequisitionList() {
    const navigate = useNavigate();
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [requisitionToDelete, setRequisitionToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    };

    // Status badge
    const getStatusBadge = (status) => {
        const statusColors = {
            Draft: "bg-gray-100 text-gray-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Approved: "bg-green-100 text-green-800",
            Rejected: "bg-red-100 text-red-800",
            Cancelled: "bg-gray-100 text-gray-800",
        };
        const color = statusColors[status] || "bg-gray-100 text-gray-800";
        return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{status || "Draft"}</span>;
    };

    const getTotalItems = (items) => (Array.isArray(items) ? items.length : 0);

    // Fetch requisitions
    const fetchRequisitions = async (page = 0, size = pageSize, keyword = searchKeyword) => {
        try {
            setLoading(true);
            setError(null);
            const sort = `${sortField},${sortDirection}`;
            let response;
            if (keyword.trim()) {
                response = await purchaseRequisitionService.searchRequisitionsWithPagination(keyword, page, size, sort);
            } else {
                response = await purchaseRequisitionService.getRequisitionsWithPagination(page, size, sort);
            }

            const data = response.data || response;
            setRequisitions(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
            setCurrentPage(page);
        } catch (err) {
            setError("Không thể tải danh sách phiếu yêu cầu");
            toast.error("Lỗi khi tải danh sách phiếu yêu cầu");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchRequisitions();
    }, []);

    // Refetch when sort changes
    useEffect(() => {
        fetchRequisitions(currentPage);
    }, [sortField, sortDirection]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchRequisitions(0);
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

    const getSortIcon = (field) => {
        if (sortField !== field)
            return (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        return sortDirection === "asc" ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
        );
    };

    // Delete handlers
    const handleDeleteClick = (requisition) => {
        setRequisitionToDelete(requisition);
        setShowDeleteModal(true);
    };
    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setRequisitionToDelete(null);
    };
    const handleDeleteConfirm = async () => {
        if (!requisitionToDelete) return;
        try {
            setIsDeleting(true);
            const id = requisitionToDelete.requisitionId || requisitionToDelete.requisition_id || requisitionToDelete.id;
            const response = await purchaseRequisitionService.deleteRequisition(id);
            if (response.success !== false) {
                toast.success(response.message || "Xóa phiếu yêu cầu thành công!");
                setShowDeleteModal(false);
                fetchRequisitions(currentPage);
            } else {
                throw new Error(response.message || "Failed to delete requisition");
            }
        } catch (err) {
            toast.error(err.message || "Không thể xóa phiếu yêu cầu");
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle page change from Pagination component
    const handlePageChange = (page) => {
        if (page < 0 || page >= totalPages) return;
        fetchRequisitions(page);
    };

    // Handle pageSize change
    const handlePageSizeChange = (size) => {
        setPageSize(size);
        fetchRequisitions(0, size); // reset to first page
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý phiếu yêu cầu mua hàng</h1>
                    <button onClick={() => navigate("/purchase-requisitions/new")} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                        + Tạo phiếu yêu cầu
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm">
                    {/* Search */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <form onSubmit={handleSearch} className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm phiếu yêu cầu..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Tìm kiếm
                            </button>
                        </form>
                    </div>

                    {/* Table */}
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
                                    <th className="px-6 py-3 text-left">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button onClick={() => handleSort("requisition_no")} className="flex items-center gap-1 hover:text-gray-700">
                                            MÃ PHIẾU {getSortIcon("requisition_no")}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-gray-700">
                                            TRẠNG THÁI {getSortIcon("status")}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MỤC ĐÍCH</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SỐ SẢN PHẨM</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1 hover:text-gray-700">
                                            NGÀY TẠO {getSortIcon("createdAt")}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NGƯỜI YÊU CẦU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HÀNH ĐỘNG</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {requisitions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                            Không có phiếu yêu cầu nào
                                        </td>
                                    </tr>
                                ) : (
                                    requisitions.map((requisition) => {
                                        const reqId = requisition.requisitionId || requisition.requisition_id || requisition.id;
                                        return (
                                            <tr key={reqId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <input type="checkbox" className="rounded border-gray-300" />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{requisition.requisitionNo || requisition.requisition_no}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(requisition.status || requisition.approvalStatus)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{requisition.purpose || "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getTotalItems(requisition.items)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(requisition.createdAt || requisition.created_at)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requisition.requesterName || requisition.requester_id || "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => navigate(`/purchase-requisitions/${reqId}`)} className="text-blue-600 hover:text-blue-900" title="Xem chi tiết">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => navigate(`/purchase-requisitions/${reqId}/edit`)} className="text-green-600 hover:text-green-900" title="Chỉnh sửa">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(requisition)} className="text-red-600 hover:text-red-900" title="Xóa">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && !error && requisitions.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalElements={totalElements}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                        />
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center mb-4 justify-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 text-center">Xác nhận xóa phiếu yêu cầu?</h2>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleDeleteCancel}
                                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
