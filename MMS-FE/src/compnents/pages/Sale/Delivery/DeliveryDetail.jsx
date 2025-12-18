import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { deliveryService } from "../../../../api/deliveryService";

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Picked: "Đang chuẩn bị hàng",
    Shipped: "Đã xuất kho",
    Delivered: "Đã giao hàng",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700";
    case "Picked":
      return "bg-yellow-100 text-yellow-700";
    case "Shipped":
      return "bg-blue-100 text-blue-700";
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getNextStatus = (currentStatus) => {
  switch (currentStatus) {
    case "Draft":
      return "Picked";
    case "Picked":
      return "Shipped";
    case "Shipped":
      return "Delivered";
    default:
      return null;
  }
};

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchDelivery = async () => {
    setLoading(true);
    try {
      const response = await deliveryService.getDeliveryById(id);
      setData(response);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải phiếu giao hàng");
      navigate("/sales/deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (statusLoading) return;
    if (!window.confirm(`Xác nhận chuyển trạng thái sang "${newStatus}"?`)) return;
    
    setStatusLoading(true);
    try {
      await deliveryService.changeStatus(id, newStatus);
      toast.success("Đã cập nhật trạng thái");
      fetchDelivery();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể cập nhật trạng thái");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const nextStatus = getNextStatus(data.status);
  const canChangeStatus = data.status !== "Delivered" && data.status !== "Cancelled";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Phiếu Giao Hàng: {data.deliveryNo}
            </h1>
            <p className="text-gray-500">
              Đơn bán hàng: {data.salesOrderNo || "—"} | Khách hàng: {data.customerName || "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canChangeStatus && (
              <button
                onClick={() => navigate(`/sales/deliveries/${id}/edit`)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={() => navigate("/sales/deliveries")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Thông tin chung
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <span className="text-gray-500">Trạng thái:</span>{" "}
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(data.status)}`}>
                  {getStatusLabel(data.status)}
                </span>
              </li>
              <li>
                <span className="text-gray-500">Đơn bán hàng:</span>{" "}
                <button
                  onClick={() => navigate(`/sales/orders/${data.salesOrderId}`)}
                  className="text-blue-600 hover:underline"
                >
                  {data.salesOrderNo || "—"}
                </button>
              </li>
              <li>
                <span className="text-gray-500">Khách hàng:</span> {data.customerName || "—"}
              </li>
              <li>
                <span className="text-gray-500">Kho:</span> {data.warehouseName || "—"}
              </li>
              <li>
                <span className="text-gray-500">Ngày giao dự kiến:</span>{" "}
                {data.plannedDate ? new Date(data.plannedDate).toLocaleDateString("vi-VN") : "—"}
              </li>
              <li>
                <span className="text-gray-500">Ngày giao thực tế:</span>{" "}
                {data.actualDate ? new Date(data.actualDate).toLocaleDateString("vi-VN") : "—"}
              </li>
              <li>
                <span className="text-gray-500">Địa chỉ giao hàng:</span>{" "}
                {data.shippingAddress || "—"}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Thông tin vận chuyển
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <span className="text-gray-500">Đơn vị vận chuyển:</span>{" "}
                {data.carrierName || "—"}
              </li>
              <li>
                <span className="text-gray-500">Người giao hàng:</span> {data.driverName || "—"}
              </li>
              <li>
                <span className="text-gray-500">Số điện thoại:</span> {data.driverPhone || "—"}
              </li>
              <li>
                <span className="text-gray-500">Mã vận đơn:</span>{" "}
                <span className="font-mono">{data.trackingCode || "—"}</span>
              </li>
              <li>
                <span className="text-gray-500">Người tạo:</span> {data.createdBy || "—"}
              </li>
              <li>
                <span className="text-gray-500">Ngày tạo:</span>{" "}
                {data.createdAt ? new Date(data.createdAt).toLocaleString("vi-VN") : "—"}
              </li>
            </ul>
          </div>
        </div>

        {canChangeStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thay đổi trạng thái</h3>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(data.status)}`}>
                {getStatusLabel(data.status)}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {nextStatus && (
                <button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {statusLoading ? "Đang xử lý..." : `Chuyển sang ${getStatusLabel(nextStatus)}`}
                </button>
              )}
              {data.status !== "Cancelled" && (
                <button
                  onClick={() => handleStatusChange("Cancelled")}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {statusLoading ? "Đang xử lý..." : "Hủy phiếu giao hàng"}
                </button>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {data.status === "Shipped" && (
                <p className="text-yellow-600 mt-1">
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kho
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Số lượng đặt
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Số lượng dự kiến
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Số lượng đã giao
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Đơn vị
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items?.map((item, index) => (
                  <tr key={item.deliveryItemId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-semibold">{item.productName || "—"}</div>
                      <div className="text-xs text-gray-500">{item.productSku || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.warehouseName || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {Number(item.orderedQty || 0).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {Number(item.plannedQty || 0).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {Number(item.deliveredQty || 0).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.uom || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.notes && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ghi chú</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}