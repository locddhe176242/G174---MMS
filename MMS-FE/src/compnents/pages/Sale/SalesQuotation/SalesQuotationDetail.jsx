import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { salesQuotationService } from "../../../../api/salesQuotationService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

const STATUS_LABELS = {
  Draft: "Nháp",
  Active: "Đang mở",
  Cancelled: "Đã hủy",
  Expired: "Hết hạn",
};

export default function SalesQuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await salesQuotationService.getQuotationById(id);
        setData(response);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải báo giá");
        navigate("/sales/quotations");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

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
            Đơn báo giá bán hàng: {data.quotationNo}
            </h1>
            <p className="text-gray-500">
              Khách hàng: {data.customerName || data.customerCode || "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/sales/quotations/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={() => navigate("/sales/quotations")}
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
                <span className="font-semibold">
                  {STATUS_LABELS[data.status] || data.status}
                </span>
              </li>
              <li>
                <span className="text-gray-500">Ngày báo giá:</span>{" "}
                {formatDate(data.quotationDate)}
              </li>
              <li>
                <span className="text-gray-500">Hạn báo giá:</span>{" "}
                {formatDate(data.validUntil)}
              </li>
              <li>
                <span className="text-gray-500">Điều khoản thanh toán:</span>{" "}
                {data.paymentTerms || "—"}
              </li>
              <li>
                <span className="text-gray-500">Điều khoản giao hàng:</span>{" "}
                {data.deliveryTerms || "—"}
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
                <span className="font-semibold">
                  {formatCurrency(data.subtotal)}
                </span>
              </li>
              <li>
                <span className="text-gray-500">Chiết khấu:</span>{" "}
                {formatCurrency(data.headerDiscount)}
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

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
            Theo dõi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <div className="text-gray-500 uppercase text-xs tracking-wide">
                Người tạo
              </div>
              <div className="font-semibold text-gray-900">
                {data.createdByDisplay || data.createdBy || "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDateTime(data.createdAt)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-sm text-gray-700">
            <div>
              <div className="text-gray-500 uppercase text-xs tracking-wide">
                Người cập nhật
              </div>
              <div className="font-semibold text-gray-900">
                {data.updatedByDisplay || data.updatedBy || "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDateTime(data.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách sản phẩm
            </h3>
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
                    Đơn vị
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
                  <tr key={item.sqiId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-semibold">{item.productName || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {item.productCode || item.productSku || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.uom || "—"}</td>
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
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
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
