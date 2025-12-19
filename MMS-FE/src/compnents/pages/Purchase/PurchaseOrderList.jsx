import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { purchaseOrderService } from "../../../api/purchaseOrderService";
import Pagination from "../../common/Pagination";
import useAuthStore from "../../../store/authStore";

export default function PurchaseOrderList() {
    const navigate = useNavigate();
    const { roles } = useAuthStore();
    
    // Check if user is MANAGER or PURCHASE
    const canEdit = roles?.some(role => {
        const roleName = typeof role === 'string' ? role : role?.name;
        return roleName === 'MANAGER' || roleName === 'ROLE_MANAGER' || 
               roleName === 'PURCHASE' || roleName === 'ROLE_PURCHASE';
    }) || false;

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchKeyword, setSearchKeyword] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
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

    const getStatusString = (status, fallback = "Pending") => {
        if (!status) return fallback;
        if (typeof status === "string") return status;
        if (typeof status === "object") {
            return status?.name || status?.value || status?.toString() || fallback;
        }
        return String(status);
    };

    const getStatusBadge = (status) => {
        const statusStr = getStatusString(status, "Pending");
        const map = {
            Pending: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800" },
            Approved: { label: "Đã phê duyệt", color: "bg-green-100 text-green-800" },
            Sent: { label: "Đã gửi", color: "bg-blue-100 text-blue-800" },
            Completed: { label: "Hoàn thành", color: "bg-purple-100 text-purple-800" },
            Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
        };
        const statusInfo = map[statusStr] || { label: statusStr || "Đang chờ", color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
        );
    };

    const getApprovalStatusBadge = (approvalStatus) => {
        const statusStr = getStatusString(approvalStatus, "Pending");
        const map = {
            Pending: { label: "Chờ phê duyệt", color: "bg-yellow-100 text-yellow-800" },
            Approved: { label: "Đã phê duyệt", color: "bg-green-100 text-green-800" },
            Rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
        };
        const statusInfo = map[statusStr] || { label: statusStr || "Chờ phê duyệt", color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
        );
    };

    const fetchOrders = async (
        page = 0,
        keyword = "",
        sortField = "createdAt",
        sortDirection = "desc",
        statusOverride = statusFilter
    ) => {
        try {
            setLoading(true);
            setError(null);

            const sort = `${sortField},${sortDirection}`;
            const normalizedStatus =
                !keyword.trim() && statusOverride !== "ALL" ? statusOverride : undefined;
            let response;
            if (keyword.trim()) {
                response = await purchaseOrderService.searchPurchaseOrdersWithPagination(keyword, page, pageSize, sort);
            } else {
                response = await purchaseOrderService.getPurchaseOrdersWithPagination(
                    page,
                    pageSize,
                    sort,
                    normalizedStatus
                );
            }

            setOrders(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
            setCurrentPage(page);
        } catch (err) {
            setError("Không thể tải danh sách Đơn mua hàng");
            console.error("Error fetching Purchase Orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchOrders(currentPage, searchKeyword, sortField, sortDirection);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortField, sortDirection]);

    useEffect(() => {
        fetchOrders(0, searchKeyword, sortField, sortDirection, statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchOrders(0, searchKeyword, sortField, sortDirection);
    };

    const handlePageChange = (newPage) => {
        fetchOrders(newPage, searchKeyword, sortField, sortDirection);
    };

    const handleDeleteClick = (order) => {
        setOrderToDelete(order);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!orderToDelete) return;

        try {
            setIsDeleting(true);
            await purchaseOrderService.deletePurchaseOrder(
                orderToDelete.order_id || orderToDelete.orderId || orderToDelete.id
            );
            toast.success("Xóa Đơn mua hàng thành công!");
            setShowDeleteModal(false);
            setOrderToDelete(null);
            fetchOrders(currentPage, searchKeyword, sortField, sortDirection, statusFilter);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Không thể xóa Đơn mua hàng");
            console.error("Error deleting Purchase Order:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setOrderToDelete(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    };

    const formatCurrency = (amount) => {
        if (!amount) return "0 ₫";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn mua hàng</h1>
                        </div>
                        {canEdit && (
                            <button
                                onClick={() => navigate("/purchase/purchase-orders/new")}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                + Tạo Đơn mua hàng
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <form onSubmit={handleSearch} className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm Đơn mua hàng..."
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
                                        SỐ ĐƠN HÀNG
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        NHÀ CUNG CẤP
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        NGÀY ĐẶT HÀNG
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        TRẠNG THÁI
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        TỔNG TIỀN
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        NGÀY GIAO HÀNG
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        NGÀY TẠO
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HÀNH ĐỘNG</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => {
                                    const orderId = order.order_id || order.orderId || order.id;
                                    const statusStr = getStatusString(order.status, "Pending");
                                    const approvalStatusStr = getStatusString(order.approval_status || order.approvalStatus, "Pending");
                                    
                                    // ERP standard logic: Only allow Edit/Delete when approval_status = Pending
                                    const canEditOrder = canEdit && approvalStatusStr === "Pending" && statusStr === "Pending";
                                    const canDeleteOrder = canEdit && approvalStatusStr === "Pending" && statusStr === "Pending";
                                    
                                    return (
                                    <tr key={orderId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {orderId?.toString().padStart(3, "0")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {order.po_no || order.poNo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.vendorName || order.vendor?.name || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(order.order_date || order.orderDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {formatCurrency(order.total_after_tax || order.totalAfterTax || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(order.delivery_date || order.deliveryDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(order.created_at || order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/purchase/purchase-orders/${orderId}`)}
                                                    className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                                                    title="Xem chi tiết"
                                                >
                                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                {canEditOrder && (
                                                    <button
                                                        onClick={() => navigate(`/purchase/purchase-orders/${orderId}/edit`)}
                                                        className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {canDeleteOrder && (
                                                    <button
                                                        onClick={() => handleDeleteClick(order)}
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
                                )})}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {!loading && !error && orders.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalElements={totalElements}
                            onPageChange={handlePageChange}
                            onPageSizeChange={(newSize) => {
                                setPageSize(newSize);
                                fetchOrders(0, searchKeyword, sortField, sortDirection, statusFilter);
                            }}
                        />
                    )}
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
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
                                Xác nhận xóa Đơn mua hàng
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Bạn có chắc chắn muốn xóa Đơn mua hàng <strong>"{orderToDelete?.po_no || orderToDelete?.poNo}"</strong> không? Hành động này không thể hoàn tác.
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

