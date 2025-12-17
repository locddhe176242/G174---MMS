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
  const [actionLoading, setActionLoading] = useState(false);
  const [summary, setSummary] = useState({
    grossSubtotal: 0,
    lineDiscountTotal: 0,
    headerDiscountPercent: 0,
    headerDiscountAmount: 0,
    taxTotal: 0,
    total: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const response = await salesQuotationService.getQuotationById(id);
        setData(response);

        // Tổng tiền lấy theo đúng số backend đã tính (đảm bảo thống nhất với list & Sales Order)
        const grossSubtotal = response.items?.reduce((sum, item) => {
          const qty = Number(item.quantity || 0);
          const price = Number(item.unitPrice || 0);
          return sum + qty * price;
        }, 0) || 0;

        const lineDiscountTotal =
          response.items?.reduce(
            (sum, item) => sum + Number(item.discountAmount || 0),
            0
          ) || 0;

        setSummary({
          grossSubtotal,
          lineDiscountTotal,
          headerDiscountPercent: Number(response.headerDiscountPercent || 0),
          headerDiscountAmount: Number(response.headerDiscountAmount || 0),
          taxTotal: Number(response.taxAmount || 0),
          total: Number(response.totalAmount || 0),
        });
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

  const getDiscountPercent = (item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.unitPrice || 0);
    const base = qty * price;
    const discount = Number(item.discountAmount || 0);
    if (base <= 0 || discount <= 0) return "0%";
    const percent = (discount / base) * 100;
    const formatted = percent % 1 === 0 ? percent.toString() : percent.toFixed(2);
    return `${formatted}%`;
  };

    const handleSendToCustomer = async () => {
      try {
        setActionLoading(true);
        await salesQuotationService.changeStatus(id, "Active");
        toast.success("Đã gửi báo giá cho khách hàng");
        // Reload
        const response = await salesQuotationService.getQuotationById(id);
        setData(response);
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Không thể gửi báo giá");
      } finally {
        setActionLoading(false);
      }
    };

    const handleCloneToDraft = async () => {
      if (!window.confirm("Tạo bản nháp mới từ báo giá này? Bản gốc giữ nguyên.")) {
        return;
      }
      try {
        setActionLoading(true);
        const cloned = await salesQuotationService.cloneQuotation(id);
        const newId = cloned?.quotationId ?? cloned?.id;
        toast.success("Đã tạo bản nháp mới từ báo giá");
        if (newId) {
          navigate(`/sales/quotations/${newId}/edit`);
        } else {
          navigate("/sales/quotations");
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Không thể nhân bản báo giá");
      } finally {
        setActionLoading(false);
      }
    };

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
            {data.status === "Draft" && (
              <button
                onClick={handleSendToCustomer}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading ? "Đang gửi..." : "Gửi cho khách"}
              </button>
            )}
            {data.status === "Active" && (
              <button
                onClick={handleCloneToDraft}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Đang xử lý..." : "Tạo bản nháp mới"}
              </button>
            )}
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
                  {formatCurrency(summary.grossSubtotal)}
                </span>
              </li>
              <li>
                <span className="text-gray-500">Chiết khấu dòng:</span>{" "}
                {formatCurrency(summary.lineDiscountTotal)}
              </li>
              <li>
                <span className="text-gray-500">Chiết khấu chung:</span>{" "}
                <span className="font-semibold">
                  {`${Number(summary.headerDiscountPercent || 0)}%`} (
                  {formatCurrency(summary.headerDiscountAmount)})
                </span>
              </li>
              <li>
                <span className="text-gray-500">Thuế:</span>{" "}
                {formatCurrency(summary.taxTotal)}
              </li>
              <li className="text-lg font-bold text-gray-900">
                Tổng cộng: {formatCurrency(summary.total)}
              </li>
            </ul>
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
                    {getDiscountPercent(item)}
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
