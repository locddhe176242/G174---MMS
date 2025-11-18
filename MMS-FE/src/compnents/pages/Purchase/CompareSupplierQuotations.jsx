import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { rfqService } from "../../../api/rfqService";
import apiClient from "../../../api/apiClient";

export default function CompareSupplierQuotations() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [rfqData, setRfqData] = useState(null);
    const [quotations, setQuotations] = useState([]);
    const [selectedQuotations, setSelectedQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    // Helpers
    const formatDate = (dateString, format = "MM/DD/YYYY") => {
        if (!dateString) return "-";
        try {
            const d = new Date(dateString);
            if (format === "MM/DD/YYYY") {
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const year = d.getFullYear();
                return `${month}/${day}/${year}`;
            }
            return d.toLocaleDateString("vi-VN");
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (amount, currency = "USD") => {
        if (!amount) return `0.00 ${currency}`;
        if (currency === "USD") {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
            }).format(amount);
        }
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        const map = {
            Draft: { label: "Nháp", color: "bg-gray-100 text-gray-800" },
            Pending: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800" },
            Submitted: { label: "Đã gửi", color: "bg-green-100 text-green-800" },
            Approved: { label: "Đã phê duyệt", color: "bg-blue-100 text-blue-800" },
            Rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
        };

        const statusInfo = map[status] || { label: status || "Đang chờ", color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
        );
    };

    // Mock data for testing without backend
    const getMockRFQData = () => {
        const rfqId = id || 1;
        const today = new Date();
        const issueDate = new Date(today);
        issueDate.setDate(today.getDate() - 3);
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 7);
        const createdDate = new Date(today);
        createdDate.setDate(today.getDate() - 5);

        return {
            rfqId: rfqId,
            rfqNo: `RFQ1400`,
            status: "Published",
            issueDate: issueDate.toISOString(),
            issue_date: issueDate.toISOString(),
            dueDate: dueDate.toISOString(),
            due_date: dueDate.toISOString(),
            createdAt: createdDate.toISOString(),
            created_at: createdDate.toISOString(),
            selectedVendorIds: [1, 2, 3],
        };
    };

    const getMockQuotations = () => {
        const today = new Date();
        const quoteDate = new Date("2023-08-24");

        return [
            {
                pq_id: 1,
                pq_no: "8000000003",
                vendor_id: 1,
                vendorName: "Mid-West Supply 400 (1003061)",
                vendorAddress: "335 W Industrial Lake Dr, Lincoln NE 68528, USA",
                status: "Submitted",
                totalAmount: 6400,
                quotationDate: quoteDate.toISOString(),
                fullyQuotedItems: 1,
                totalItems: 1,
                bestPricedItems: 1,
                isBest: true,
            },
            {
                pq_id: 2,
                pq_no: "8000000005",
                vendor_id: 2,
                vendorName: "Spy Gear (107400)",
                vendorAddress: "8405 Greensboro Dr., McLean VA 22102, USA",
                status: "Submitted",
                totalAmount: 7000,
                quotationDate: quoteDate.toISOString(),
                fullyQuotedItems: 1,
                totalItems: 1,
                bestPricedItems: 0,
                isBest: false,
            },
            {
                pq_id: 3,
                pq_no: "8000000004",
                vendor_id: 3,
                vendorName: "Dallas Bike Basics (103400)",
                vendorAddress: "5215 N O'Connor Blvd, Irving TX 75039, USA",
                status: "Submitted",
                totalAmount: 7300,
                quotationDate: quoteDate.toISOString(),
                fullyQuotedItems: 1,
                totalItems: 1,
                bestPricedItems: 0,
                isBest: false,
            },
        ];
    };

    // Calculate best quotation
    const bestQuotation = useMemo(() => {
        if (!quotations || quotations.length === 0) return null;
        return quotations.reduce((best, current) => {
            if (!best || current.totalAmount < best.totalAmount) {
                return current;
            }
            return best;
        }, null);
    }, [quotations]);

    // Fetch data from backend
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setErr(null);

                let rfq = null;
                let quotes = [];

                // Fetch RFQ detail
                try {
                    rfq = await rfqService.getRFQById(id);
                } catch (e) {
                    console.warn("Error loading RFQ from backend, using mock data:", e);
                    rfq = getMockRFQData();
                    toast.info("Đang sử dụng dữ liệu mẫu để test (chưa có backend)");
                }

                // Fetch quotations
                try {
                    const response = await apiClient.get(`/purchase-quotations`, {
                        params: { rfq_id: id }
                    });
                    quotes = Array.isArray(response.data)
                        ? response.data
                        : response.data?.content || [];
                } catch (e) {
                    console.warn("Error loading quotations, using mock data:", e);
                    quotes = getMockQuotations();
                }

                // If all failed, use all mock data
                if (!rfq) {
                    rfq = getMockRFQData();
                    quotes = getMockQuotations();
                    toast.info("Đang sử dụng dữ liệu mẫu để test (chưa có backend)");
                }

                // Mark best quotation
                if (quotes.length > 0) {
                    const best = quotes.reduce((best, current) => {
                        if (!best || current.totalAmount < best.totalAmount) {
                            return current;
                        }
                        return best;
                    }, null);
                    quotes = quotes.map(q => ({
                        ...q,
                        isBest: q.pq_id === best?.pq_id
                    }));
                }

                if (mounted) {
                    setRfqData(rfq);
                    setQuotations(quotes);
                }
            } catch (e) {
                console.error("Error loading compare quotations:", e);
                if (mounted) {
                    // Even if everything fails, use mock data
                    const mockRfq = getMockRFQData();
                    const mockQuotes = getMockQuotations();

                    setRfqData(mockRfq);
                    setQuotations(mockQuotes);
                    toast.info("Đang sử dụng dữ liệu mẫu để test (chưa có backend)");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    const handleQuotationSelect = (pqId) => {
        setSelectedQuotations(prev => {
            if (prev.includes(pqId)) {
                return prev.filter(id => id !== pqId);
            }
            return [...prev, pqId];
        });
    };

    const handleSelectAll = () => {
        if (selectedQuotations.length === quotations.length) {
            setSelectedQuotations([]);
        } else {
            setSelectedQuotations(quotations.map(q => q.pq_id));
        }
    };

    const handleCompareAward = () => {
        if (selectedQuotations.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một báo giá để so sánh");
            return;
        }
        // TODO: Implement compare/award functionality
        toast.info(`Đang so sánh ${selectedQuotations.length} báo giá...`);
    };

    // Render
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
                    <div className="text-red-600 mb-4">Lỗi: {err}</div>
                    <button
                        onClick={() => navigate("/purchase/rfqs")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    if (!rfqData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Không có dữ liệu</div>
            </div>
        );
    }

    const submittedCount = quotations.filter(q => q.status === "Submitted").length;
    const invitedCount = rfqData.selectedVendorIds?.length || quotations.length;
    const progressPercentage = invitedCount > 0 ? (submittedCount / invitedCount) * 100 : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* RFQ Overview Section */}
                <div className="bg-white border rounded-lg p-6 mb-6">
                    {/* RFQ ID Section */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <label className="text-sm text-gray-600">RFQ:</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={rfqData.rfqNo || rfqData.rfq_no || ""}
                                    className="border-none bg-transparent font-medium text-sm focus:outline-none"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(rfqData.rfqNo || rfqData.rfq_no);
                                        toast.success("Đã sao chép!");
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold">
                            {rfqData.rfqNo || rfqData.rfq_no}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - RFQ Details */}
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-gray-600">Ngày tạo: </span>
                                <span className="font-medium">
                  {rfqData.createdAt || rfqData.created_at ? formatDate(rfqData.createdAt || rfqData.created_at) : "-"}
                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Ngày xuất bản: </span>
                                <span className="font-medium">
                  {rfqData.issueDate || rfqData.issue_date ? formatDate(rfqData.issueDate || rfqData.issue_date) : "-"}
                </span>
                            </div>
                        </div>

                        {/* Right Column - Key Metrics */}
                        <div className="space-y-5">
                            {/* Status */}
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Trạng thái</div>
                                <div className="text-2xl font-bold">
                                    {rfqData.status === "Published" ? "Đã xuất bản" : rfqData.status}
                                </div>
                            </div>

                            {/* Quotation Deadline */}
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Hạn chót báo giá</div>
                                <div className="text-2xl font-bold">
                                    {rfqData.dueDate || rfqData.due_date ? formatDate(rfqData.dueDate || rfqData.due_date) : "-"}
                                </div>
                            </div>

                            {/* Number of Invited Bidders - Circular Progress */}
                            <div>
                                <div className="text-sm text-gray-600 mb-2">Số lượng nhà cung cấp được mời</div>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16">
                                        <svg className="w-16 h-16 transform -rotate-90">
                                            <circle
                                                cx="32"
                                                cy="32"
                                                r="28"
                                                stroke="#e5e7eb"
                                                strokeWidth="6"
                                                fill="none"
                                            />
                                            <circle
                                                cx="32"
                                                cy="32"
                                                r="28"
                                                stroke={progressPercentage === 100 ? "#10b981" : "#3b82f6"}
                                                strokeWidth="6"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 28}`}
                                                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercentage / 100)}`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-bold">{submittedCount}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium">
                                        {submittedCount}
                                    </div>
                                </div>
                            </div>

                            {/* Best Quotation - Horizontal Bar */}
                            {bestQuotation && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Báo giá tốt nhất</div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-24 bg-red-500 rounded"></div>
                                        <div className="text-lg font-bold text-green-600">
                                            {formatCurrency(bestQuotation.totalAmount, "USD")}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quotations Table Section */}
                <div className="bg-white border rounded-lg">
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div className="font-semibold text-lg">
                            Báo giá ({quotations.length})
                        </div>
                        <button
                            onClick={handleCompareAward}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            So sánh và trao thầu
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6">
                        {quotations.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                Chưa có báo giá nào được gửi
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                    <tr className="text-left text-gray-600 border-b">
                                        <th className="py-3 pr-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedQuotations.length === quotations.length && quotations.length > 0}
                                                onChange={handleSelectAll}
                                                className="rounded"
                                            />
                                        </th>
                                        <th className="py-3 pr-4 font-medium">Báo giá nhà cung cấp</th>
                                        <th className="py-3 pr-4 font-medium">Nhà cung cấp</th>
                                        <th className="py-3 pr-4 font-medium">Địa chỉ</th>
                                        <th className="py-3 pr-4 font-medium">Trạng thái</th>
                                        <th className="py-3 pr-4 text-right font-medium">Tổng giá trị báo giá (ròng)</th>
                                        <th className="py-3 pr-4 font-medium">Ngày báo giá</th>
                                        <th className="py-3 pr-4 text-center font-medium">Số mặt hàng đã báo giá đầy đủ</th>
                                        <th className="py-3 pr-4 text-center font-medium">Số mặt hàng có giá tốt nhất</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {quotations.map((quotation) => {
                                        const isSelected = selectedQuotations.includes(quotation.pq_id);
                                        const isBest = quotation.isBest;

                                        return (
                                            <tr
                                                key={quotation.pq_id}
                                                className={`border-t hover:bg-gray-50 ${
                                                    isBest ? "bg-green-50" : ""
                                                }`}
                                            >
                                                <td className="py-3 pr-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleQuotationSelect(quotation.pq_id)}
                                                        className="rounded"
                                                    />
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <button
                                                        onClick={() => navigate(`/purchase/vendor-quotations/${quotation.pq_id}`)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {quotation.pq_no}
                                                    </button>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <button
                                                        onClick={() => navigate(`/vendors/${quotation.vendor_id}`)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {quotation.vendorName}
                                                    </button>
                                                </td>
                                                <td className="py-3 pr-4 text-gray-600">
                                                    {quotation.vendorAddress}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {getStatusBadge(quotation.status)}
                                                </td>
                                                <td className={`py-3 pr-4 text-right font-medium ${
                                                    isBest ? "text-green-600" : "text-gray-900"
                                                }`}>
                                                    {formatCurrency(quotation.totalAmount, "USD")}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {formatDate(quotation.quotationDate)}
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    {quotation.fullyQuotedItems}/{quotation.totalItems}
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    {quotation.bestPricedItems}/{quotation.totalItems}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

