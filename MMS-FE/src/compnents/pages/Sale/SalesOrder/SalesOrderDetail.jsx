import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { salesOrderService } from "../../../../api/salesOrderService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await salesOrderService.getOrderById(id);
      setData(response);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải Sales Order");
      navigate("/sales/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOrderStatus = async (newStatus) => {
    if (statusLoading) return;
    setStatusLoading(true);
    try {
      await salesOrderService.changeOrderStatus(id, newStatus);
      toast.success("Đã cập nhật trạng thái đơn");
      fetchOrder();
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật trạng thái đơn");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleApprovalStatus = async (newApprovalStatus) => {
    if (approvalLoading) return;
    if (data?.approvalStatus !== "Pending") {
      toast.info("Đơn hàng đã được xử lý phê duyệt");
      return;
    }
    setApprovalLoading(true);
    try {
      await salesOrderService.changeApprovalStatus(id, newApprovalStatus);
      toast.success("Đã cập nhật trạng thái phê duyệt");
      fetchOrder();
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật trạng thái phê duyệt");
    } finally {
      setApprovalLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Order: {data.soNo}
            </h1>
            <p className="text-gray-500">
              Khách hàng: {data.customerName || data.customerCode || "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/sales/orders/${id}/edit`)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={() => navigate("/sales/orders")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Thông tin chung
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <span className="text-gray-500">Trạng thái:</span>{" "}
                <span className="font-semibold">{data.status}</span>
              </li>
              <li>
                <span className="text-gray-500">Phê duyệt:</span>{" "}
                <span className="font-semibold">{data.approvalStatus}</span>
              </li>
              {data.approverName && (
                <li>
                  <span className="text-gray-500">Người duyệt:</span>{" "}
                  {data.approverName}
                </li>
              )}
              {data.approvedAt && (
                <li>
                  <span className="text-gray-500">Ngày duyệt:</span>{" "}
                  {new Date(data.approvedAt).toLocaleString("vi-VN")}
                </li>
              )}
              <li>
                <span className="text-gray-500">Ngày đơn:</span>{" "}
                {data.orderDate ? new Date(data.orderDate).toLocaleDateString("vi-VN") : "—"}
              </li>
              <li>
                <span className="text-gray-500">Điều khoản thanh toán:</span>{" "}
                {data.paymentTerms || "—"}
              </li>
              <li>
                <span className="text-gray-500">Địa chỉ giao hàng:</span>{" "}
                {data.shippingAddress || "—"}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Tổng quan tiền tệ
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <span className="text-gray-500">Tạm tính:</span>{" "}
                {formatCurrency(data.subtotal)}
              </li>
              <li>
                <span className="text-gray-500">Thuế:</span>{" "}
                {formatCurrency(data.taxAmount)}
              </li>
              <li className="text-lg font-bold text-gray-900">
                Tổng cộng: {formatCurrency(data.totalAmount)}
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Phê duyệt</h3>
              <span className="text-sm text-gray-500">{data.approvalStatus}</span>
            </div>
            {data.approvalStatus === "Pending" ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleApprovalStatus("Approved")}
                  disabled={approvalLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {approvalLoading ? "Đang xử lý..." : "Duyệt đơn"}
                </button>
                <button
                  onClick={() => handleApprovalStatus("Rejected")}
                  disabled={approvalLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {approvalLoading ? "Đang xử lý..." : "Từ chối"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Đơn hàng đã được {data.approvalStatus === "Approved" ? "duyệt" : "từ chối"}.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Trạng thái thực thi</h3>
              <span className="text-sm text-gray-500">{data.status}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleOrderStatus("Fulfilled")}
                disabled={statusLoading || data.status === "Fulfilled"}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {statusLoading && data.status !== "Fulfilled" ? "Đang xử lý..." : "Đánh dấu đã giao"}
              </button>
              <button
                onClick={() => handleOrderStatus("Cancelled")}
                disabled={statusLoading || data.status === "Cancelled"}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {statusLoading && data.status !== "Cancelled" ? "Đang xử lý..." : "Hủy đơn"}
              </button>
            </div>
          </div>
        </div>

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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chiết khấu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thuế (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items?.map((item, index) => (
                  <tr key={item.soiId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-semibold">{item.productName || "—"}</div>
                      <div className="text-xs text-gray-500">{item.productCode || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.warehouseName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {Number(item.quantity || 0).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(item.discountAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.taxRate ? `${item.taxRate}%` : "0%"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.lineTotal)}
                    </td>
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

