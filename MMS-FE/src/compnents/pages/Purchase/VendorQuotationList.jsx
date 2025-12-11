import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { purchaseQuotationService } from "../../../api/purchaseQuotationService";
import Pagination from "../../common/Pagination";

const STATUS_OPTIONS = [
    { value: "ALL", label: "Tất cả" },
    { value: "Draft", label: "Bản nháp" },
    { value: "Pending", label: "Chờ xử lý" },
    { value: "Sent", label: "Đã gửi" },
    { value: "Approved", label: "Đã phê duyệt" },
    { value: "Rejected", label: "Đã từ chối" },
    { value: "Expired", label: "Hết hạn" },
];

const getSafeString = (value, fallback = "-") => {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "object") return value?.name || value?.value || fallback;
    return String(value);
};

const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount || 0));

const formatDate = (value) => {
    if (!value) return "-";
    try {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("vi-VN");
    } catch {
        return "-";
    }
};

const getStatusBadgeClass = (status) => {
    const normalized = (status || "Pending").toString();
    const map = {
        Draft: "bg-gray-100 text-gray-800",
        Pending: "bg-yellow-100 text-yellow-800",
        Sent: "bg-blue-100 text-blue-800",
        Approved: "bg-green-100 text-green-800",
        Rejected: "bg-red-100 text-red-800",
        Expired: "bg-orange-100 text-orange-800",
    };
    return map[normalized] || "bg-gray-100 text-gray-800";
};

