import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { goodsReceiptService } from "../../../api/goodsReceiptService";
import apiClient from "../../../api/apiClient";
import { getCurrentUser } from "../../../api/authService";

export default function GoodsReceiptDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [poItems, setPoItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user);
        } catch (error) {
            console.warn("Could not load current user:", error);
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

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        try {
            return new Date(dateString).toLocaleString("vi-VN");
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            Pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            Approved: { label: "Approved", color: "bg-green-100 text-green-800" },
            Rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
        };
        const statusInfo = map[status] || { label: status || "Pending", color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
        );
    };

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setErr(null);

                console.log("=== LOADING GOODS RECEIPT DETAIL ===");
                console.log("Receipt ID:", id);

                const receipt = await goodsReceiptService.getGoodsReceiptById(id);
                console.log("Receipt data:", receipt);
                console.log("Receipt items from detail:", receipt.items);

                // Get items from receipt detail response
                const receiptItems = Array.isArray(receipt.items)
                    ? receipt.items
                    : receipt.items?.content || [];
                console.log("Receipt items:", receiptItems);

                let orderItems = [];
                const orderId = receipt.order_id || receipt.orderId;
                console.log("Order ID:", orderId);
                if (orderId) {
                    try {
                        const poItemsResponse = await apiClient.get(`/purchase-orders/${orderId}/items`);
                        console.log("PO items response:", poItemsResponse.data);
                        orderItems = Array.isArray(poItemsResponse.data)
                            ? poItemsResponse.data
                            : poItemsResponse.data?.content || [];
                    } catch (poError) {
                        console.warn("Could not load purchase order items:", poError);
                    }
                }

                if (mounted) {
                    setData(receipt);
                    setItems(receiptItems);
                    setPoItems(orderItems);
                    console.log("=== DATA SET SUCCESSFULLY ===");
                }
            } catch (error) {
                console.error("=== ERROR LOADING GOODS RECEIPT ===");
                console.error("Error:", error);
                console.error("Error response:", error?.response?.data);
                if (mounted) {
                    setErr(error?.response?.data?.message || "Không thể tải Phiếu nhập kho");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    const handleApproveClick = () => {
        if (!currentUser || !currentUser.userId) {
            toast.error("Không tìm thấy thông tin người dùng");
            return;
        }
        setShowApproveModal(true);
    };

    const handleApproveConfirm = async () => {
        setIsSubmitting(true);
        try {
            await goodsReceiptService.approveGoodsReceipt(id, currentUser.userId);
            toast.success("Đã phê duyệt Phiếu nhập kho!");
            const updated = await goodsReceiptService.getGoodsReceiptById(id);
            setData(updated);
            setShowApproveModal(false);
        } catch (error) {
            console.error("Approve Goods Receipt failed:", error);
            toast.error(error?.response?.data?.message || "Không thể phê duyệt Phiếu nhập kho");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectClick = () => {
        if (!currentUser || !currentUser.userId) {
            toast.error("Không tìm thấy thông tin người dùng");
            return;
        }
        setRejectReason("");
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        setIsSubmitting(true);
        try {
            await goodsReceiptService.rejectGoodsReceipt(id, currentUser.userId, rejectReason);
            toast.success("Đã từ chối Phiếu nhập kho!");
            const updated = await goodsReceiptService.getGoodsReceiptById(id);
            setData(updated);
            setShowRejectModal(false);
        } catch (error) {
            console.error("Reject Goods Receipt failed:", error);
            toast.error(error?.response?.data?.message || "Không thể từ chối Phiếu nhập kho");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPoItem = (poiId) => {
        if (!poiId || !poItems || poItems.length === 0) return null;
        return poItems.find((item) => (item.poi_id || item.id) === poiId);
    };

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
                        onClick={() => navigate("/purchase/goods-receipts")}
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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/purchase/goods-receipts")}
                                className="px-3 py-1.5 rounded border hover:bg-gray-50"
                            >
                                ← Quay lại
                            </button>
                            <h1 className="text-2xl font-semibold">
                                Phiếu nhập kho: {data.receipt_no || data.receiptNo}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {data.status === "Pending" && (
                                <>
                                    <button
                                        onClick={handleApproveClick}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Phê duyệt
                                    </button>
                                    <button
                                        onClick={handleRejectClick}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => navigate(`/purchase/goods-receipts/${id}/edit`)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Chỉnh sửa
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-500">Số phiếu</div>
                                    <div className="text-lg font-semibold">{data.receipt_no || data.receiptNo}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Trạng thái</div>
                                    <div className="mt-1">{getStatusBadge(data.status)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Đơn hàng</div>
                                    <div className="font-medium">{data.order?.po_no || data.order?.poNo || data.order_id}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Kho</div>
                                    <div className="font-medium">{data.warehouse?.name || data.warehouseName}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Ngày nhận</div>
                                    <div className="font-medium">{formatDate(data.received_date || data.receivedDate)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Người tạo</div>
                                    <div className="font-medium">{data.createdByName || data.created_by_name || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Ngày tạo</div>
                                    <div className="font-medium">{formatDateTime(data.created_at || data.createdAt)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Ngày duyệt</div>
                                    <div className="font-medium">{data.approved_at || data.approvedAt ? formatDateTime(data.approved_at || data.approvedAt) : "-"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border rounded-lg">
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <div className="font-medium text-lg">Danh sách hàng hóa</div>
                            </div>
                            <div className="p-6">
                                {items.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8">Không có dữ liệu</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                            <tr className="text-left text-gray-500 border-b">
                                                <th className="py-3 pr-4">#</th>
                                                <th className="py-3 pr-4">Sản phẩm</th>
                                                <th className="py-3 pr-4 text-right">SL nhận</th>
                                                <th className="py-3 pr-4 text-right">SL chấp nhận</th>
                                                <th className="py-3 pr-4">Ghi chú</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {items.map((item, index) => {
                                                const poItem = getPoItem(item.poi_id || item.poiId);
                                                return (
                                                    <tr key={item.gri_id || item.id || index} className="border-t hover:bg-gray-50">
                                                        <td className="py-3 pr-4">{index + 1}</td>
                                                        <td className="py-3 pr-4">
                                                            <div className="font-medium">{poItem?.productName || poItem?.product_name || item.productName || item.product_name || "-"}</div>
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {poItem?.productCode || poItem?.sku || "-"}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4 text-right">
                                                            {Number(item.received_qty || item.receivedQty || 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 pr-4 text-right">
                                                            {Number(item.accepted_qty || item.acceptedQty || 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 pr-4 text-gray-600">
                                                            {item.remark || "-"}
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

                    <aside className="space-y-6 lg:sticky lg:top-6">
                        {data.order && (
                            <div className="bg-white border rounded-lg">
                                <div className="px-6 py-4 border-b font-medium">Thông tin đơn hàng</div>
                                <div className="p-6 text-sm space-y-2">
                                    <div>
                                        <span className="text-gray-500">Số đơn hàng: </span>
                                        <span className="font-medium">{data.order.po_no || data.order.poNo}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Nhà cung cấp: </span>
                                        <span className="font-medium">{data.order.vendor?.name || data.order.vendorName || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Ngày đặt hàng: </span>
                                        <span className="font-medium">{formatDate(data.order.order_date || data.order.orderDate)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {data.warehouse && (
                            <div className="bg-white border rounded-lg">
                                <div className="px-6 py-4 border-b font-medium">Thông tin kho</div>
                                <div className="p-6 text-sm space-y-2">
                                    <div>
                                        <span className="text-gray-500">Tên kho: </span>
                                        <span className="font-medium">{data.warehouse.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Địa chỉ: </span>
                                        <span className="font-medium">{data.warehouse.address || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Quản lý: </span>
                                        <span className="font-medium">{data.warehouse.managerName || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {data.notes && (
                            <div className="bg-white border rounded-lg">
                                <div className="px-6 py-4 border-b font-medium">Ghi chú</div>
                                <div className="p-6 text-sm text-gray-700 whitespace-pre-wrap">
                                    {data.notes}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Xác nhận phê duyệt</h3>
                        </div>
                        <div className="px-6 py-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">
                                        Bạn có chắc chắn muốn phê duyệt Phiếu nhập kho <strong>{data.receipt_no || data.receiptNo}</strong> không?
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Sau khi phê duyệt, hàng hóa sẽ được cập nhật vào kho.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleApproveConfirm}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                Phê duyệt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Từ chối phiếu nhập kho</h3>
                        </div>
                        <div className="px-6 py-4">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">
                                        Bạn đang từ chối Phiếu nhập kho <strong>{data.receipt_no || data.receiptNo}</strong>
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lý do từ chối <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows="4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Nhập lý do từ chối..."
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={isSubmitting || !rejectReason.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

