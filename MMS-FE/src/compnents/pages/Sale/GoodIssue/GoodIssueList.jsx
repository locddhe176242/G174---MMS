import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { goodIssueService } from "../../../../api/goodIssueService";
import Pagination from "../../../common/Pagination";

const getStatusBadge = (status) => {
    const map = {
        Pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
        Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800" },
        Rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
    };
    const statusInfo = map[status] || { label: status || "Chờ duyệt", color: "bg-gray-100 text-gray-800" };
    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
        </span>
    );
};

export default function GoodIssueList() {
    const navigate = useNavigate();

    const [issues, setIssues] = useState([]);
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
    const [issueToDelete, setIssueToDelete] = useState(null);
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
        }
        return (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
        );
    };

    const fetchIssues = async (page = 0, keyword = "", sortFieldValue = "createdAt", sortDirectionValue = "desc") => {
        try {
            setLoading(true);
            setError(null);

            const sort = `${sortFieldValue},${sortDirectionValue}`;
            let response;
            if (keyword.trim()) {
                response = await goodIssueService.searchGoodIssuesWithPagination(keyword, page, pageSize, sort);
            } else {
                response = await goodIssueService.getGoodIssuesWithPagination(page, pageSize, sort);
            }

            setIssues(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
            setCurrentPage(page);
        } catch (err) {
            console.error("Error fetching Good Issues:", err);
            setError(err.response?.data?.message || "Không thể tải danh sách Phiếu xuất kho");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    useEffect(() => {
        fetchIssues(currentPage, searchKeyword, sortField, sortDirection);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortField, sortDirection]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchIssues(0, searchKeyword, sortField, sortDirection);
    };

    const handlePageChange = (newPage) => {
        fetchIssues(newPage, searchKeyword, sortField, sortDirection);
    };

    const handleDeleteClick = (issue) => {
        setIssueToDelete(issue);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!issueToDelete) return;
        try {
            setIsDeleting(true);
            await goodIssueService.deleteGoodIssue(issueToDelete.issueId || issueToDelete.issue_id);
            toast.success("Đã xóa Phiếu xuất kho!");
            setShowDeleteModal(false);
            setIssueToDelete(null);
            fetchIssues(currentPage, searchKeyword, sortField, sortDirection);
        } catch (err) {
            console.error("Error deleting Good Issue:", err);
            const errorMsg = err?.response?.data?.message || err?.message || "Không thể xóa Phiếu xuất kho";
            toast.error(errorMsg);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setIssueToDelete(null);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        try {
            return new Date(dateString).toLocaleString("vi-VN");
        } catch {
            return dateString;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            return new Date(dateString).toLocaleDateString("vi-VN");
        } catch {
            return dateString;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý Phiếu Xuất Kho</h1>
                        </div>
                        <button
                            onClick={() => navigate("/sales/good-issues/new")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            + Tạo Phiếu Xuất Kho
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
                                        placeholder="Tìm kiếm Phiếu xuất kho..."
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
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("issueNo")}
                                        >
                                            <div className="flex items-center gap-2">
                                                SỐ PHIẾU
                                                {getSortIcon("issueNo")}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            PHIẾU GIAO HÀNG
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SALES ORDER
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            KHO
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("issueDate")}
                                        >
                                            <div className="flex items-center gap-2">
                                                NGÀY XUẤT
                                                {getSortIcon("issueDate")}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            TRẠNG THÁI
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            NGƯỜI TẠO
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("createdAt")}
                                        >
                                            <div className="flex items-center gap-2">
                                                NGÀY TẠO
                                                {getSortIcon("createdAt")}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            HÀNH ĐỘNG
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {issues.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                                Không có dữ liệu
                                            </td>
                                        </tr>
                                    ) : (
                                        issues.map((issue) => (
                                            <tr key={issue.issueId || issue.issue_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {issue.issueNo || issue.issue_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {issue.deliveryNo || issue.delivery_no || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {issue.salesOrderNo || issue.sales_order_no || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {issue.warehouseName || issue.warehouse_name || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(issue.issueDate || issue.issue_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(issue.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {issue.createdByName || issue.created_by_name || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDateTime(issue.createdAt || issue.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => navigate(`/sales/good-issues/${issue.issueId || issue.issue_id}`)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Xem
                                                        </button>
                                                        {issue.status === "Pending" && (
                                                            <>
                                                                <span className="text-gray-300">|</span>
                                                                <button
                                                                    onClick={() => handleDeleteClick(issue)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalElements={totalElements}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa phiếu xuất kho{" "}
                            <span className="font-semibold">{issueToDelete?.issueNo || issueToDelete?.issue_no}</span>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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

