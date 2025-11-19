import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { warehouseService } from "../../../api/warehouseService.js";
import dayjs from "dayjs";
import {Card, Spin, Alert, Descriptions, Tag, Table} from "antd";

export default function WarehouseDetail() {
    const { id } = useParams();
    const [warehouse, setWarehouse] = useState(null);
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stockLoading, setStockLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWarehouse = async () => {
            try {
                const data = await warehouseService.getWarehouseById(id);
                setWarehouse(data);
            } catch (err) {
                console.error("Lỗi khi tải chi tiết kho:", err);
                setError("Không thể tải dữ liệu kho.");
            } finally {
                setLoading(false);
            }
        };
        fetchWarehouse();
    }, [id]);

    useEffect(() => {
        const fetchStock = async () => {
            if (!id) return;
            try {
                setStockLoading(true);
                const data = await warehouseService.getWarehouseStock(id);
                setStock(data || []);
            } catch (err) {
                console.error("Lỗi khi tải danh sách stock:", err);
                setStock([]);
            } finally {
                setStockLoading(false);
            }
        };
        fetchStock();
    }, [id]);

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
                                    {warehouse.status}
                                </Tag>
                            </h2>
                            <Link
                                to="/warehouse"
                                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
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
                                {warehouse.status}
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

                {/* Danh sách sản phẩm trong kho */}
                <Card
                    title={
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Danh sách sản phẩm trong kho
                            </h3>
                            <span className="text-sm text-gray-500">
                                Tổng: {stock.length} sản phẩm
                            </span>
                        </div>
                    }
                    bordered={false}
                    className="shadow-none mt-6"
                >
                    {stockLoading ? (
                        <div className="text-center py-8">
                            <Spin size="large" tip="Đang tải danh sách sản phẩm..." />
                        </div>
                    ) : stock.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Kho này chưa có sản phẩm nào</p>
                        </div>
                    ) : (
                        <Table
                            dataSource={stock}
                            rowKey={(record) => `${record.warehouseId}-${record.productId}`}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total) => `Tổng ${total} sản phẩm`,
                            }}
                            columns={[
                                {
                                    title: "Mã sản phẩm (SKU)",
                                    dataIndex: "productSku",
                                    key: "productSku",
                                    render: (text) => (
                                        <span className="font-mono text-sm">{text || "—"}</span>
                                    ),
                                },
                                {
                                    title: "Tên sản phẩm",
                                    dataIndex: "productName",
                                    key: "productName",
                                    render: (text) => <span className="font-medium">{text || "—"}</span>,
                                },
                                {
                                    title: "Số lượng",
                                    dataIndex: "quantity",
                                    key: "quantity",
                                    align: "right",
                                    render: (quantity) => {
                                        const qty = Number(quantity || 0);
                                        return (
                                            <span
                                                className={`font-semibold ${
                                                    qty > 50
                                                        ? "text-green-600"
                                                        : qty > 0
                                                        ? "text-amber-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {qty.toLocaleString("vi-VN")}
                                            </span>
                                        );
                                    },
                                    sorter: (a, b) => Number(a.quantity || 0) - Number(b.quantity || 0),
                                },
                            ]}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
}