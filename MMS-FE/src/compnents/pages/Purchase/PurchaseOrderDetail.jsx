import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";
import { purchaseOrderService } from "../../../api/purchaseOrderService";
import { getCurrentUser, hasRole } from "../../../api/authService";
import apiClient from "../../../api/apiClient";

const Stat = ({ label, value }) => (
    <div className="flex-1 text-center">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
    </div>
);

export default function PurchaseOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // Helpers
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString("vi-VN");
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        try {
            const d = new Date(dateString);
            return d.toLocaleString("vi-VN");
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return "0 ₫";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const getProductCode = (item) =>
        item.productCode ||
        item.product_code ||
        item.productName ||
        item.product_name ||
        "-";

    const lineValue = (item) => {
        return Math.round((Number(item?.line_total || item?.lineTotal || 0)) * 100) / 100;
    };

    const totalValue = useMemo(() => {
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((sum, item) => sum + lineValue(item), 0);
    }, [items]);

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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
        );
    };

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.warn("Could not load current user:", error);
            }
        };
        loadUser();
    }, []);

    const currentUserId = currentUser?.userId || currentUser?.user_id || currentUser?.id;

    const loadOrder = async () => {
        try {
            setLoading(true);
            setErr(null);
            const orderData = await purchaseOrderService.getPurchaseOrderById(id);
            console.log("=== ORDER DATA RECEIVED ===", orderData);
            
            // Fetch vendor details to get email
            if (orderData?.vendorId) {
                try {
                    const vendorResponse = await apiClient.get(`/vendors/${orderData.vendorId}`);
                    console.log("📧 Vendor details:", vendorResponse.data);
                    // Add vendor email to order data
                    orderData.vendorEmail = vendorResponse.data?.email || vendorResponse.data?.vendorEmail || vendorResponse.data?.contact?.email;
                    console.log("✅ Vendor email found:", orderData.vendorEmail);
                } catch (vendorErr) {
                    console.warn("Could not fetch vendor details:", vendorErr);
                }
            }
            
            setData(orderData);
            setItems(orderData?.items || []);
        } catch (e) {
            console.error("Error loading Purchase Order detail:", e);
            console.error("Full error:", e.response?.data);
            setErr(
                e?.response?.data?.message ||
                e.message ||
                "Không thể tải dữ liệu Đơn mua hàng"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadOrder();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleApprove = async () => {
        if (!currentUserId) {
            toast.error("Không xác định được người phê duyệt.");
            return;
        }
        try {
            setActionLoading(true);
            await purchaseOrderService.approvePurchaseOrder(id, currentUserId);
            toast.success("Đã phê duyệt đơn hàng thành công!");
            setShowApproveModal(false);
            await loadOrder();
        } catch (e) {
            toast.error(e?.response?.data?.message || "Không thể phê duyệt đơn hàng");
            console.error("Error approving order:", e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!currentUserId) {
            toast.error("Không xác định được người phê duyệt.");
            return;
        }
        if (!rejectReason.trim()) {
            toast.warn("Vui lòng nhập lý do từ chối.");
            return;
        }
        try {
            setActionLoading(true);
            await purchaseOrderService.rejectPurchaseOrder(id, currentUserId, rejectReason.trim());
            toast.success("Đã từ chối đơn hàng!");
            setShowRejectModal(false);
            setRejectReason("");
            await loadOrder();
        } catch (e) {
            toast.error(e?.response?.data?.message || "Không thể từ chối đơn hàng");
            console.error("Error rejecting order:", e);
        } finally {
            setActionLoading(false);
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
                        onClick={() => navigate("/purchase/purchase-orders")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Không có dữ liệu</div>
            </div>
        );
    }

    const totalItems = items.length;
    const totalBeforeTax = Number(data.total_before_tax || data.totalBeforeTax || 0);
    const taxAmount = Number(data.tax_amount || data.taxAmount || 0);
    const totalAfterTax = Number(data.total_after_tax || data.totalAfterTax || 0);
    const normalizedStatus = getStatusString(data.status, "Pending");
    const normalizedApprovalStatus = getStatusString(data.approval_status || data.approvalStatus, "Pending");
    const canApprove = hasRole("MANAGER") && normalizedApprovalStatus === "Pending";
    const canCreateGR = (hasRole("WAREHOUSE") || hasRole("MANAGER")) && normalizedApprovalStatus === "Approved" && normalizedStatus === "Sent" && !data?.hasGoodsReceipt;
    // Chỉ cho phép Edit khi: Pending hoặc Rejected (chưa được Approved)
    const canEdit = normalizedApprovalStatus === "Pending" || normalizedApprovalStatus === "Rejected";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/purchase/purchase-orders")}
                                className="px-3 py-1.5 rounded border hover:bg-gray-50"
                                title="Quay lại trang trước"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                            <h1 className="text-2xl font-semibold">
                                Đơn mua hàng: {data.po_no || data.poNo || `#${id}`}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {canApprove && (
                                <>
                                    <button
                                        onClick={() => setShowApproveModal(true)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        disabled={actionLoading}
                                    >
                                        Phê duyệt
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRejectReason("");
                                            setShowRejectModal(true);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        disabled={actionLoading}
                                    >
                                        Từ chối
                                    </button>
                                </>
                            )}
                            {canCreateGR && (
                                <button
                                    onClick={() => navigate(`/purchase/goods-receipts/new?po_id=${id}`)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Tạo phiếu nhập kho
                                </button>
                            )}
                            {normalizedApprovalStatus === "Approved" && data?.hasGoodsReceipt && (
                                <div className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                                    ✓ Đã tạo phiếu nhập kho
                                </div>
                            )}
                            {canEdit && (
                                <button
                                    onClick={() => navigate(`/purchase/purchase-orders/${id}/edit`)}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT CONTENT */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary */}
                        <div className="bg-white border rounded-lg p-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <Stat
                                    label="Tổng giá trị"
                                    value={formatCurrency(totalAfterTax)}
                                />
                                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                                <Stat label="Số sản phẩm" value={totalItems} />
                                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                                <div className="flex-1 text-center">
                                    <div className="text-sm text-gray-500">Trạng thái</div>
                                    <div className="text-xl font-semibold flex justify-center mt-1">
                                        {getStatusBadge(data.status)}
                                    </div>
                                </div>
                                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                                <div className="flex-1 text-center">
                                    <div className="text-sm text-gray-500">Phê duyệt</div>
                                    <div className="text-xl font-semibold flex justify-center mt-1">
                                        {getApprovalStatusBadge(data.approval_status || data.approvalStatus)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-white border rounded-lg">
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <div className="font-medium text-lg">Danh sách sản phẩm</div>
                            </div>
                            <div className="p-6">
                                {items.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8">Không có sản phẩm nào</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                            <tr className="text-left text-gray-500 border-b">
                                                <th className="py-3 pr-4">#</th>
                                                <th className="py-3 pr-4">Mã SP</th>
                                                <th className="py-3 pr-4">Tên sản phẩm</th>
                                                <th className="py-3 pr-4">ĐVT</th>
                                                <th className="py-3 pr-4">Số lượng</th>
                                                <th className="py-3 pr-4">Đơn giá</th>
                                                <th className="py-3 pr-4">CK (%)</th>
                                                <th className="py-3 pr-4">Thuế (%)</th>
                                                <th className="py-3 pr-4">Tiền thuế</th>
                                                <th className="py-3 pr-4 text-right">Thành tiền</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {items.map((item, index) => {
                                                const itemTotal = lineValue(item);
                                                return (
                                                    <tr key={item.poi_id || item.id || index} className="border-t hover:bg-gray-50">
                                                        <td className="py-3 pr-4">{index + 1}</td>
                                                        <td className="py-3 pr-4">
                                        {getProductCode(item)}
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            {item.productName || item.product_name || "-"}
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            {item.uom || "-"}
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            {Number(item.quantity || 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            {formatCurrency(item.unit_price || item.unitPrice || 0)}
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            <span className={item.discount_percent || item.discountPercent ? "text-green-600 font-medium" : ""}>
                                                                {Number(item.discount_percent || item.discountPercent || 0).toFixed(2)}%
                                                            </span>
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            {Number(item.tax_rate || item.taxRate || 0).toFixed(2)}%
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            {formatCurrency(item.tax_amount || item.taxAmount || 0)}
                                                        </td>
                                                        <td className="py-3 pr-0 text-right font-medium">
                                                            {formatCurrency(itemTotal)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                            <tfoot>
                                            {(() => {
                                                // Tính toán các giá trị
                                                const subtotal = items.reduce((sum, item) => {
                                                    const qty = Number(item.quantity || 0);
                                                    const price = Number(item.unit_price || item.unitPrice || 0);
                                                    return sum + (qty * price);
                                                }, 0);
                                                
                                                const itemDiscounts = items.reduce((sum, item) => {
                                                    const qty = Number(item.quantity || 0);
                                                    const price = Number(item.unit_price || item.unitPrice || 0);
                                                    const discountPercent = Number(item.discount_percent || item.discountPercent || 0);
                                                    return sum + (qty * price * discountPercent / 100);
                                                }, 0);
                                                
                                                const afterItemDiscount = subtotal - itemDiscounts;
                                                const headerDiscountAmount = Math.round(afterItemDiscount * (data.headerDiscount || 0) / 100 * 100) / 100;
                                                const afterHeaderDiscount = afterItemDiscount - headerDiscountAmount;
                                                const totalTax = taxAmount;
                                                const finalTotal = totalAfterTax;
                                                
                                                return (
                                                    <>
                                                        <tr className="border-t bg-gray-50">
                                                            <td colSpan={9} className="py-3 pr-4 text-right">
                                                                Tạm tính:
                                                            </td>
                                                            <td className="py-3 pr-0 text-right">
                                                                {formatCurrency(subtotal)}
                                                            </td>
                                                        </tr>
                                                        {itemDiscounts > 0 && (
                                                            <>
                                                                <tr className="bg-gray-50">
                                                                    <td colSpan={9} className="py-3 pr-4 text-right">
                                                                        Chiết khấu sản phẩm:
                                                                    </td>
                                                                    <td className="py-3 pr-0 text-right text-red-600">
                                                                        {formatCurrency(itemDiscounts)}
                                                                    </td>
                                                                </tr>
                                                                <tr className="bg-gray-50">
                                                                    <td colSpan={9} className="py-3 pr-4 text-right">
                                                                        Tổng sau chiết khấu sản phẩm:
                                                                    </td>
                                                                    <td className="py-3 pr-0 text-right">
                                                                        {formatCurrency(afterItemDiscount)}
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        )}
                                                        {data.headerDiscount > 0 && (
                                                            <>
                                                                <tr className="bg-gray-50">
                                                                    <td colSpan={9} className="py-3 pr-4 text-right">
                                                                        Chiết khấu tổng đơn ({data.headerDiscount}%):
                                                                    </td>
                                                                    <td className="py-3 pr-0 text-right text-red-600">
                                                                        {formatCurrency(headerDiscountAmount)}
                                                                    </td>
                                                                </tr>
                                                                <tr className="bg-gray-50">
                                                                    <td colSpan={9} className="py-3 pr-4 text-right">
                                                                        Tiền sau khi chiết khấu tổng đơn:
                                                                    </td>
                                                                    <td className="py-3 pr-0 text-right">
                                                                        {formatCurrency(afterHeaderDiscount)}
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        )}
                                                        <tr className="bg-gray-50">
                                                            <td colSpan={9} className="py-3 pr-4 text-right">
                                                                Thuế:
                                                            </td>
                                                            <td className="py-3 pr-0 text-right">
                                                                {formatCurrency(totalTax)}
                                                            </td>
                                                        </tr>
                                                        <tr className="border-t-2 font-semibold bg-gray-100">
                                                            <td colSpan={9} className="py-3 pr-4 text-right">
                                                                Tổng cộng:
                                                            </td>
                                                            <td className="py-3 pr-0 text-right">
                                                                {formatCurrency(finalTotal)}
                                                            </td>
                                                        </tr>
                                                    </>
                                                );
                                            })()}
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <aside className="space-y-6 lg:sticky lg:top-6">
                        {/* Status */}
                        <div className="bg-white border rounded-lg">
                            <div className="px-6 py-4 border-b font-medium">Trạng thái</div>
                            <div className="p-6 text-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-600">Trạng thái hiện tại:</span>
                                    {getStatusBadge(data.status)}
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-600">Trạng thái phê duyệt:</span>
                                    {getApprovalStatusBadge(data.approval_status || data.approvalStatus)}
                                </div>
                                {data.created_at || data.createdAt ? (
                                    <div className="text-xs text-gray-500 mt-2">
                                        Ngày tạo: {formatDateTime(data.created_at || data.createdAt)}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white border rounded-lg">
                            <div className="px-6 py-4 border-b font-medium">
                                Thông tin cơ bản
                            </div>
                            <div className="p-6 space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Số đơn hàng: </span>
                                    <span className="font-medium">
                    {data.po_no || data.poNo || "-"}
                  </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Nhà cung cấp: </span>
                                    <span className="font-medium">
                    {data.vendorName || data.vendor_name || "-"}
                  </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Ngày đặt hàng: </span>
                                    <span className="font-medium">
                    {data.order_date || data.orderDate
                        ? formatDate(data.order_date || data.orderDate)
                        : "-"}
                  </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Ngày giao hàng: </span>
                                    <span className="font-medium">
                    {data.delivery_date || data.deliveryDate
                        ? formatDate(data.delivery_date || data.deliveryDate)
                        : "-"}
                  </span>
                                </div>
                                {data.pq_no || data.pqNo ? (
                                    <div>
                                        <span className="text-gray-500">Báo giá: </span>
                                        <span className="font-medium">
                      {data.pq_no || data.pqNo}
                    </span>
                                    </div>
                                ) : null}
                                {data.payment_terms || data.paymentTerms ? (
                                    <div>
                                        <span className="text-gray-500">Điều khoản thanh toán: </span>
                                        <span className="font-medium">
                      {data.payment_terms || data.paymentTerms}
                    </span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {data.shipping_address || data.shippingAddress ? (
                            <div className="bg-white border rounded-lg">
                                <div className="px-6 py-4 border-b font-medium">
                                    Địa chỉ giao hàng
                                </div>
                                <div className="p-6 text-sm whitespace-pre-wrap text-gray-700">
                                    {data.shipping_address || data.shippingAddress}
                                </div>
                            </div>
                        ) : null}

                        {/* Approval Info */}
                        {data.approved_at || data.approvedAt ? (
                            <div className="bg-white border rounded-lg">
                                <div className="px-6 py-4 border-b font-medium">
                                    Thông tin phê duyệt
                                </div>
                                <div className="p-6 space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Ngày phê duyệt: </span>
                                        <span className="font-medium">
                      {formatDateTime(data.approved_at || data.approvedAt)}
                    </span>
                                    </div>
                                    {data.approverName ? (
                                        <div>
                                            <span className="text-gray-500">Người phê duyệt: </span>
                                            <span className="font-medium">
                        {data.approverName}
                      </span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </aside>
                </div>
            </div>
            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-3">Phê duyệt đơn hàng</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Bạn có chắc chắn muốn phê duyệt đơn hàng {data.poNo || data.po_no || `#${id}`}?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                disabled={actionLoading}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Đang xử lý..." : "Phê duyệt"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-3">Từ chối đơn hàng</h3>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lý do từ chối <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Nhập lý do từ chối"
                            disabled={actionLoading}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                disabled={actionLoading}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Đang xử lý..." : "Từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}