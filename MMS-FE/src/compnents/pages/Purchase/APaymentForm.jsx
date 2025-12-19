import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { apInvoiceService } from "../../../api/apInvoiceService";
import { apPaymentService } from "../../../api/apPaymentService";
import { formatCurrency, formatNumberInput, parseNumberInput } from "../../../utils/formatters";

export default function APaymentForm() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const isAddPayment = Boolean(invoiceId);

  const [formData, setFormData] = useState({
    apInvoiceId: null,
    paymentDate: new Date(),
    amount: 0,
    method: "",
    referenceNo: "",
    notes: "",
  });

  const [invoice, setInvoice] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const paymentDate = useMemo(() => {
    if (!formData.paymentDate) return "";
    if (formData.paymentDate instanceof Date) return formData.paymentDate;
    return new Date(formData.paymentDate);
  }, [formData.paymentDate]);

  const paymentMethodOptions = [
    { value: "Bank Transfer", label: "Chuyển khoản" },
    { value: "Cash", label: "Tiền mặt" },
  ];

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await apInvoiceService.getInvoiceById(invoiceId);
      setInvoice(invoiceData);
      setFormData(prev => ({
        ...prev,
        apInvoiceId: invoiceData.apInvoiceId,
        amount: invoiceData.balanceAmount || 0,
      }));
    } catch (err) {
      console.error("Error loading invoice:", err);
      setError("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const generateReferenceNo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const refNo = `TXN${year}${month}${day}${hours}${minutes}${seconds}${random}`;
    handleInputChange('referenceNo', refNo);
    toast.success('Đã tạo mã tham chiếu tự động');
  };



  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    
    // Common validations
    if (!formData.paymentDate) {
      errors.paymentDate = "Chọn ngày thanh toán";
    }
    
    // Validate amount
    if (!formData.amount || formData.amount === "" || formData.amount === null) {
      errors.amount = "Vui lòng nhập số tiền";
    } else if (isNaN(Number(formData.amount))) {
      errors.amount = "Số tiền phải là số hợp lệ";
    } else if (Number(formData.amount) <= 0) {
      errors.amount = "Số tiền phải lớn hơn 0";
    } else if (invoice && Number(formData.amount) > Number(invoice.balanceAmount)) {
      errors.amount = `Số tiền không thể lớn hơn công nợ còn lại (${formatCurrency(invoice.balanceAmount)})`;
    }

    // Payment terms validation for PO-related invoices
    if (invoice && invoice.paymentTerms) {
      const paymentTerms = invoice.paymentTerms.toUpperCase();
      
      // COD (Cash On Delivery) - Payment must be made immediately
      if (paymentTerms.includes('COD')) {
        const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
        const paymentDate = formData.paymentDate instanceof Date ? formData.paymentDate : new Date(formData.paymentDate);
        
        if (invoiceDate) {
          const daysDiff = Math.floor((paymentDate - invoiceDate) / (1000 * 60 * 60 * 24));
          if (daysDiff > 0) {
            errors.paymentDate = "Điều khoản COD yêu cầu thanh toán ngay. Ngày thanh toán không được sau ngày hóa đơn.";
          }
        }
        
        // COD typically requires full payment
        if (invoice.balanceAmount && Number(formData.amount) < Number(invoice.balanceAmount)) {
          errors.amount = "Điều khoản COD yêu cầu thanh toán toàn bộ số tiền.";
        }
      }
      
      // Net 30 - Payment within 30 days
      if (paymentTerms.includes('NET') && paymentTerms.includes('30')) {
        const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
        const paymentDate = formData.paymentDate instanceof Date ? formData.paymentDate : new Date(formData.paymentDate);
        
        if (invoiceDate) {
          const daysDiff = Math.floor((paymentDate - invoiceDate) / (1000 * 60 * 60 * 24));
          if (daysDiff > 30) {
            errors.paymentDate = "Điều khoản Net 30 yêu cầu thanh toán trong vòng 30 ngày kể từ ngày hóa đơn.";
          }
        }
        
        if (dueDate && paymentDate > dueDate) {
          errors.paymentDate = `Ngày thanh toán không được vượt quá ngày đến hạn (${dueDate.toLocaleDateString("vi-VN")}).`;
        }
      }
    }

    // Payment method specific validations
    if (formData.method === "Bank Transfer") {
      // Bank Transfer requires reference number for reconciliation
      if (!formData.referenceNo || formData.referenceNo.trim() === "") {
        errors.referenceNo = "Mã tham chiếu bắt buộc cho chuyển khoản (nhập mã giao dịch ngân hàng)";
      }
    }
    
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
        apInvoiceId: formData.apInvoiceId,
        paymentDate: formData.paymentDate instanceof Date ? formData.paymentDate.toISOString() : formData.paymentDate,
        amount: Number(formData.amount || 0),
        method: formData.method || "",
        referenceNo: formData.referenceNo || "",
        notes: formData.notes || "",
      };

      await apPaymentService.createPayment(payload);
      toast.success("Thêm thanh toán thành công!");
      navigate(`/purchase/ap-invoices/${invoiceId}`);
    } catch (err) {
      console.error("Error adding payment:", err);
      setError(err?.response?.data?.message || "Không thể thêm thanh toán");
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(invoiceId ? `/purchase/ap-invoices/${invoiceId}` : "/purchase/ap-invoices")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Quay lại trang trước"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className="text-2xl font-semibold">
              Thêm thanh toán - {invoice?.invoiceNo || ''}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin thanh toán cho hóa đơn {invoice?.invoiceNo}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {invoice && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Số hóa đơn</div>
                        <div className="font-semibold text-lg">{invoice.invoiceNo}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Nhà cung cấp</div>
                        <div className="font-medium">{invoice.vendorName}</div>
                      </div>
                      {invoice.poNo && (
                        <div>
                          <div className="text-gray-600">Số PO</div>
                          <div className="font-medium">{invoice.poNo}</div>
                        </div>
                      )}
                      {invoice.paymentTerms && (
                        <div>
                          <div className="text-gray-600">Điều khoản thanh toán</div>
                          <div className="font-medium">{invoice.paymentTerms}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-gray-600">Ngày hóa đơn</div>
                        <div className="font-medium">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString("vi-VN") : "-"}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Ngày đến hạn</div>
                        <div className="font-medium">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("vi-VN") : "-"}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Tổng tiền</div>
                        <div className="font-semibold text-lg">{formatCurrency(invoice.totalAmount)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Còn lại</div>
                        <div className="text-red-600 font-semibold text-lg">{formatCurrency(invoice.balanceAmount)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày thanh toán <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={paymentDate}
                    onChange={(date) => handleInputChange("paymentDate", date)}
                    dateFormat="dd/MM/yyyy"
                    className={`w-full px-3 py-2 border rounded-lg ${validationErrors.paymentDate ? "border-red-500" : "border-gray-300"}`}
                  />
                  {validationErrors.paymentDate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.paymentDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumberInput(formData.amount)}
                      onChange={(e) => handleInputChange("amount", parseNumberInput(e.target.value))}
                      className={`w-full px-3 py-2 pr-8 border rounded-lg text-right ${validationErrors.amount ? "border-red-500" : "border-gray-300"}`}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₫</span>
                  </div>
                  {validationErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                  )}
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
                      value={formData.referenceNo}
                      onChange={(e) => handleInputChange("referenceNo", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.referenceNo ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={formData.method === "Bank Transfer" ? "Nhập mã giao dịch ngân hàng" : "VD: TT001, HD123..."}
                    />
                    {validationErrors.referenceNo && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.referenceNo}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.method === "Bank Transfer" 
                        ? "Nhập mã giao dịch ngân hàng để đối soát (không bắt buộc)"
                        : "Nhập mã tham chiếu hoặc mã giao dịch ngân hàng (không bắt buộc)"
                      }
                    </p>
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
                  onClick={() => navigate(invoiceId ? `/purchase/ap-invoices/${invoiceId}` : "/purchase/ap-invoices")}
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
                      Đang thêm...
                    </>
                  ) : (
                    "Thêm thanh toán"
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