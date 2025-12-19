import React, { useState, useEffect } from "react";
import { reportService } from "../../../api/reportService";
import { toast } from "react-toastify";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as ExcelJS from 'exceljs';

export default function ReportList() {
    // State for tabs
    const [activeTab, setActiveTab] = useState('create'); // 'create' hoặc 'list'
    
    // State for saved reports
    const [savedReports, setSavedReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    
    // State for report type selection
    const [reportType, setReportType] = useState('inventory'); // 'inventory' hoặc 'sales'
    
    // Existing state
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]); // Đổi tên từ inventoryData để dùng chung
    const [reportFilters, setReportFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date()
    });

    useEffect(() => {
        fetchSavedReports(); // Lấy danh sách báo cáo đã lưu
    }, []);

    // Hàm lấy danh sách báo cáo đã lưu
    const fetchSavedReports = async () => {
        try {
            const response = await reportService.getAllReports();
            setSavedReports(response.content || []);
        } catch (error) {
            console.error('Error fetching saved reports:', error);
            toast.error('Không thể tải danh sách báo cáo');
        }
    };

    // Hàm xem chi tiết báo cáo
    const viewReportDetail = async (reportId) => {
        try {
            setLoading(true);
            const response = await reportService.getReportById(reportId);
            setSelectedReport(response);
            
            // Hiển thị data nếu có
            if (response.reportData && response.reportData.items) {
                setReportData(response.reportData.items);
                setActiveTab('create'); // Chuyển về tab tạo báo cáo để hiển thị data
            }
        } catch (error) {
            console.error('Error fetching report detail:', error);
            toast.error('Không thể tải chi tiết báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async () => {
        try {
            setLoading(true);
            const requestData = {
                startDate: reportFilters.startDate.toISOString().split('T')[0],
                endDate: reportFilters.endDate.toISOString().split('T')[0]
            };

            let response;
            if (reportType === 'inventory') {
                response = await reportService.generateInventoryReport(requestData);
            } else {
                response = await reportService.generateSalesReport(requestData);
            }

            // Ensure data is always an array
            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response && response.reportData && Array.isArray(response.reportData.items)) {
                data = response.reportData.items; // Backend returns reportData.items
            } else if (response && Array.isArray(response.items)) {
                data = response.items;
            } else if (response && Array.isArray(response.data)) {
                data = response.data;
            }
            
            setReportData(data);
            
            if (data.length === 0) {
                toast.warning('Không có dữ liệu trong khoảng thời gian này');
            } else {
                const reportTypeName = reportType === 'inventory' ? 'tồn kho' : 'doanh thu';
                const itemCount = reportType === 'inventory' ? 'sản phẩm' : 'đơn hàng';
                toast.success(`Tạo báo cáo ${reportTypeName} thành công! (${data.length} ${itemCount})`);
                // Cập nhật danh sách báo cáo sau khi tạo mới
                fetchSavedReports();
            }
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo báo cáo');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = async () => {
        if (reportData.length === 0) {
            toast.warning('Không có dữ liệu để xuất');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo cáo tồn kho');

        // Define columns
        worksheet.columns = [
            { header: 'STT', key: 'stt', width: 5 },
            { header: 'Mã sản phẩm', key: 'productCode', width: 15 },
            { header: 'Tên sản phẩm', key: 'productName', width: 30 },
            { header: 'Đơn vị', key: 'unit', width: 10 },
            { header: 'SL đầu kỳ', key: 'openingQty', width: 12 },
            { header: 'SL nhập', key: 'inboundQty', width: 12 },
            { header: 'SL xuất', key: 'outboundQty', width: 12 },
            { header: 'Hàng tồn', key: 'closingQty', width: 12 }
        ];

        // Add data rows
        reportData.forEach((item, index) => {
            worksheet.addRow({
                stt: index + 1,
                productCode: item.productCode || item.product_code || '',
                productName: item.productName || item.product_name || '',
                unit: item.unit || '',
                openingQty: item.openingQty || item.opening_qty || 0,
                inboundQty: item.inboundQty || item.inbound_qty || 0,
                outboundQty: item.outboundQty || item.outbound_qty || 0,
                closingQty: item.closingQty || item.closing_qty || 0
            });
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Generate file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BaoCao${reportType === 'inventory' ? 'TonKho' : 'DoanhThu'}_${reportFilters.startDate.toISOString().split('T')[0]}_${reportFilters.endDate.toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Xuất Excel thành công!');
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(num || 0));
    };

    const calculateTotals = () => {
        if (!reportData || reportData.length === 0) return {
            totalOpening: 0, totalInbound: 0, totalOutbound: 0, totalClosing: 0
        };

        return reportData.reduce((acc, item) => ({
            totalOpening: acc.totalOpening + (item.openingQty || item.opening_qty || 0),
            totalInbound: acc.totalInbound + (item.inboundQty || item.inbound_qty || 0),
            totalOutbound: acc.totalOutbound + (item.outboundQty || item.outbound_qty || 0),
            totalClosing: acc.totalClosing + (item.closingQty || item.closing_qty || 0)
        }), { totalOpening: 0, totalInbound: 0, totalOutbound: 0, totalClosing: 0 });
    };

    const totals = calculateTotals();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
                            <p className="text-sm text-gray-600 mt-1">Quản lý và tạo các loại báo cáo hệ thống</p>
                        </div>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="mt-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'create'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Tạo báo cáo mới
                            </button>
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'list'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Danh sách báo cáo đã tạo ({savedReports.length})
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {activeTab === 'create' ? (
                <div className="container mx-auto px-4 py-6">
                {/* Report Section */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Tạo báo cáo</h2>
                    </div>

                    {/* Report Type Selection */}
                    <div className="px-6 py-4 border-b">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Chọn loại báo cáo</label>
                        <div className="flex gap-6">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="reportType"
                                    value="inventory"
                                    checked={reportType === 'inventory'}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="mr-2 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Báo cáo tồn kho</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="reportType"
                                    value="sales"
                                    checked={reportType === 'sales'}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="mr-2 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Báo cáo doanh thu</span>
                            </label>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                                <DatePicker
                                    selected={reportFilters.startDate}
                                    onChange={(date) => setReportFilters({ ...reportFilters, startDate: date })}
                                    dateFormat="dd/MM/yyyy"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                                <DatePicker
                                    selected={reportFilters.endDate}
                                    onChange={(date) => setReportFilters({ ...reportFilters, endDate: date })}
                                    dateFormat="dd/MM/yyyy"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>



                            <div className="flex items-end gap-2">
                                <button
                                    onClick={generateReport}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Đang tạo...' : `Tạo báo cáo ${reportType === 'inventory' ? 'tồn kho' : 'doanh thu'}`}
                                </button>
                                {reportData.length > 0 && (
                                    <button
                                        onClick={exportToExcel}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                        title="Xuất Excel"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Report Table */}
                    {reportData.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                                        {reportType === 'inventory' ? (
                                            <>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mặt hàng</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL đầu kỳ</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL nhập</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL xuất</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hàng tồn</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                            {reportType === 'inventory' ? (
                                                <>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <div className="font-medium">{item.productName || item.product_name}</div>
                                                        <div className="text-xs text-gray-500">{item.productCode || item.product_code}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.unit || ''}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(item.openingQty || item.opening_qty)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">{formatNumber(item.inboundQty || item.inbound_qty)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">{formatNumber(item.outboundQty || item.outbound_qty)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">{formatNumber(item.closingQty || item.closing_qty)}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <div className="font-medium">{item.orderCode || item.order_code || `SO${String(index + 1).padStart(3, '0')}`}</div>
                                                        <div className="text-xs text-gray-500">{new Date(item.orderDate || Date.now()).toLocaleDateString('vi-VN')}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{item.customerName || item.customer_name || 'Khách hàng'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(item.quantity || 1)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(item.unitPrice || item.unit_price || 0)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-semibold">{formatNumber(item.totalAmount || item.total_amount || 0)}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {reportType === 'inventory' && (
                                        <tr className="bg-gray-100 font-bold">
                                            <td colSpan="3" className="px-6 py-4 text-sm text-gray-900">TỔNG CỘNG</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(totals.totalOpening)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">{formatNumber(totals.totalInbound)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">{formatNumber(totals.totalOutbound)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(totals.totalClosing)}</td>
                                        </tr>
                                    )}
                                    {reportType === 'sales' && (
                                        <tr className="bg-gray-100 font-bold">
                                            <td colSpan="4" className="px-6 py-4 text-sm text-gray-900">TỔNG CỘNG</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-bold">
                                                {formatNumber(reportData.reduce((sum, item) => sum + (item.totalAmount || item.total_amount || 0), 0))}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Summary Info */}
                    {reportData.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t">
                            <div className="text-sm text-gray-600">
                                <p>Kỳ báo cáo: <span className="font-medium">{reportFilters.startDate.toLocaleDateString('vi-VN')}</span> - <span className="font-medium">{reportFilters.endDate.toLocaleDateString('vi-VN')}</span></p>
                                <p className="mt-1">
                                    {reportType === 'inventory' ? (
                                        <>Tổng số sản phẩm: <span className="font-medium">{reportData.length}</span></>
                                    ) : (
                                        <>Tổng số đơn hàng: <span className="font-medium">{reportData.length}</span></>
                                    )}
                                </p>
                                {reportType === 'sales' && (
                                    <p className="mt-1">
                                        Tổng doanh thu: <span className="font-medium text-green-600">
                                            {formatNumber(reportData.reduce((sum, item) => sum + (item.totalAmount || item.total_amount || 0), 0))} VNĐ
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && reportData.length === 0 && (
                        <div className="px-6 py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có dữ liệu</h3>
                            <p className="mt-1 text-sm text-gray-500">Chọn khoảng thời gian và nhấn "Tạo báo cáo" để xem dữ liệu</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            // Tab "Danh sách báo cáo đã tạo"
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Danh sách báo cáo đã tạo</h2>
                    </div>

                    {savedReports.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có báo cáo nào</h3>
                            <p className="mt-1 text-sm text-gray-500">Tạo báo cáo đầu tiên trong tab "Tạo báo cáo mới"</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên báo cáo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại báo cáo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian tạo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tạo bởi</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {savedReports.map((report) => (
                                        <tr key={report.reportId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{report.name}</div>
                                                {report.description && (
                                                    <div className="text-sm text-gray-500">{report.description}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {report.type === 'Inventory' ? 'Tồn kho' : 
                                                     report.type === 'Purchase' ? 'Mua hàng' :
                                                     report.type === 'Sales' ? 'Bán hàng' : 
                                                     report.type === 'Financial' ? 'Tài chính' : report.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    report.status === 'Completed' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : report.status === 'Processing'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {report.status === 'Completed' ? 'Hoàn thành' :
                                                     report.status === 'Processing' ? 'Đang xử lý' : 
                                                     report.status === 'Failed' ? 'Lỗi' : report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(report.generatedAt).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {report.generatedBy}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => viewReportDetail(report.reportId)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )}
        </div>
    );
}
