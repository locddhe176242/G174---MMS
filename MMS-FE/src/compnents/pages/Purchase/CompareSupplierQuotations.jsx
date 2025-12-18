import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { rfqService } from "../../../api/rfqService";
import { purchaseQuotationService } from "../../../api/purchaseQuotationService";
import apiClient from "../../../api/apiClient";
import { getCurrentUser } from "../../../api/authService";

export default function CompareSupplierQuotations() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [rfqData, setRfqData] = useState(null);
    const [quotations, setQuotations] = useState([]);
    const [selectedQuotations, setSelectedQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [canSelectVendor, setCanSelectVendor] = useState(false);
    const [hasPurchaseOrder, setHasPurchaseOrder] = useState(false);

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

    const formatCurrency = (amount, currency = "VND") => {
        if (!amount && amount !== 0) return `0 ${currency === "USD" ? "USD" : "₫"}`;
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
        // Handle both string and enum object formats
        const statusStr = typeof status === 'string' ? status : (status?.name || status?.toString() || 'Pending');
        
        const map = {
            Pending: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800" },
            Approved: { label: "Đã phê duyệt", color: "bg-blue-100 text-blue-800" },
            Rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
        };

        const statusInfo = map[statusStr] || { label: statusStr || "Đang chờ", color: "bg-gray-100 text-gray-800" };
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
                deliveryLeadTime: "7 ngày",
                paymentTerms: "Net 30",
                deliveryTerms: "FOB",
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
                deliveryLeadTime: "10 ngày",
                paymentTerms: "Thanh toán sau khi nhận và giao hàng",
                deliveryTerms: "CIF",
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
                deliveryLeadTime: "14 ngày",
                paymentTerms: "Net 60",
                deliveryTerms: "FOB",
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

    // Get current user and check if PURCHASE or MANAGER role
    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
        const userRoles = user?.roles || [];
        console.log('Current user roles:', userRoles);
        const canSelect = userRoles.some(role => 
            role === 'PURCHASE' || role === 'ROLE_PURCHASE' || role?.name === 'PURCHASE' ||
            role === 'MANAGER' || role === 'ROLE_MANAGER' || role?.name === 'MANAGER'
        );
        console.log('Can select vendor:', canSelect);
        setCanSelectVendor(canSelect);
    }, []);

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

                // Fetch quotations by RFQ ID
                try {
                    quotes = await purchaseQuotationService.getQuotationsByRfqId(id);
                    if (!Array.isArray(quotes)) {
                        quotes = [];
                    }
                } catch (e) {
                    console.warn("Error loading quotations from backend:", e);
                    // Fallback to empty array instead of mock data
                    quotes = [];
                    toast.warn("Không thể tải danh sách báo giá từ nhà cung cấp");
                }

                // If all failed, use all mock data
                if (!rfq) {
                    rfq = getMockRFQData();
                    quotes = getMockQuotations();
                    toast.info("Đang sử dụng dữ liệu mẫu để test (chưa có backend)");
                }

                // Mark best quotation and map to expected format
                if (quotes.length > 0) {
                    const best = quotes.reduce((best, current) => {
                        const currentAmount = Number(current.totalAmount || 0);
                        const bestAmount = best ? Number(best.totalAmount || 0) : Infinity;
                        if (!best || currentAmount < bestAmount) {
                            return current;
                        }
                        return best;
                    }, null);
                    quotes = quotes.map(q => {
                        // Calculate expected delivery date from leadTimeDays
                        let expectedDeliveryDate = '-';
                        const leadTimeDays = q.leadTimeDays || q.lead_time_days;
                        if (leadTimeDays && (q.pqDate || q.pq_date || q.createdAt || q.created_at)) {
                            const baseDate = new Date(q.pqDate || q.pq_date || q.createdAt || q.created_at);
                            const deliveryDate = new Date(baseDate);
                            deliveryDate.setDate(baseDate.getDate() + Number(leadTimeDays));
                            expectedDeliveryDate = deliveryDate.toLocaleDateString('vi-VN');
                        }
                        
                        return {
                            pqId: q.pqId || q.pq_id,
                            pqNo: q.pqNo || q.pq_no,
                            vendorId: q.vendorId || q.vendor_id,
                            vendorName: q.vendorName || q.vendor_name || '',
                            vendorAddress: q.vendorAddress || q.vendor_address || '',
                            status: q.status,
                            totalAmount: Number(q.totalAmount || q.total_amount || 0),
                            quotationDate: q.pqDate || q.pq_date || q.createdAt || q.created_at,
                            fullyQuotedItems: q.items?.length || 0,
                            totalItems: rfq?.items?.length || 0,
                            leadTimeDays: leadTimeDays || null,
                            deliveryLeadTime: leadTimeDays ? `${leadTimeDays} ngày` : '-',
                            expectedDeliveryDate: expectedDeliveryDate,
                            paymentTerms: q.paymentTerms || q.payment_terms || '-',
                            deliveryTerms: q.deliveryTerms || q.delivery_terms || '-',
                            isBest: (q.pqId || q.pq_id) === (best?.pqId || best?.pq_id)
                        };
                    });
                }

                // Check if any quotation already has PO created
                let hasExistingPO = false;
                try {
                    const response = await apiClient.get(`/purchase-orders/rfq/${id}`);
                    hasExistingPO = response.data && response.data.length > 0;
                } catch (e) {
                    console.log("No existing PO or error checking:", e);
                }

                if (mounted) {
                    setRfqData(rfq);
                    setQuotations(quotes);
                    setHasPurchaseOrder(hasExistingPO);
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
        console.log('Selecting quotation:', pqId, 'Current selected:', selectedQuotations);
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
            setSelectedQuotations(quotations.map(q => q.pqId || q.pq_id));
        }
    };

    const handleCompareAward = async () => {
        if (selectedQuotations.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một báo giá để so sánh");
            return;
        }

        // If multiple quotations selected, automatically choose the one with best price
        let selectedId;
        if (selectedQuotations.length > 1) {
            const selectedQuotationsList = quotations.filter(q => 
                selectedQuotations.includes(q.pqId || q.pq_id)
            );
            const bestSelected = selectedQuotationsList.reduce((best, current) => {
                const currentAmount = Number(current.totalAmount || 0);
                const bestAmount = best ? Number(best.totalAmount || 0) : Infinity;
                if (!best || currentAmount < bestAmount) {
                    return current;
                }
                return best;
            }, null);
            selectedId = bestSelected?.pqId || bestSelected?.pq_id;
            toast.info(`Đã tự động chọn báo giá tốt nhất: ${bestSelected?.pqNo || bestSelected?.pq_no} (${new Intl.NumberFormat("vi-VN").format(bestSelected?.totalAmount || 0)} ₫)`);
        } else {
            selectedId = selectedQuotations[0];
        }

        const selectedQuotation = quotations.find(q => (q.pqId || q.pq_id) === selectedId);
        if (!selectedQuotation) {
            toast.error("Không tìm thấy báo giá được chọn");
            return;
        }

        try {
            // Get current user for approverId
            const currentUser = getCurrentUser();
            const approverId = currentUser?.userId || currentUser?.user_id || currentUser?.id || 1;

            console.log('Awarding quotation:', selectedId);
            
            // 1. Approve winner quotation
            await purchaseQuotationService.approveQuotation(selectedId, approverId);
            // Toast sẽ hiện ở PO form khi load xong, không cần toast ở đây

            // 2. Reject other quotations from the same RFQ
            const otherQuotations = quotations.filter(q => {
                const qId = q.pqId || q.pq_id;
                return qId !== selectedId;
            });

            if (otherQuotations.length > 0) {
                await Promise.all(
                    otherQuotations.map(q => {
                        const qId = q.pqId || q.pq_id;
                        return purchaseQuotationService.rejectQuotation(
                            qId, 
                            approverId, 
                            "Báo giá khác đã được chọn"
                        );
                    })
                );
                console.log(`Rejected ${otherQuotations.length} other quotations`);
            }

            // 3. Close RFQ after awarding
            try {
                await rfqService.closeRFQ(id);
                console.log('RFQ closed after awarding');
            } catch (closeErr) {
                console.warn('Could not close RFQ:', closeErr);
            }

            // 4. Get full quotation details before navigating
            let fullQuotationData = null;
            try {
                fullQuotationData = await purchaseQuotationService.getQuotationById(selectedId);
            } catch (err) {
                console.warn('Could not load full quotation details:', err);
                fullQuotationData = selectedQuotation;
            }

            // 5. Navigate to PO form with full data
            console.log('Navigating to PO form with quotation_id:', selectedId);
            const prId = rfqData?.prId || rfqData?.pr_id;
            const rfqId = rfqData?.rfqId || rfqData?.rfq_id || id;
            
            // Store quotation data in sessionStorage to pass to PO form
            sessionStorage.setItem('selectedQuotationData', JSON.stringify({
                quotation: fullQuotationData,
                rfqId: rfqId,
                prId: prId
            }));
            
            const navUrl = prId 
                ? `/purchase/purchase-orders/new?quotation_id=${selectedId}&pr_id=${prId}&rfq_id=${rfqId}`
                : `/purchase/purchase-orders/new?quotation_id=${selectedId}&rfq_id=${rfqId}`;
            navigate(navUrl);
        } catch (error) {
            console.error('Error awarding quotation:', error);
            toast.error(error.response?.data?.message || "Không thể trao thầu. Vui lòng thử lại");
        }
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

    const submittedCount = quotations.filter(q => {
        const statusStr = typeof q.status === 'string' ? q.status : (q.status?.name || q.status?.toString() || '');
        return statusStr === 'Approved' || statusStr === 'Pending';
    }).length;
    const totalInvited = rfqData.selectedVendorIds?.length || quotations.length;
    const progressPercentage = totalInvited > 0 ? (submittedCount / totalInvited) * 100 : 0;

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
                                    {(() => {
                                        const statusStr = typeof rfqData.status === 'string' ? rfqData.status : (rfqData.status?.name || rfqData.status?.toString() || 'Draft');
                                        const statusMap = {
                                            'Draft': 'Nháp',
                                            'Pending': 'Chờ phản hồi',
                                            'Sent': 'Đã gửi',
                                            'Published': 'Đã xuất bản',
                                            'Completed': 'Hoàn thành',
                                            'Closed': 'Đã đóng',
                                            'Cancelled': 'Đã hủy'
                                        };
                                        return statusMap[statusStr] || statusStr;
                                    })()}
                                </div>
                            </div>

                            {/* Quotation Deadline */}
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Hạn chót báo giá</div>
                                <div className="text-2xl font-bold">
                                    {rfqData.dueDate || rfqData.due_date ? formatDate(rfqData.dueDate || rfqData.due_date) : "-"}
                                </div>
                            </div>

                            {/* Number of Invited Bidders - Text Format */}
                            <div>
                                <div className="text-sm text-gray-600 mb-2">Số lượng nhà cung cấp được mời</div>
                                <div className="text-2xl font-bold">
                                    {submittedCount}/{totalInvited}
                                </div>
                            </div>

                            {/* Best Quotation - With Vendor Name */}
                            {bestQuotation && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Báo giá tốt nhất</div>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm font-medium text-gray-700">
                                            {bestQuotation.vendorName || "N/A"}
                                        </div>
                                        <div className="text-lg font-bold text-green-600">
                                            {formatCurrency(bestQuotation.totalAmount || 0, "VND")}
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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/purchase/rfqs/${id}`)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Quay lại
                            </button>
                            {!hasPurchaseOrder && (
                                <button
                                    onClick={handleCompareAward}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    Chọn nhà cung cấp
                                </button>
                            )}
                            {hasPurchaseOrder && (
                                <div className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                                    ✓ Đã tạo đơn mua hàng
                                </div>
                            )}
                        </div>
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
                                        <th className="py-3 pr-4 font-medium">Trạng thái</th>
                                        <th className="py-3 pr-4 text-right font-medium">Tổng giá trị báo giá</th>
                                        <th className="py-3 pr-4 font-medium">Ngày báo giá</th>
                                        <th className="py-3 pr-4 text-center font-medium">Số mặt hàng đã báo giá đầy đủ</th>
                                        <th className="py-3 pr-4 text-center font-medium">Ngày nhận hàng dự kiến</th>
                                        <th className="py-3 pr-4 text-center font-medium">Điều khoản thanh toán</th>
                                        <th className="py-3 pr-4 text-center font-medium">Điều khoản giao hàng</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {quotations.map((quotation) => {
                                        const pqId = quotation.pqId || quotation.pq_id;
                                        const isSelected = selectedQuotations.includes(pqId);
                                        const isBest = quotation.isBest;

                                        return (
                                            <tr
                                                key={pqId}
                                                className={`border-t hover:bg-gray-50 ${
                                                    isBest ? "bg-green-50" : ""
                                                }`}
                                            >
                                                <td className="py-3 pr-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleQuotationSelect(pqId)}
                                                        className="rounded"
                                                    />
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <button
                                                        onClick={() => navigate(`/purchase/purchase-quotations/${pqId}`)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {quotation.pqNo || quotation.pq_no}
                                                    </button>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <button
                                                        onClick={() => navigate(`/vendors/${quotation.vendorId || quotation.vendor_id}`)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {quotation.vendorName || ''}
                                                    </button>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {getStatusBadge(quotation.status)}
                                                </td>
                                                <td className={`py-3 pr-4 text-right font-medium ${
                                                    isBest ? "text-green-600" : "text-gray-900"
                                                }`}>
                                                    {formatCurrency(quotation.totalAmount || 0, "VND")}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {formatDate(quotation.quotationDate)}
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    {quotation.fullyQuotedItems || 0}/{quotation.totalItems || 0}
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    {quotation.deliveryLeadTime || '-'}
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    {quotation.paymentTerms || '-'}
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    {quotation.deliveryTerms || '-'}
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

