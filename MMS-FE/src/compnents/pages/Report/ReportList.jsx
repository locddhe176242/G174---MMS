import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reportService } from "../../../api/reportService";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";

export default function ReportList() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Filters
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    // Delete confirm modal
    const [deleteModal, setDeleteModal] = useState({ open: false, reportId: null });

    useEffect(() => {
        fetchReports(0);
    }, [pageSize]);

    const fetchReports = async (page = 0) => {
        try {
            setLoading(true);
            setError(null);

            const filters = {
                page,
                size: pageSize,
                sortBy: "generatedAt",
                sortDir: "desc"
            };

            if (typeFilter) filters.type = typeFilter;
            if (statusFilter) filters.status = statusFilter;
            if (searchKeyword) filters.keyword = searchKeyword;

            const response = (typeFilter || statusFilter || searchKeyword) ?
                await reportService.filterReports(filters) :
                await reportService.getAllReports(page, pageSize);

            setReports(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
            setCurrentPage(page);
        } catch (err) {
            console.error("Error fetching reports:", err);
            setError("Không thể tải danh sách báo cáo");
            toast.error("Không thể tải danh sách báo cáo");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchReports(0);
    };

    const handlePageChange = (newPage) => {
        fetchReports(newPage);
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(0);
    };

    const handleDeleteClick = (reportId) => {
        setDeleteModal({ open: true, reportId });
    };

    const confirmDelete = async () => {
        try {
            await reportService.deleteReport(deleteModal.reportId);
            toast.success("Đã xóa báo cáo thành công");
            setDeleteModal({ open: false, reportId: null });
            fetchReports(currentPage);
        } catch (err) {
            console.error("Error deleting report:", err);
            toast.error("Không thể xóa báo cáo");
        }
    };

    const getTypeLabel = (type) => {
        const map = {
            Inventory: "Tồn kho",
            Purchase: "Mua hàng",
            Sales: "Bán hàng",
            Financial: "Tài chính"
        };
        return map[type] || type;
    };

    const getStatusLabel = (status) => {
        const map = {
            Pending: "Đang xử lý",
            Completed: "Hoàn thành",
            Failed: "Thất bại"
        };
        return map[status] || status;
    };

    const getStatusColor = (status) => {
        const map = {
            Pending: "bg-yellow-100 text-yellow-700",
            Completed: "bg-green-100 text-green-700",
            Failed: "bg-red-100 text-red-700"
        };
        return map[status] || "bg-gray-100 text-gray-700";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý báo cáo</h1>
                            <p className="text-sm text-gray-600 mt-1">Tạo và quản lý các báo cáo hệ thống</p>
                        </div>
                        <button
                            onClick={() => navigate("/reports/generate")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            + Tạo báo cáo mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm">
                    {/* Search and Filters */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <form onSubmit={handleSearch} className="flex items-center gap-4 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm báo cáo..."
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Tìm kiếm
                                </button>
                            </form>

                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); fetchReports(0); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">Tất cả loại báo cáo</option>
                                <option value="Inventory">Tồn kho</option>
                                <option value="Purchase">Mua hàng</option>
                                <option value="Sales">Bán hàng</option>
                                <option value="Financial">Tài chính</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); fetchReports(0); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="Pending">Đang xử lý</option>
                                <option value="Completed">Hoàn thành</option>
                                <option value="Failed">Thất bại</option>
                            </select>
                        </div>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên báo cáo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tạo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reports.map((report) => (
                                        <tr key={report.reportId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() => navigate(`/reports/${report.reportId}`)}
                                                    className="text-blue-600 hover:underline font-medium"
                                                >
                                                    {report.name}
                                                </button>
                                                {report.description && (
                                                    <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {getTypeLabel(report.type)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(report.status)}`}>
                                                    {getStatusLabel(report.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {report.generatedByEmail || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(report.generatedAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/reports/${report.reportId}`)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                                        title="Xem chi tiết"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(report.reportId)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                                        title="Xóa"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && !error && reports.length > 0 && (
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

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteModal({ open: false, reportId: null })}></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                        </div>
                        <div className="px-6 py-5 text-gray-700">
                            Bạn có chắc chắn muốn xóa báo cáo này không?
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal({ open: false, reportId: null })}
                                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
