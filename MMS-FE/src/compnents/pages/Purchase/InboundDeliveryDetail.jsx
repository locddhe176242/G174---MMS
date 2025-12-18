import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { inboundDeliveryService } from "../../../api/inboundDeliveryService";
import { getCurrentUser, getCurrentRoles } from "../../../api/authService";

const Stat = ({ label, value }) => (
    <div className="flex-1 text-center">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
    </div>
);

export default function InboundDeliveryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userRoles, setUserRoles] = useState([]);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("vi-VN");
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleString("vi-VN");
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
            Planned: { label: "Đã lên kế hoạch", color: "bg-blue-100 text-blue-800" },
            InTransit: { label: "Đang vận chuyển", color: "bg-yellow-100 text-yellow-800" },
            Arrived: { label: "Đã đến", color: "bg-green-100 text-green-800" },
            Completed: { label: "Hoàn thành", color: "bg-purple-100 text-purple-800" },
            Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
        };
        const statusInfo = map[statusStr] || { label: statusStr, color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
            </span>
        );
    };

    useEffect(() => {
        const init = async () => {
            try {
                const user = getCurrentUser();
                const roles = getCurrentRoles();
                setCurrentUser(user);
                setUserRoles(roles);
            } catch (err) {
                console.warn("Could not load current user:", err);
            }
        };
        init();
    }, []);

    useEffect(() => {
        loadInboundDelivery();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadInboundDelivery = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await inboundDeliveryService.getInboundDeliveryById(id);
            console.log("Inbound Delivery Data:", response);

            setData(response);
            setItems(Array.isArray(response.items) ? response.items : response.items?.content || []);
        } catch (err) {
            console.error("Error loading inbound delivery:", err);
            setError("Không thể tải thông tin kế hoạch nhận hàng");
        } finally {
            setLoading(false);
        }
    };

    const handleSendToWarehouse = async () => {
        try {
            await inboundDeliveryService.updateStatus(id, "Pending");
            toast.success("Đã gửi kế hoạch nhận hàng đến Warehouse thành công!");
            loadInboundDelivery(); // Reload để cập nhật status
        } catch (err) {
            console.error("Error updating status:", err);
            const errorMsg = err?.response?.data?.message || err?.message || "Không thể gửi kế hoạch nhận hàng";
            toast.error(`${errorMsg}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error || "Không tìm thấy dữ liệu"}</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalItems = items.length;
    const totalExpectedQty = items.reduce((sum, item) => sum + Number(item.expectedQty || item.expected_qty || 0), 0);
    const statusStr = getStatusString(data.status, "Draft");
    const canEdit = statusStr === "Draft";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/purchase/inbound-deliveries")}
                                className="px-3 py-1.5 rounded border hover:bg-gray-50"
                            >
                                ← Quay lại
                            </button>
                            <h1 className="text-2xl font-semibold">
                                Kế hoạch nhận hàng: {data.inboundDeliveryNo || data.inbound_delivery_no || `#${id}`}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {statusStr === "Draft" && (
                                <button
                                    onClick={handleSendToWarehouse}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Gửi đi
                                </button>
                            )}
                            {canEdit && (
                                <button
                                    onClick={() => navigate(`/purchase/inbound-deliveries/${id}/edit`)}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Chỉnh sửa
                                </button>
                            )}
                            {statusStr === "Pending" && !userRoles.includes("PURCHASE") && (
                                <button
                                    onClick={() => navigate(`/purchase/goods-receipts/new?inbound_id=${id}`)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Tạo phiếu nhập kho
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT CONTENT */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary */}
                        <div className="bg-white border rounded-lg p-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <Stat label="Số sản phẩm" value={totalItems} />
                                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                                <Stat label="Tổng số lượng dự kiến" value={totalExpectedQty.toLocaleString()} />
                                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                                <div className="flex-1 text-center">
                                    <div className="text-sm text-gray-500">Trạng thái</div>
                                    <div className="text-xl font-semibold flex justify-center mt-1">
                                        {getStatusBadge(data.status)}
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
                                                    <th className="py-3 pr-4 text-center">#</th>
                                                    <th className="py-3 pr-4">Mã SP</th>
                                                    <th className="py-3 pr-4">Tên sản phẩm</th>
                                                    <th className="py-3 pr-4 text-center">ĐVT</th>
                                                    <th className="py-3 pr-4 text-right">SL đặt hàng</th>
                                                    <th className="py-3 pr-4 text-right">SL dự kiến</th>
                                                    <th className="py-3 pr-4">Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, index) => (
                                                    <tr key={item.idiId || item.idi_id || index} className="border-t hover:bg-gray-50">
                                                        <td className="py-3 pr-4 text-center">{index + 1}</td>
                                                        <td className="py-3 pr-4">{item.productCode || item.productSku || "-"}</td>
                                                        <td className="py-3 pr-4">{item.productName || item.product_name || "-"}</td>
                                                        <td className="py-3 pr-4 text-center">{item.uom || "-"}</td>
                                                        <td className="py-3 pr-4 text-right">
                                                            {Number(item.orderedQty || item.ordered_qty || 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 pr-4 text-right font-medium">
                                                            {Number(item.expectedQty || item.expected_qty || 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 pr-4 text-gray-600">{item.notes || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
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
                                {data.createdAt || data.created_at ? (
                                    <div className="text-xs text-gray-500 mt-2">
                                        Ngày tạo: {formatDateTime(data.createdAt || data.created_at)}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white border rounded-lg">
                            <div className="px-6 py-4 border-b font-medium">Thông tin cơ bản</div>
                            <div className="p-6 space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Số chứng từ: </span>
                                    <span className="font-medium">
                                        {data.inboundDeliveryNo || data.inbound_delivery_no || "-"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Đơn hàng PO: </span>
                                    <span className="font-medium">{data.poNo || data.po_no || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Kho: </span>
                                    <span className="font-medium">
                                        {data.warehouseName || data.warehouse_name || "-"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Ngày dự kiến: </span>
                                    <span className="font-medium">
                                        {formatDate(data.plannedDate || data.planned_date)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {(data.shippingAddress || data.shipping_address) && (
                            <div className="bg-white border rounded-lg">
                                <div className="px-6 py-4 border-b font-medium">Địa chỉ giao hàng</div>
                                <div className="p-6 text-sm whitespace-pre-wrap text-gray-700">
                                    {data.shippingAddress || data.shipping_address}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {data.notes && (
                            <div className="bg-white border rounded-lg">
                                <div className="px-6 py-4 border-b font-medium">Ghi chú</div>
                                <div className="p-6 text-sm whitespace-pre-wrap text-gray-700">{data.notes}</div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
