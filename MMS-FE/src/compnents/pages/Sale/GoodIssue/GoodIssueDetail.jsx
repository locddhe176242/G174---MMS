import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { goodIssueService } from "../../../../api/goodIssueService";

export default function GoodIssueDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        if (id) {
            loadIssue();
        }
    }, [id]);

    const loadIssue = async () => {
        try {
            setLoading(true);
            setErr(null);

            const issue = await goodIssueService.getGoodIssueById(id);
            const issueItems = Array.isArray(issue.items) ? issue.items : issue.items?.content || [];

            setData(issue);
            setItems(issueItems);
        } catch (error) {
            setErr(error?.response?.data?.message || "Không thể tải Phiếu xuất kho");
        } finally {
            setLoading(false);
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
            Pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
            Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800" },
            Rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
        };
        const statusInfo = map[status] || { label: status || "Chờ duyệt", color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
            </span>
        );
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
                        onClick={() => navigate("/sales/good-issues")}
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
                                onClick={() => navigate("/sales/good-issues")}
                                className="px-3 py-1.5 rounded border hover:bg-gray-50"
                            >
                                ← Quay lại
                            </button>
                            <h1 className="text-2xl font-semibold">
                                Phiếu xuất kho: {data.issueNo || data.issue_no}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {data.status === "Pending" && (
                                <button
                                    onClick={() => navigate("/admin/approvals")}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Đến phần Phê duyệt
                                </button>
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
                                    <div className="text-lg font-semibold">{data.issueNo || data.issue_no}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Trạng thái</div>
                                    <div className="mt-1">{getStatusBadge(data.status)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Phiếu giao hàng</div>
                                    <div className="font-medium">{data.deliveryNo || data.delivery_no || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Sales Order</div>
                                    <div className="font-medium">{data.salesOrderNo || data.sales_order_no || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Khách hàng</div>
                                    <div className="font-medium">{data.customerName || data.customer_name || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Kho xuất hàng</div>
                                    <div className="font-medium">{data.warehouseName || data.warehouse_name || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Ngày xuất kho</div>
                                    <div className="font-medium">{formatDate(data.issueDate || data.issue_date)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Người tạo</div>
                                    <div className="font-medium">{data.createdByName || data.created_by_name || "-"}</div>
                                </div>
                                {data.status === "Approved" && (
                                    <>
                                        <div>
                                            <div className="text-gray-500">Người duyệt</div>
                                            <div className="font-medium">{data.approvedByName || data.approved_by_name || "-"}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Ngày duyệt</div>
                                            <div className="font-medium">{formatDateTime(data.approvedAt || data.approved_at)}</div>
                                        </div>
                                    </>
                                )}
                                <div className="md:col-span-2">
                                    <div className="text-gray-500">Ghi chú</div>
                                    <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                                        {data.notes || "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-4">Danh sách sản phẩm</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">#</th>
                                            <th className="px-4 py-2 text-left">Mã sản phẩm</th>
                                            <th className="px-4 py-2 text-left">Tên sản phẩm</th>
                                            <th className="px-4 py-2 text-right">ĐVT</th>
                                            <th className="px-4 py-2 text-right">Số lượng dự kiến</th>
                                            <th className="px-4 py-2 text-right">Số lượng xuất</th>
                                            <th className="px-4 py-2 text-left">Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                                    Không có sản phẩm nào
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-center">{index + 1}</td>
                                                    <td className="px-4 py-2">{item.productCode || item.product_code || "-"}</td>
                                                    <td className="px-4 py-2">{item.productName || item.product_name || "-"}</td>
                                                    <td className="px-4 py-2 text-right">{item.uom || "-"}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        {Number(item.plannedQty || item.planned_qty || 0).toLocaleString("vi-VN")}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-medium">
                                                        {Number(item.issuedQty || item.issued_qty || 0).toLocaleString("vi-VN")}
                                                    </td>
                                                    <td className="px-4 py-2">{item.remark || "-"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white border rounded-lg p-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Thông tin bổ sung</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="text-gray-500">Ngày tạo</div>
                                    <div className="font-medium">{formatDateTime(data.createdAt || data.created_at)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Ngày cập nhật</div>
                                    <div className="font-medium">{formatDateTime(data.updatedAt || data.updated_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
