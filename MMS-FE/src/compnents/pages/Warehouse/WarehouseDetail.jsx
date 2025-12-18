import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { warehouseService } from "../../../api/warehouseService.js";
import { warehouseStockService } from "../../../api/warehouseStockService.js";
import dayjs from "dayjs";
import {Card, Spin, Alert, Descriptions, Tag, Table} from "antd";

export default function WarehouseDetail() {
    const { id } = useParams();
    const [warehouse, setWarehouse] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWarehouse = async () => {
            try {
                const data = await warehouseService.getWarehouseById(id);
                setWarehouse(data);
                // Fetch products in warehouse
                await fetchWarehouseProducts();
            } catch (err) {
                console.error("Lỗi khi tải chi tiết kho:", err);
                setError("Không thể tải dữ liệu kho.");
            } finally {
                setLoading(false);
            }
        };
        fetchWarehouse();
    }, [id]);

    const fetchWarehouseProducts = async () => {
        try {
            setLoadingProducts(true);
            const stockData = await warehouseStockService.getStockByWarehouse(id);
            setProducts(stockData || []);
        } catch (err) {
            console.error("Lỗi khi tải danh sách sản phẩm:", err);
        } finally {
            setLoadingProducts(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
    };

    if (loading)
        return (
            <div className="text-center p-5">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );

    if (error)
        return (
            <div className="p-3">
                <Alert message={error} type="error" showIcon />
                <div className="mt-4">
                    <Link
                        to="/warehouse"
                        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        ← Quay lại danh sách
                    </Link>
                </div>
            </div>
        );

    if (!warehouse)
        return (
            <div className="p-3">
                <Alert message="Không tìm thấy thông tin kho." type="warning" showIcon />
                <div className="mt-4">
                    <Link
                        to="/warehouse"
                        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        ← Quay lại danh sách
                    </Link>
                </div>
            </div>
        );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <Card
                    title={
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Chi tiết kho: <strong>{warehouse.code}</strong>{" "}
                                <Tag color={warehouse.status === "Active" ? "green" : "red"}>
                                    {warehouse.status === "Active" ? "Hoạt động" : "Không hoạt động"}
                                </Tag>
                            </h2>
                            <Link
                                to="/warehouse"
                                className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                ← Quay lại danh sách
                            </Link>
                        </div>
                    }
                    bordered={false}
                    className="shadow-none"
                >
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Mã kho">{warehouse.code}</Descriptions.Item>
                        <Descriptions.Item label="Tên kho">{warehouse.name}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{warehouse.location || "—"}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                    warehouse.status === "Active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                            >
                                {warehouse.status === "Active" ? "Hoạt động" : "Không hoạt động"}
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {warehouse.createdAt ? formatDate(warehouse.createdAt) : "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người tạo">
                            {warehouse.createdBy?.email || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {warehouse.updatedAt ? formatDate(warehouse.updatedAt) : "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người cập nhật">
                            {warehouse.updatedBy?.email || "—"}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* Tổng số sản phẩm */}
                <Card 
                    title={
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">Sản phẩm trong kho</span>
                            <Tag color="blue" className="text-base px-3 py-1">
                                Tổng: {products.length} sản phẩm
                            </Tag>
                        </div>
                    }
                    className="mt-6"
                    bordered={false}
                >
                    {loadingProducts ? (
                        <div className="text-center py-8">
                            <Spin tip="Đang tải danh sách sản phẩm..." />
                        </div>
                    ) : products.length === 0 ? (
                        <Alert message="Chưa có sản phẩm nào trong kho này" type="info" showIcon />
                    ) : (
                        <Table
                            dataSource={products}
                            rowKey={(record) => `${record.warehouseId}-${record.productId}`}
                            pagination={{ 
                                pageSize: 10,
                                showTotal: (total) => `Tổng ${total} sản phẩm`,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100']
                            }}
                            columns={[
                                {
                                    title: 'Mã sản phẩm',
                                    dataIndex: 'productSku',
                                    key: 'sku',
                                    width: 150,
                                    render: (text) => <span className="font-mono font-semibold">{text || '—'}</span>
                                },
                                {
                                    title: 'Tên sản phẩm',
                                    dataIndex: 'productName',
                                    key: 'name',
                                    width: 300,
                                    render: (text) => <span className="font-medium">{text || '—'}</span>
                                },
                                {
                                    title: 'Danh mục',
                                    dataIndex: 'productCategoryName',
                                    key: 'category',
                                    width: 150,
                                    render: (text) => (
                                        <Tag color="purple">{text || 'Chưa phân loại'}</Tag>
                                    )
                                },
                                {
                                    title: 'Số lượng',
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    width: 120,
                                    align: 'right',
                                    render: (quantity) => (
                                        <span className={`font-bold ${
                                            quantity > 100 ? 'text-green-600' : 
                                            quantity > 50 ? 'text-orange-600' : 
                                            'text-red-600'
                                        }`}>
                                            {parseFloat(quantity).toLocaleString('vi-VN')}
                                        </span>
                                    )
                                },
                                {
                                    title: 'Đơn vị',
                                    dataIndex: 'productUom',
                                    key: 'uom',
                                    width: 100,
                                    render: (text) => text || '—'
                                },
                                {
                                    title: 'Giá bán',
                                    dataIndex: 'productSellingPrice',
                                    key: 'sellingPrice',
                                    width: 150,
                                    align: 'right',
                                    render: (price) => price 
                                        ? `${parseFloat(price).toLocaleString('vi-VN')} đ`
                                        : '—'
                                },
                                {
                                    title: 'Trạng thái',
                                    key: 'status',
                                    width: 120,
                                    render: (_, record) => {
                                        const quantity = parseFloat(record.quantity || 0);
                                        if (quantity > 0) {
                                            return <Tag color="green">Còn hàng</Tag>;
                                        } else {
                                            return <Tag color="red">Hết hàng</Tag>;
                                        }
                                    }
                                }
                            ]}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
}