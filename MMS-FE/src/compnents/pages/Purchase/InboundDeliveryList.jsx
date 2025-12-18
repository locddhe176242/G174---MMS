import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { inboundDeliveryService } from "../../../api/inboundDeliveryService";
import Pagination from "../../common/Pagination";

export default function InboundDeliveryList() {
    const navigate = useNavigate();

    const [deliveries, setDeliveries] = useState([]);
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

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("vi-VN");
        } catch {
            return dateString;
        }
    };

    const getStatusString = (status, fallback = "Draft") => {
        if (!status) return fallback;
        if (typeof status === "string") return status;
        if (typeof status === "object") {
            return status?.name || status?.value || status?.toString() || fallback;
        }
        return String(status);
    };

    const getStatusBadge = (status) => {
        const statusStr = getStatusString(status, "Draft");
        const map = {
            Draft: { label: "Nháp", color: "bg-gray-100 text-gray-800" },
            Pending: { label: "Chờ nhập kho", color: "bg-yellow-100 text-yellow-800" },
            Completed: { label: "Đã nhập kho", color: "bg-green-100 text-green-800" },
            Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
        };
        const statusInfo = map[statusStr] || { label: statusStr, color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
            </span>
        );
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

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa kế hoạch nhận hàng này?")) {
            return;
        }

        try {
            await inboundDeliveryService.deleteInboundDelivery(id);
            toast.success("Đã xóa kế hoạch nhận hàng thành công!");
            loadDeliveries();
        } catch (err) {
            console.error("Delete error:", err);
            toast.error(err?.response?.data?.message || "Có lỗi khi xóa kế hoạch nhận hàng!");
        }
    };

    const loadDeliveries = async () => {
        try {
            setLoading(true);
            setError(null);

            const sort = `${sortField},${sortDirection}`;
            let data;

            if (searchKeyword.trim()) {
                data = await inboundDeliveryService.searchInboundDeliveriesWithPagination(
                    searchKeyword,
                    currentPage,
                    pageSize,
                    sort
                );
            } else {
                data = await inboundDeliveryService.getInboundDeliveriesWithPagination(
                    currentPage,
                    pageSize,
                    sort
                );
            }

            const content = data?.content || [];
            let filtered = content;

            if (statusFilter !== "ALL") {
                filtered = content.filter((delivery) => {
                    const status = getStatusString(delivery.status, "Draft");
                    return status === statusFilter;
                });
            }

            setDeliveries(filtered);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements || 0);
        } catch (err) {
            console.error("Error loading inbound deliveries:", err);
            setError("Không thể tải danh sách kế hoạch nhận hàng");
            toast.error("Không thể tải danh sách kế hoạch nhận hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeliveries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize, sortField, sortDirection, searchKeyword, statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(0);
        loadDeliveries();
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(0);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Kế hoạch nhận hàng
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Quản lý kế hoạch nhận hàng từ nhà cung cấp
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/purchase/inbound-deliveries/new")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            + Tạo kế hoạch mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <form onSubmit={handleSearch} className="flex-1">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo số chứng từ, PO, vendor..."
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Tìm kiếm
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-600">{error}</div>
                    ) : deliveries.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Không tìm thấy kế hoạch nhận hàng nào
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort("inboundDeliveryNo")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Số chứng từ
                                                    {getSortIcon("inboundDeliveryNo")}
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Đơn hàng PO
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nhà cung cấp
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kho
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort("plannedDate")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Ngày dự kiến
                                                    {getSortIcon("plannedDate")}
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tiến độ nhập
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {deliveries.map((delivery) => (
                                            <tr
                                                key={delivery.inboundDeliveryId || delivery.inbound_delivery_id}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() =>
                                                    navigate(
                                                        `/purchase/inbound-deliveries/${
                                                            delivery.inboundDeliveryId || delivery.inbound_delivery_id
                                                        }`
                                                    )
                                                }
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {delivery.inboundDeliveryNo || delivery.inbound_delivery_no || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {delivery.poNo || delivery.po_no || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {delivery.vendorName || delivery.vendor_name || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {delivery.warehouseName || delivery.warehouse_name || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(delivery.plannedDate || delivery.planned_date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {delivery.receivedItems || 0}/{delivery.totalItems || 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(delivery.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(
                                                                    `/purchase/inbound-deliveries/${
                                                                        delivery.inboundDeliveryId || delivery.inbound_delivery_id
                                                                    }`
                                                                );
                                                            }}
                                                            className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                                                            title="Xem chi tiết"
                                                        >
                                                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        {(delivery.status === "Draft" || delivery.status === "Pending") && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(
                                                                        `/purchase/inbound-deliveries/${
                                                                            delivery.inboundDeliveryId || delivery.inbound_delivery_id
                                                                        }/edit`
                                                                    );
                                                                }}
                                                                className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {delivery.status === "Draft" && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(delivery.inboundDeliveryId || delivery.inbound_delivery_id);
                                                                }}
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

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                pageSize={pageSize}
                                onPageSizeChange={handlePageSizeChange}
                                totalElements={totalElements}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
