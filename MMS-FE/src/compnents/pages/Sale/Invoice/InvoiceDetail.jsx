import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { invoiceService } from "../../../../api/invoiceService";
import { creditNoteService } from "../../../../api/creditNoteService";

const getStatusLabel = (status) => {
  const statusMap = {
    Unpaid: "Chưa thanh toán",
    PartiallyPaid: "Thanh toán một phần",
    Paid: "Đã thanh toán",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  switch (status) {
    case "Unpaid":
      return "bg-red-100 text-red-700";
    case "PartiallyPaid":
      return "bg-yellow-100 text-yellow-700";
    case "Paid":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
const formatNumber = (value) => (value ? Number(value).toLocaleString("vi-VN") : "0");

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState(null);
  const [creditNotes, setCreditNotes] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date(),
    method: "Bank Transfer",
    referenceNo: "",
    notes: "",
  });

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getInvoiceById(id);
      setData(response);
      // Load Credit Notes for this Invoice
      if (response.arInvoiceId) {
        try {
          const creditNotesList = await creditNoteService.getAllCreditNotes({ invoiceId: response.arInvoiceId });
          setCreditNotes(creditNotesList || []);
        } catch (err) {
          console.error("Lỗi khi tải hoá đơn điều chỉnh:", err);
          // Không hiển thị lỗi, chỉ set mảng rỗng
          setCreditNotes([]);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải hóa đơn");
      navigate("/sales/invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán");
      return;
    }
    if (Number(paymentForm.amount) > Number(data.balanceAmount || 0)) {
      toast.error("Số tiền thanh toán không được vượt quá số tiền còn nợ");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        invoiceId: id,
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate.toISOString(),
        method: paymentForm.method || null,
        referenceNo: paymentForm.referenceNo || null,
        notes: paymentForm.notes || null,
      };
      await invoiceService.addPayment(id, payload);
      toast.success("Đã thêm thanh toán");
      setShowPaymentForm(false);
      setPaymentForm({
        amount: "",
        paymentDate: new Date(),
        method: "Bank Transfer",
        referenceNo: "",
        notes: "",
      });
      fetchInvoice();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể thêm thanh toán");
    } finally {
      setSubmitting(false);
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

  const canAddPayment = data.status !== "Paid" && data.status !== "Cancelled" && Number(data.balanceAmount || 0) > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales/invoices")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Quay lại trang trước"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className="text-2xl font-semibold">Hóa đơn: {data.invoiceNo}</h1>
            <div className="flex-1"></div>
            <button
              onClick={() => navigate(`/sales/invoices/${id}/print`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              In hóa đơn
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Thông tin hóa đơn
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="text-gray-500">Số hóa đơn:</span>{" "}
                  <span className="font-semibold">{data.invoiceNo}</span>
                </li>
                <li>
                  <span className="text-gray-500">Trạng thái:</span>{" "}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(data.status)}`}>
                    {getStatusLabel(data.status)}
                  </span>
                </li>
                <li>
                  <span className="text-gray-500">Khách hàng:</span> {data.customerName || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Delivery:</span>{" "}
                  {data.deliveryNo ? (
                    <button
                      onClick={() => navigate(`/sales/deliveries/${data.deliveryId}`)}
                      className="text-blue-600 hover:underline"
                    >
                      {data.deliveryNo}
                    </button>
                  ) : (
                    "—"
                  )}
                </li>
                <li>
                  <span className="text-gray-500">Sales Order:</span>{" "}
                  {data.salesOrderNo ? (
                    <button
                      onClick={() => navigate(`/sales/orders/${data.salesOrderId}`)}
                      className="text-blue-600 hover:underline"
                    >
                      {data.salesOrderNo}
                    </button>
                  ) : (
                    "—"
                  )}
                </li>
                <li>
                  <span className="text-gray-500">Ngày xuất:</span> {formatDate(data.invoiceDate)}
                </li>
                <li>
                  <span className="text-gray-500">Ngày đến hạn:</span> {formatDate(data.dueDate)}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Thông tin thanh toán
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="text-gray-500">Tổng tiền:</span>{" "}
                  <span className="font-semibold">{formatCurrency(data.totalAmount)}</span>
                </li>
                <li>
                  <span className="text-gray-500">Đã thanh toán:</span>{" "}
                  {formatCurrency(Number(data.totalAmount || 0) - Number(data.balanceAmount || 0))}
                </li>
                <li>
                  <span className="text-gray-500">Còn nợ:</span>{" "}
                  <span className="font-semibold text-red-600">
                    {formatCurrency(data.balanceAmount)}
                  </span>
                </li>
                <li>
                  <span className="text-gray-500">Người tạo:</span> {data.createdByDisplay || data.createdBy || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Ngày tạo:</span> {formatDateTime(data.createdAt)}
                </li>
                <li>
                  <span className="text-gray-500">Người cập nhật:</span> {data.updatedByDisplay || data.updatedBy || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Ngày cập nhật:</span> {formatDateTime(data.updatedAt)}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {canAddPayment && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thêm thanh toán</h3>
              {!showPaymentForm && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Thêm thanh toán
                </button>
              )}
            </div>
            {showPaymentForm && (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentForm.amount ? formatNumber(paymentForm.amount) : ""}
                      onChange={(e) => {
                        // Loại bỏ tất cả ký tự không phải số
                        const rawValue = e.target.value.replace(/[^\d]/g, "");
                        if (rawValue === "" || rawValue === "0") {
                          setPaymentForm((prev) => ({ ...prev, amount: "" }));
                        } else {
                          // Lưu số nguyên (không có dấu chấm)
                          setPaymentForm((prev) => ({ ...prev, amount: rawValue }));
                        }
                      }}
                      onBlur={(e) => {
                        // Validate khi blur
                        const numValue = Number(paymentForm.amount || 0);
                        if (!paymentForm.amount || paymentForm.amount === "") {
                          e.target.setCustomValidity("Vui lòng nhập số tiền");
                        } else if (numValue <= 0) {
                          e.target.setCustomValidity("Số tiền phải lớn hơn 0");
                        } else if (numValue > Number(data.balanceAmount || 0)) {
                          e.target.setCustomValidity(`Số tiền không được vượt quá ${formatCurrency(data.balanceAmount)}`);
                        } else {
                          e.target.setCustomValidity("");
                        }
                      }}
                      onInput={(e) => {
                        e.target.setCustomValidity("");
                      }}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Nhập số tiền (VND)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Số tiền còn nợ (VND): {formatCurrency(data.balanceAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày thanh toán
                    </label>
                    <DatePicker
                      selected={paymentForm.paymentDate}
                      onChange={(date) =>
                        setPaymentForm((prev) => ({ ...prev, paymentDate: date }))
                      }
                      dateFormat="dd/MM/yyyy"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phương thức
                    </label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, method: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="Bank Transfer">Chuyển khoản</option>
                      <option value="Cash">Tiền mặt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tham chiếu
                    </label>
                    <input
                      type="text"
                      value={paymentForm.referenceNo}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, referenceNo: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Số chứng từ, số tham chiếu..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ghi chú bổ sung"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentForm({
                        amount: "",
                        paymentDate: new Date(),
                        method: "Bank Transfer",
                        referenceNo: "",
                        notes: "",
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    {submitting ? "Đang lưu..." : "Thêm thanh toán"}
                  </button>
                </div>
              </form>
            )}
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thuế (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thuế
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tổng dòng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items?.map((item, index) => (
                  <tr key={item.ariId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-semibold">{item.productName || item.description || "—"}</div>
                      <div className="text-xs text-gray-500">{item.productSku || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatNumber(item.quantity || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatNumber(item.taxRate || 0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatCurrency(item.taxAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.lineTotal || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {creditNotes && creditNotes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Credit Notes liên quan</h3>
              <p className="text-sm text-gray-500 mt-1">
                Các Credit Note đã được áp dụng vào hóa đơn này
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Số Credit Note
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ngày xuất
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tổng tiền
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Return Order
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {creditNotes.map((cn) => (
                    <tr key={cn.cnId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {cn.creditNoteNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(cn.creditNoteDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            cn.status === "Applied"
                              ? "bg-green-100 text-green-700"
                              : cn.status === "Issued"
                              ? "bg-blue-100 text-blue-700"
                              : cn.status === "Cancelled"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {cn.status === "Applied"
                            ? "Đã áp dụng"
                            : cn.status === "Issued"
                            ? "Đã xuất"
                            : cn.status === "Cancelled"
                            ? "Đã hủy"
                            : "Nháp"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(cn.totalAmount || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="font-semibold text-green-600">
                          -{formatCurrency(cn.appliedToBalance || 0)}
                        </div>
                        {cn.returnOrderNo && (
                          <div className="mt-1">
                            <button
                              onClick={() => navigate(`/sales/return-orders/${cn.returnOrderId}`)}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              {cn.returnOrderNo}
                            </button>
                          </div>
                        )}
                        {cn.refundAmount > 0 && (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-xs font-semibold text-orange-600">
                              Phải trả: {formatCurrency(cn.refundAmount || 0)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Đã trả: {formatCurrency(cn.refundPaidAmount || 0)}
                            </div>
                            {cn.refundPaidAmount >= cn.refundAmount ? (
                              <div className="text-xs text-green-600 font-semibold">✓ Đã hoàn tất</div>
                            ) : (
                              <div className="text-xs text-red-600">
                                Còn lại: {formatCurrency((cn.refundAmount || 0) - (cn.refundPaidAmount || 0))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/sales/credit-notes/${cn.cnId}`)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900">
                      Tổng Credit Notes:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      {formatCurrency(
                        creditNotes.reduce((sum, cn) => sum + Number(cn.totalAmount || 0), 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="font-bold text-green-600">
                        -{formatCurrency(
                          creditNotes.reduce((sum, cn) => sum + Number(cn.appliedToBalance || 0), 0)
                        )}
                      </div>
                      {(() => {
                        const totalRefund = creditNotes.reduce((sum, cn) => sum + Number(cn.refundAmount || 0), 0);
                        const totalPaid = creditNotes.reduce((sum, cn) => sum + Number(cn.refundPaidAmount || 0), 0);
                        if (totalRefund > 0) {
                          return (
                            <div className="mt-1 space-y-0.5">
                              <div className="text-xs font-bold text-orange-600">
                                Phải trả: {formatCurrency(totalRefund)}
                              </div>
                              <div className="text-xs text-gray-600">
                                Đã trả: {formatCurrency(totalPaid)}
                              </div>
                              {totalRefund - totalPaid > 0 ? (
                                <div className="text-xs text-red-600">
                                  Còn lại: {formatCurrency(totalRefund - totalPaid)}
                                </div>
                              ) : (
                                <div className="text-xs text-green-600 font-semibold">✓ Đã hoàn tất</div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      —
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {data.payments && data.payments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Lịch sử thanh toán</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ngày thanh toán
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Số tiền
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phương thức
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Số tham chiếu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.payments.map((payment, index) => (
                    <tr key={payment.arPaymentId || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(payment.paymentDate)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {payment.method || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {payment.referenceNo || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{payment.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">
                      Tổng đã thanh toán:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                      {formatCurrency(
                        data.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
                      )}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

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