import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { reportService } from "../../../api/reportService";
import { toast } from "react-toastify";

export default function ReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await reportService.getReportById(id);
            setReport(response);
        } catch (err) {
            console.error("Error fetching report:", err);
            toast.error("Không thể tải báo cáo");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await reportService.deleteReport(id);
            toast.success("Đã xóa báo cáo");
            navigate("/reports");
        } catch (err) {
            console.error("Error deleting report:", err);
            toast.error("Không thể xóa báo cáo");
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            Pending: "bg-yellow-100 text-yellow-800",
            Completed: "bg-green-100 text-green-800",
            Failed: "bg-red-100 text-red-800"
        };
        const labels = {
            Pending: "Đang xử lý",
            Completed: "Hoàn thành",
            Failed: "Thất bại"
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getTypeLabel = (type) => {
        const labels = {
            Inventory: "Tồn kho",
            Purchase: "Mua hàng",
            Sales: "Bán hàng",
            Financial: "Tài chính"
        };
        return labels[type] || type;
    };

    const renderReportData = () => {
        if (!report?.parsedData) return null;

        const data = report.parsedData;

        switch (report.type) {
            case "Inventory":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Tổng số sản phẩm</p>
                                <p className="text-2xl font-bold text-blue-600">{data.totalProducts || 0}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Tổng số lượng</p>
                                <p className="text-2xl font-bold text-green-600">{data.totalQuantity || 0}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Tổng giá trị</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {data.totalValue?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                        </div>
                        {data.lowStockItems && data.lowStockItems.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Sản phẩm sắp hết hàng</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Tên sản phẩm</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Số lượng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.lowStockItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{item.productName}</td>
                                                    <td className="px-6 py-4 text-sm text-red-600 font-medium">{item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "Purchase":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                                <p className="text-2xl font-bold text-blue-600">{data.totalOrders || 0}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Đã hoàn thành</p>
                                <p className="text-2xl font-bold text-green-600">{data.completedOrders || 0}</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Đang xử lý</p>
                                <p className="text-2xl font-bold text-yellow-600">{data.pendingOrders || 0}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Tổng giá trị</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {data.totalAmount?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case "Sales":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                                <p className="text-2xl font-bold text-blue-600">{data.totalOrders || 0}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Đã giao hàng</p>
                                <p className="text-2xl font-bold text-green-600">{data.deliveredOrders || 0}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Doanh thu</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {data.totalRevenue?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Giá trị TB</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {data.averageOrderValue?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case "Financial":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Tổng doanh thu</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {data.totalRevenue?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Tổng chi phí</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {data.totalExpenses?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Lợi nhuận</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {data.netProfit?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-gray-500 mb-4">Không tìm thấy báo cáo</p>
                <button
                    onClick={() => navigate("/reports")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
                                {getStatusBadge(report.status)}
                            </div>
                            {report.description && (
                                <p className="text-sm text-gray-600">{report.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/reports")}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b">
                        <div>
                            <p className="text-sm text-gray-600">Loại báo cáo</p>
                            <p className="text-base font-medium text-gray-900">{getTypeLabel(report.type)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Người tạo</p>
                            <p className="text-base font-medium text-gray-900">{report.generatedByUsername || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ngày tạo</p>
                            <p className="text-base font-medium text-gray-900">
                                {new Date(report.generatedAt).toLocaleString('vi-VN')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Trạng thái</p>
                            <p className="text-base font-medium text-gray-900">{getStatusBadge(report.status)}</p>
                        </div>
                    </div>

                    {/* Report Data */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dữ liệu báo cáo</h2>
                        {renderReportData()}
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa báo cáo "{report.name}"? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