const VendorQuotationList = () => {
    const navigate = useNavigate();

    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchKeyword, setSearchKeyword] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");

    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const sortIcon = useMemo(() => {
        return (field) => {
            const isActive = sortField === field;
            const baseClass = "w-4 h-4";

            if (!isActive) {
                return (
                    <svg className={`${baseClass} text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11h10M7 7h10M7 15h10" />
                    </svg>
                );
            }

            const path =
                sortDirection === "asc"
                    ? "M5 15l7-7 7 7"
                    : "M19 9l-7 7-7-7";

            return (
                <svg className={`${baseClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
                </svg>
            );
        };
    }, [sortDirection, sortField]);

    // Group quotations by RFQ for visual indication
    const rfqGroups = useMemo(() => {
        const groups = {};
        quotations.forEach((q) => {
            const rfqId = q?.rfqId || q?.rfq_id || q?.rfq?.id;
            if (rfqId) {
                if (!groups[rfqId]) {
                    groups[rfqId] = [];
                }
                groups[rfqId].push(q);
            }
        });
        return groups;
    }, [quotations]);

    const fetchQuotations = async (page = 0, keyword = searchKeyword, sort = `${sortField},${sortDirection}`, status = statusFilter) => {
        try {
            setLoading(true);
            setError(null);

            const normalizedStatus = status === "ALL" ? undefined : status;
            let response;

            if (keyword.trim()) {
                response = await purchaseQuotationService.searchQuotationsWithPagination(keyword.trim(), page, pageSize, sort);
            } else {
                response = await purchaseQuotationService.getQuotationsWithPagination(page, pageSize, sort);
            }

            const content = Array.isArray(response?.content) ? response.content : [];
            const filteredContent = normalizedStatus
                ? content.filter((q) => getSafeString(q.status, "Pending") === normalizedStatus)
                : content;

            setQuotations(filteredContent);
            setTotalPages(response?.totalPages ?? 0);
            setTotalElements(response?.totalElements ?? filteredContent.length);
            setCurrentPage(page);
        } catch (err) {
            console.error("Error loading vendor quotations:", err);
            setError("Không thể tải danh sách báo giá nhà cung cấp");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchQuotations(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortField, sortDirection]);

    useEffect(() => {
        fetchQuotations(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchQuotations(0, searchKeyword);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const openDetailModal = (quotation) => {
        setSelectedQuotation(quotation);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedQuotation(null);
    };

    const navigateToCreate = () => {
        toast.info("Vui lòng chọn RFQ và nhà cung cấp từ màn hình RFQ để tạo báo giá.");
        navigate("/purchase/rfqs");
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan="9" className="py-10 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                            Đang tải dữ liệu...
                        </div>
                    </td>
                </tr>
            );
        }

        if (error) {
            return (
                <tr>
                    <td colSpan="9" className="py-10 text-center">
                        <div className="text-red-600">{error}</div>
                        <button
                            onClick={() => fetchQuotations(currentPage)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Thử lại
                        </button>
                    </td>
                </tr>
            );
        }

        if (!quotations.length) {
            return (
                <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-500">
                        Không có báo giá nào phù hợp
                    </td>
                </tr>
            );
        }

        return quotations.map((quotation, index) => {
            const id = quotation?.id || quotation?.pqId || quotation?.quotationId;
            const pqNo = quotation?.pqNo || quotation?.quotationNo || quotation?.pq_no;
            const vendorName = quotation?.vendorName || quotation?.vendor?.name;
            const rfqNo = quotation?.rfqNo || quotation?.rfq?.rfqNo || quotation?.rfq?.code;
            const rfqId = quotation?.rfqId || quotation?.rfq_id || quotation?.rfq?.id;
            const status = getSafeString(quotation?.status, "Pending");
            const totalAmount = quotation?.totalAmount || quotation?.total_amount;
            const validUntil = quotation?.validUntil || quotation?.valid_until;
            const createdAt = quotation?.createdAt || quotation?.created_at;

            // Check if this RFQ has multiple quotations
            const rfqQuotations = rfqGroups[rfqId] || [];
            const hasMultiple = rfqQuotations.length > 1;
            const isFirstInGroup = index === 0 || (quotations[index - 1]?.rfqId || quotations[index - 1]?.rfq_id || quotations[index - 1]?.rfq?.id) !== rfqId;
            
            // Generate distinct colors for different RFQ groups
            const groupColors = ['bg-blue-50', 'bg-purple-50', 'bg-green-50', 'bg-yellow-50', 'bg-pink-50'];
            const colorIndex = Object.keys(rfqGroups).indexOf(String(rfqId)) % groupColors.length;
            const rowBgColor = hasMultiple ? groupColors[colorIndex] : 'bg-white';

            return (
                <tr key={id} className={`hover:bg-gray-100 ${rowBgColor}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pqNo || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendorName || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-700">{rfqNo || "-"}</span>
                            {hasMultiple && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium" title={`${rfqQuotations.length} nhà cung cấp đã báo giá`}>
                                    {rfqQuotations.length} PQs
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(quotation?.pqDate || quotation?.pq_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(validUntil)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(status)}`}>
                            {status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => openDetailModal(quotation)}
                                className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                                title="Xem chi tiết"
                            >
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            {hasMultiple && (
                                <button
                                    onClick={() => navigate(`/purchase/rfqs/${rfqId}/compare-quotations`)}
                                    className="text-green-600 hover:text-green-800"
                                    title="So sánh các báo giá"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/purchase/rfqs/${rfqId}`)}
                                disabled={!rfqId}
                                className="text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                                title="Xem RFQ"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Báo giá nhà cung cấp</h1>
                        </div>
                        <button
                            onClick={navigateToCreate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            + Tạo báo giá mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <form onSubmit={handleSearch} className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        placeholder="Tìm kiếm theo mã báo giá, nhà cung cấp, RFQ..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
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

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <button onClick={() => handleSort("pqNo")} className="flex items-center gap-2">
                                        Mã báo giá
                                        {sortIcon("pqNo")}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Nhà cung cấp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    RFQ liên quan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <button onClick={() => handleSort("pqDate")} className="flex items-center gap-2">
                                        Ngày báo giá
                                        {sortIcon("pqDate")}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <button onClick={() => handleSort("validUntil")} className="flex items-center gap-2">
                                        Hiệu lực đến
                                        {sortIcon("validUntil")}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <button onClick={() => handleSort("totalAmount")} className="flex items-center gap-2">
                                        Tổng tiền
                                        {sortIcon("totalAmount")}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <button onClick={() => handleSort("createdAt")} className="flex items-center gap-2">
                                        Ngày tạo
                                        {sortIcon("createdAt")}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">{renderTableBody()}</tbody>
                        </table>
                    </div>

                    {!loading && !error && quotations.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalElements={totalElements}
                            onPageChange={(page) => fetchQuotations(page)}
                            onPageSizeChange={(newSize) => {
                                setPageSize(newSize);
                                fetchQuotations(0);
                            }}
                        />
                    )}
                </div>
            </div>

            {isDetailModalOpen && selectedQuotation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Chi tiết báo giá</p>
                                <h3 className="text-lg font-semibold text-gray-900">{selectedQuotation?.pqNo || selectedQuotation?.pq_no}</h3>
                            </div>
                            <button onClick={closeDetailModal} className="text-gray-500 hover:text-gray-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Nhà cung cấp</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedQuotation?.vendorName || selectedQuotation?.vendor?.name || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">RFQ</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedQuotation?.rfqNo || selectedQuotation?.rfq?.rfqNo || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Ngày báo giá</p>
                                    <p className="text-sm text-gray-700">{formatDate(selectedQuotation?.pqDate || selectedQuotation?.pq_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Hiệu lực đến</p>
                                    <p className="text-sm text-gray-700">{formatDate(selectedQuotation?.validUntil || selectedQuotation?.valid_until)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Tổng tiền</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedQuotation?.totalAmount || selectedQuotation?.total_amount)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Trạng thái</p>
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(selectedQuotation?.status)}`}>
                                        {getSafeString(selectedQuotation?.status, "Pending")}
                                    </span>
                                </div>
                            </div>

                            {selectedQuotation?.notes && (
                                <div className="bg-gray-50 rounded-md p-4">
                                    <p className="text-xs text-gray-500 uppercase mb-1">Ghi chú</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">{selectedQuotation.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={closeDetailModal}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorQuotationList;

