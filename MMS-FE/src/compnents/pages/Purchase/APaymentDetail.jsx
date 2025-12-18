import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apInvoiceService } from "../../../api/apInvoiceService";
import { apPaymentService } from "../../../api/apPaymentService";

export default function APaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("vi-VN");
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Backend trả về invoice với payments, không có endpoint riêng cho payment
        const invoice = await apInvoiceService.getInvoiceById(id);
        
        if (mounted) {
          setData(invoice);
          setInvoice(invoice);
        }
      } catch (error) {
        console.error("Error loading AP Payment detail:", error);
        if (mounted) {
          setErr(error?.response?.data?.message || "Không thể tải thông tin thanh toán");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
          <div className="text-red-600 mb-4">Lỗi: {err}</div>
          <button
            onClick={() => navigate("/purchase/ap-payments")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Không có dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/purchase/ap-payments")}
                className="px-3 py-1.5 rounded border hover:bg-gray-50"
              >
                ← Quay lại
              </button>
              <h1 className="text-2xl font-semibold">
                Chi tiết thanh toán {data.paymentNo || data.payment_no || `#${id}`}
              </h1>
            </div>
            <button
              onClick={() => navigate(`/purchase/ap-invoices/${id}/payment`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Thêm thanh toán
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Thông tin hóa đơn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Số hóa đơn</div>
                  <div className="text-lg font-semibold">{data.invoiceNo}</div>
                </div>
                <div>
                  <div className="text-gray-500">Nhà cung cấp</div>
                  <div className="font-medium">{data.vendorName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày hóa đơn</div>
                  <div className="font-medium">{formatDate(data.invoiceDate)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày đến hạn</div>
                  <div className="font-medium">{formatDate(data.dueDate)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Tổng tiền</div>
                  <div className="text-xl font-semibold">{formatCurrency(data.totalAmount)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Còn lại</div>
                  <div className="text-xl font-semibold text-red-600">{formatCurrency(data.balanceAmount)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Trạng thái</div>
                  <div className="font-medium">{data.status}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày tạo</div>
                  <div className="font-medium">{formatDateTime(data.createdAt)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium">Ghi chú</div>
              <div className="p-6 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                {data.notes || "-"}
              </div>
            </div>

            {data.payments && data.payments.length > 0 && (
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b font-medium">Lịch sử thanh toán</div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày thanh toán</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương thức</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã tham chiếu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.payments.map((payment, idx) => (
                        <tr key={payment.apPaymentId || idx}>
                          <td className="px-6 py-4 text-sm">{formatDateTime(payment.paymentDate)}</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4 text-sm">{payment.method || "-"}</td>
                          <td className="px-6 py-4 text-sm">{payment.referenceNo || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium">Tóm tắt tài chính</div>
              <div className="p-6 text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính:</span>
                  <span className="font-medium">{formatCurrency(data?.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Thuế:</span>
                  <span className="font-medium">{formatCurrency(data?.taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-700 font-medium">Tổng cộng:</span>
                  <span className="font-semibold text-lg">{formatCurrency(data?.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span className="text-gray-500">Đã thanh toán:</span>
                  <span className="font-semibold">{formatCurrency((data?.totalAmount || 0) - (data?.balanceAmount || 0))}</span>
                </div>
                <div className="flex justify-between text-red-600 pt-2 border-t">
                  <span className="text-gray-500">Còn lại:</span>
                  <span className="font-semibold text-lg">{formatCurrency(data?.balanceAmount)}</span>
                </div>
              </div>
            </div>

            {data?.poNo && (
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b font-medium">Liên kết</div>
                <div className="p-6 text-sm space-y-2">
                  {data.poNo && (
                    <div>
                      <span className="text-gray-500">Đơn mua hàng: </span>
                      <button 
                        onClick={() => navigate(`/purchase/purchase-orders/${data.orderId}`)}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {data.poNo}
                      </button>
                    </div>
                  )}
                  {data.receiptNo && (
                    <div>
                      <span className="text-gray-500">Phiếu nhập kho: </span>
                      <button 
                        onClick={() => navigate(`/purchase/goods-receipts/${data.receiptId}`)}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {data.receiptNo}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}