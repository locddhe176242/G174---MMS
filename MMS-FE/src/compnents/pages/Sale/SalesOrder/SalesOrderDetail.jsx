import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { salesOrderService } from "../../../../api/salesOrderService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

const formatPercent = (num) => {
  if (num === null || num === undefined) return "0%";
  const n = Number(num);
  if (Number.isNaN(n)) return "0%";
  return `${n % 1 === 0 ? n.toString() : n.toFixed(2)}%`;
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Approved: "Đã gửi khách",
    Fulfilled: "Đã hoàn thành",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleSendToCustomer = async () => {
    try {
      setActionLoading(true);
      await salesOrderService.sendToCustomer(id);
      toast.success("Đã gửi đơn hàng cho khách");
      await fetchOrder();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể gửi đơn hàng cho khách");
    } finally {
      setActionLoading(false);
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
        <div className="px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Đơn bán hàng: {data.orderNo || data.soNo || "—"}
            </h1>
            <p className="text-gray-500">Khách hàng: {data.customerName || data.customerCode || "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            {data.approvalStatus === "Draft" && (
              <button
                onClick={handleSendToCustomer}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading ? "Đang gửi..." : "Gửi cho khách"}
              </button>
            )}
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
                <span className="font-semibold">{getStatusLabel(data.status)}</span>
              </li>
              {data.approvalStatus === "Approved" && (
                <>
                  {data.approverName && (
                    <li>
                      <span className="text-gray-500">Người duyệt:</span>{" "}
                      {data.approverName}
                    </li>
                  )}
                  {data.approvedAt && (
                    <li>
                      <span className="text-gray-500">Ngày duyệt:</span>{" "}
                      {formatDateTime(data.approvedAt)}
                    </li>
                  )}
                </>
              )}
              <li>
                <span className="text-gray-500">Ngày đơn:</span>{" "}
                {formatDate(data.orderDate)}
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
              Tổng quan tiền hàng
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <span className="text-gray-500">Tạm tính:</span>{" "}
                {formatCurrency(data.subtotal)}
              </li>
              <li>
                <span className="text-gray-500">Chiết khấu chung:</span>{" "}
                <span className="font-semibold">
                  {formatPercent(data.headerDiscountPercent)} ({formatCurrency(data.headerDiscountAmount)})
                </span>
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
                      {Number(item.quantity || 0).toLocaleString("vi-VN")} {item.uom || ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatPercent(
                        Number(item.discountAmount || 0) > 0 &&
                          Number(item.quantity || 0) * Number(item.unitPrice || 0) > 0
                          ? (Number(item.discountAmount) /
                              (Number(item.quantity || 0) * Number(item.unitPrice || 0))) *
                            100
                          : 0
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatPercent(item.taxRate)}
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