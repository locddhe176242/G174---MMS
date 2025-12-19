import React, { useState, useEffect } from "react";
import { reportService } from "../../../api/reportService";
import { toast } from "react-toastify";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getProducts } from '../../../api/productService';
import * as ExcelJS from 'exceljs';

export default function ReportList() {
    const [loading, setLoading] = useState(false);
    const [inventoryData, setInventoryData] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventoryFilters, setInventoryFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
        productId: null
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const generateInventoryReport = async () => {
        try {
            setLoading(true);
            const requestData = {
                startDate: inventoryFilters.startDate.toISOString().split('T')[0],
                endDate: inventoryFilters.endDate.toISOString().split('T')[0],
                productId: inventoryFilters.productId
            };

            const response = await reportService.generateInventoryReport(requestData);
            // Ensure inventoryData is always an array
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
            
            setInventoryData(data);
            
            if (data.length === 0) {
                toast.warning('Không có dữ liệu trong khoảng thời gian này');
            } else {
                toast.success(`Tạo báo cáo thành công! (${data.length} sản phẩm)`);
            }
        } catch (error) {
            console.error('Error generating inventory report:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo báo cáo');
            setInventoryData([]);
        } finally {
            setLoading(false);
        }
    };

    const exportInventoryToExcel = async () => {
        if (inventoryData.length === 0) {
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
        inventoryData.forEach((item, index) => {
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
        link.download = `BaoCaoTonKho_${inventoryFilters.startDate.toISOString().split('T')[0]}_${inventoryFilters.endDate.toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Xuất Excel thành công!');
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num || 0);
    };

    const calculateTotals = () => {
        if (!inventoryData || inventoryData.length === 0) return {
            totalOpening: 0, totalInbound: 0, totalOutbound: 0, totalClosing: 0
        };

        return inventoryData.reduce((acc, item) => ({
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
                            <h1 className="text-2xl font-bold text-gray-900">Báo cáo tồn kho</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                {/* Inventory Report Section */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Tạo báo cáo tồn kho</h2>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                                <DatePicker
                                    selected={inventoryFilters.startDate}
                                    onChange={(date) => setInventoryFilters({ ...inventoryFilters, startDate: date })}
                                    dateFormat="dd/MM/yyyy"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                                <DatePicker
                                    selected={inventoryFilters.endDate}
                                    onChange={(date) => setInventoryFilters({ ...inventoryFilters, endDate: date })}
                                    dateFormat="dd/MM/yyyy"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sản phẩm (Tùy chọn)</label>
                                <select
                                    value={inventoryFilters.productId || ''}
                                    onChange={(e) => setInventoryFilters({ ...inventoryFilters, productId: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả sản phẩm</option>
                                    {products.map(product => (
                                        <option key={product.productId || product.product_id} value={product.productId || product.product_id}>
                                            {product.productName || product.product_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    onClick={generateInventoryReport}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Đang tạo...' : 'Tạo báo cáo'}
                                </button>
                                {inventoryData.length > 0 && (
                                    <button
                                        onClick={exportInventoryToExcel}
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
                    {inventoryData.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mặt hàng</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL đầu kỳ</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL nhập</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL xuất</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hàng tồn</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {inventoryData.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className="font-medium">{item.productName || item.product_name}</div>
                                                <div className="text-xs text-gray-500">{item.productCode || item.product_code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.unit || ''}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(item.openingQty || item.opening_qty)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">{formatNumber(item.inboundQty || item.inbound_qty)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">{formatNumber(item.outboundQty || item.outbound_qty)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">{formatNumber(item.closingQty || item.closing_qty)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td colSpan="3" className="px-6 py-4 text-sm text-gray-900">TỔNG CỘNG</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(totals.totalOpening)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">{formatNumber(totals.totalInbound)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">{formatNumber(totals.totalOutbound)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(totals.totalClosing)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Summary Info */}
                    {inventoryData.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t">
                            <div className="text-sm text-gray-600">
                                <p>Kỳ báo cáo: <span className="font-medium">{inventoryFilters.startDate.toLocaleDateString('vi-VN')}</span> - <span className="font-medium">{inventoryFilters.endDate.toLocaleDateString('vi-VN')}</span></p>
                                <p className="mt-1">Tổng số mặt hàng: <span className="font-medium">{inventoryData.length}</span></p>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && inventoryData.length === 0 && (
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
        </div>
    );
}
