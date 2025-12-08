import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportService } from "../../../api/reportService";
import { toast } from "react-toastify";

export default function GenerateReport() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState("Inventory");
    
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        warehouseId: "",
        vendorId: "",
        customerId: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            toast.error("Vui lòng nhập tên báo cáo");
            return;
        }

        try {
            setLoading(true);
            
            const requestData = {
                name: formData.name,
                type: reportType,
                description: formData.description,
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
                warehouseId: formData.warehouseId ? parseInt(formData.warehouseId) : null,
                vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
                customerId: formData.customerId ? parseInt(formData.customerId) : null
            };

            let response;
            switch (reportType) {
                case "Inventory":
                    response = await reportService.generateInventoryReport(requestData);
                    break;
                case "Purchase":
                    response = await reportService.generatePurchaseReport(requestData);
                    break;
                case "Sales":
                    response = await reportService.generateSalesReport(requestData);
                    break;
                case "Financial":
                    response = await reportService.generateFinancialReport(requestData);
                    break;
                default:
                    throw new Error("Invalid report type");
            }

            toast.success("Tạo báo cáo thành công!");
            navigate(`/reports/${response.reportId}`);
        } catch (err) {
            console.error("Error generating report:", err);
            toast.error("Không thể tạo báo cáo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tạo báo cáo mới</h1>
                            <p className="text-sm text-gray-600 mt-1">Chọn loại báo cáo và điền thông tin</p>
                        </div>
                        <button
                            onClick={() => navigate("/reports")}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loại báo cáo <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {["Inventory", "Purchase", "Sales", "Doanh thu"].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setReportType(type)}
                                        className={`p-4 border-2 rounded-lg text-center transition ${
                                            reportType === type
                                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <div className="font-medium">
                                            {type === "Inventory" && "Tồn kho"}
                                            {type === "Purchase" && "Mua hàng"}
                                            {type === "Sales" && "Bán hàng"}
                                            {type === "Financial" && "Doanh thu"}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên báo cáo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="VD: Báo cáo tồn kho tháng 12"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Mô tả chi tiết về báo cáo..."
                            />
                        </div>

                        {/* Date Range */}
                        {(reportType === "Purchase" || reportType === "Sales" || reportType === "Financial") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Từ ngày
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Đến ngày
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Additional Filters */}
                        <div className="border-t pt-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Bộ lọc bổ sung (tùy chọn)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {reportType === "Inventory" && (
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">ID Kho</label>
                                        <input
                                            type="number"
                                            name="warehouseId"
                                            value={formData.warehouseId}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="ID kho"
                                        />
                                    </div>
                                )}
                                {reportType === "Purchase" && (
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">ID Nhà cung cấp</label>
                                        <input
                                            type="number"
                                            name="vendorId"
                                            value={formData.vendorId}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="ID nhà cung cấp"
                                        />
                                    </div>
                                )}
                                {reportType === "Sales" && (
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">ID Khách hàng</label>
                                        <input
                                            type="number"
                                            name="customerId"
                                            value={formData.customerId}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="ID khách hàng"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => navigate("/reports")}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                )}
                                {loading ? "Đang tạo..." : "Tạo báo cáo"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
