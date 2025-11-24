import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { apPaymentService } from "../../../api/apPaymentService";

export default function APaymentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    ap_invoice_id: null,
    payment_date: new Date(),
    amount: 0,
    method: "",
    reference_no: "",
    notes: "",
  });

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const paymentDate = useMemo(() => {
    if (!formData.payment_date) return "";
    if (formData.payment_date instanceof Date) return formData.payment_date;
    return new Date(formData.payment_date);
  }, [formData.payment_date]);

  const paymentMethodOptions = [
    { value: "Bank Transfer", label: "Chuyển khoản" },
    { value: "Cash", label: "Tiền mặt" },
  ];

  useEffect(() => {
    loadInvoices();
    if (isEdit) {
      loadPayment();
    }
  }, [isEdit, id]);

  const loadInvoices = async () => {
    try {
      const response = await apPaymentService.getInvoices({ page: 0, size: 100, sort: "dueDate,asc" });
      const data = Array.isArray(response) ? response : response?.content || [];
      setInvoices(
        data.map((invoice) => ({
          value: invoice.ap_invoice_id || invoice.id,
          label: `${invoice.invoice_no} - ${invoice.vendor?.name || invoice.vendorName || "Vendor"} (${formatCurrency(invoice.balance_amount || invoice.balanceAmount || 0)} còn lại)`,
          invoice,
        }))
      );
    } catch (err) {
      console.error("Error loading invoices:", err);
      toast.error("Không thể tải danh sách hóa đơn AP");
    }
  };

  const loadPayment = async () => {
    try {
      setLoading(true);
      const payment = await apPaymentService.getPaymentById(id);
      setFormData({
        ap_invoice_id: payment.ap_invoice_id || payment.invoice?.ap_invoice_id || null,
        payment_date: payment.payment_date ? new Date(payment.payment_date) : new Date(),
        amount: Number(payment.amount || 0),
        method: payment.method || "",
        reference_no: payment.reference_no || payment.referenceNo || "",
        notes: payment.notes || "",
      });

      if (payment.ap_invoice_id) {
        const invoiceDetail = payment.invoice || (await apPaymentService.getInvoiceById(payment.ap_invoice_id));
        setSelectedInvoice(invoiceDetail);
      }
    } catch (err) {
      console.error("Error loading payment:", err);
      setError("Không thể tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleInvoiceChange = async (option) => {
    if (option) {
      handleInputChange("ap_invoice_id", option.value);
      const invoiceData = option.invoice || (await apPaymentService.getInvoiceById(option.value));
      setSelectedInvoice(invoiceData);
      const balance = Number(invoiceData.balance_amount || invoiceData.balanceAmount || 0);
      handleInputChange("amount", balance > 0 ? balance : Number(invoiceData.total_amount || invoiceData.totalAmount || 0));
    } else {
      handleInputChange("ap_invoice_id", null);
      setSelectedInvoice(null);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.ap_invoice_id) errors.ap_invoice_id = "Chọn hóa đơn cần thanh toán";
    if (!formData.payment_date) errors.payment_date = "Chọn ngày thanh toán";
    if (!formData.amount || Number(formData.amount) <= 0) errors.amount = "Số tiền phải > 0";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const payload = {
        ap_invoice_id: formData.ap_invoice_id,
        payment_date: formData.payment_date instanceof Date ? formData.payment_date.toISOString() : formData.payment_date,
        amount: Number(formData.amount || 0),
        method: formData.method || "",
        reference_no: formData.reference_no || "",
        notes: formData.notes || "",
      };

      if (isEdit) {
        await apPaymentService.updatePayment(id, payload);
        toast.success("Cập nhật thanh toán thành công!");
      } else {
        await apPaymentService.createPayment(payload);
        toast.success("Tạo thanh toán thành công!");
      }
      navigate("/purchase/ap-payments");
    } catch (err) {
      console.error("Error saving payment:", err);
      setError(err?.response?.data?.message || (isEdit ? "Không thể cập nhật thanh toán" : "Không thể tạo thanh toán"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Cập nhật thanh toán" : "Tạo thanh toán mới"}
            </h1>
            <button
              onClick={() => navigate("/purchase/ap-payments")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin thanh toán</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hóa đơn cần thanh toán <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={invoices.find((opt) => opt.value === formData.ap_invoice_id) || null}
                    onChange={handleInvoiceChange}
                    options={invoices}
                    placeholder="Chọn hóa đơn cần thanh toán"
                    isClearable
                    classNamePrefix="react-select"
                  />
                  {validationErrors.ap_invoice_id && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.ap_invoice_id}</p>
                  )}
                </div>

                {selectedInvoice && (
                  <div className="bg-gray-50 border rounded-lg p-4 text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-500">Nhà cung cấp</div>
                      <div className="font-medium">{selectedInvoice.vendor?.name || selectedInvoice.vendorName || "-"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Ngày đến hạn</div>
                      <div className="font-medium">{selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString("vi-VN") : "-"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Tổng tiền</div>
                      <div className="font-medium">{formatCurrency(selectedInvoice.total_amount)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Còn lại</div>
                      <div className="text-red-500 font-semibold">{formatCurrency(selectedInvoice.balance_amount)}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày thanh toán <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={paymentDate}
                      onChange={(date) => handleInputChange("payment_date", date)}
                      dateFormat="dd/MM/yyyy"
                      className={`w-full px-3 py-2 border rounded-lg ${validationErrors.payment_date ? "border-red-500" : "border-gray-300"}`}
                    />
                    {validationErrors.payment_date && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.payment_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tiền <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg text-right ${validationErrors.amount ? "border-red-500" : "border-gray-300"}`}
                      min="0"
                      step="0.01"
                    />
                    {validationErrors.amount && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phương thức thanh toán
                    </label>
                    <Select
                      value={
                        formData.method
                          ? paymentMethodOptions.find((opt) => opt.value === formData.method) || null
                          : null
                      }
                      onChange={(option) => handleInputChange("method", option ? option.value : "")}
                      options={paymentMethodOptions}
                      isClearable
                      placeholder="Chọn phương thức"
                      classNamePrefix="react-select"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã tham chiếu
                    </label>
                    <input
                      type="text"
                      value={formData.reference_no}
                      onChange={(e) => handleInputChange("reference_no", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="VD: TT001, HD123..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nhập ghi chú (không bắt buộc)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/purchase/ap-payments")}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lưu...
                    </>
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

