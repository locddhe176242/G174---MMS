import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
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

        const payment = await apPaymentService.getPaymentById(id);
        let invoiceData = payment.invoice;
        if (!invoiceData && payment.ap_invoice_id) {
          try {
            invoiceData = await apPaymentService.getInvoiceById(payment.ap_invoice_id);
          } catch (invoiceError) {
            console.warn("Could not load invoice data:", invoiceError);
          }
        }

        if (mounted) {
          setData(payment);
          setInvoice(invoiceData);
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
                Thanh toán công nợ phải trả #{(data.ap_payment_id || data.id)?.toString().padStart(4, "0")}
              </h1>
            </div>
            <button
              onClick={() => navigate(`/purchase/ap-payments/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Số hóa đơn</div>
                  <div className="text-lg font-semibold">{invoice?.invoice_no || data.invoice_no || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày thanh toán</div>
                  <div className="font-medium">{formatDateTime(data.payment_date || data.paymentDate)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Số tiền</div>
                  <div className="text-xl font-semibold text-green-600">{formatCurrency(data.amount)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Phương thức</div>
                  <div className="font-medium">{data.method || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Số tham chiếu</div>
                  <div className="font-medium">{data.reference_no || data.referenceNo || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày tạo</div>
                  <div className="font-medium">{formatDateTime(data.created_at || data.createdAt)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium">Ghi chú</div>
              <div className="p-6 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                {data.notes || "-"}
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            {invoice && (
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b font-medium">Thông tin hóa đơn</div>
                <div className="p-6 text-sm space-y-3">
                  <div>
                    <span className="text-gray-500">Số hóa đơn: </span>
                    <span className="font-medium">{invoice.invoice_no}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Nhà cung cấp: </span>
                    <span className="font-medium">{invoice.vendor?.name || invoice.vendorName || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày hóa đơn: </span>
                    <span className="font-medium">{formatDate(invoice.invoice_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày đến hạn: </span>
                    <span className="font-medium">{formatDate(invoice.due_date)}</span>
                  </div>
                  <div className="pt-2 border-t text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tạm tính:</span>
                      <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thuế:</span>
                      <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tổng cộng:</span>
                      <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="text-gray-500">Đã thanh toán:</span>
                      <span className="font-semibold">{formatCurrency(invoice.total_amount - invoice.balance_amount)}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span className="text-gray-500">Còn lại:</span>
                      <span className="font-semibold">{formatCurrency(invoice.balance_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

