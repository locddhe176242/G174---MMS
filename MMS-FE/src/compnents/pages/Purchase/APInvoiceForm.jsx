import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { apInvoiceService } from "../../../api/apInvoiceService";
import apiClient from "../../../api/apiClient";

export default function APInvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    invoice_no: "",
    vendor_id: null,
    order_id: null,
    receipt_id: null,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: null,
    status: "Unpaid",
    notes: "",
    items: [
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        line_total: 0,
      },
    ],
  });

  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const calculateItemTotal = (item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.unit_price || 0);
    const total = qty * price;
    return total;
  };

  const subtotal = useMemo(() => {
    if (!Array.isArray(formData.items)) return 0;
    return formData.items.reduce((sum, it) => {
      return sum + calculateItemTotal(it);
    }, 0);
  }, [formData.items]);

  const totalAmount = useMemo(() => {
    return subtotal;
  }, [subtotal]);

  const balanceAmount = useMemo(() => {
    return totalAmount; // Initially balance = total, will be updated when payments are made
  }, [totalAmount]);

  const formatCurrency = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));

  useEffect(() => {
    loadVendors();
    loadOrders();
    loadReceipts();
    if (isEdit) {
      loadInvoice();
    } else {
      generateInvoiceNo();
    }
  }, [id]);

  const generateInvoiceNo = async () => {
    try {
      const response = await apInvoiceService.generateInvoiceNo();
      if (response?.invoice_no || response?.invoiceNo) {
        setFormData(prev => ({ ...prev, invoice_no: response.invoice_no || response.invoiceNo }));
      }
    } catch (err) {
      console.warn("Could not generate invoice number:", err);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await apiClient.get("/vendors");
      const data = Array.isArray(response.data) 
        ? response.data 
        : response.data?.content || [];
      setVendors(
        data.map((v) => ({
          value: v.vendor_id || v.id,
          label: v.name || `Vendor ${v.vendor_id || v.id}`,
          vendor: v,
        }))
      );
    } catch (err) {
      console.error("Error loading vendors:", err);
      toast.error("Không thể tải danh sách nhà cung cấp");
    }
  };

  const loadOrders = async () => {
    try {
      const response = await apiClient.get("/purchase-orders", {
        params: { page: 0, size: 100 }
      });
      const data = Array.isArray(response.data) 
        ? response.data 
        : response.data?.content || [];
      setOrders(
        data.map((o) => ({
          value: o.order_id || o.id,
          label: `${o.po_no || o.poNo || "PO"} - ${o.vendorName || o.vendor?.name || ""}`,
          order: o,
        }))
      );
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  };

  const loadReceipts = async () => {
    try {
      const response = await apiClient.get("/goods-receipts", {
        params: { page: 0, size: 100 }
      });
      const data = Array.isArray(response.data) 
        ? response.data 
        : response.data?.content || [];
      setReceipts(
        data.map((r) => ({
          value: r.receipt_id || r.id,
          label: `${r.receipt_no || r.receiptNo || "GR"} - ${formatDate(r.received_date || r.receivedDate)}`,
          receipt: r,
        }))
      );
    } catch (err) {
      console.error("Error loading receipts:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoice = await apInvoiceService.getInvoiceById(id);
      const itemsData = await apInvoiceService.getInvoiceItems(id);

      setFormData({
        invoice_no: invoice.invoice_no || invoice.invoiceNo || "",
        vendor_id: invoice.vendor_id || invoice.vendorId || null,
        order_id: invoice.order_id || invoice.orderId || null,
        receipt_id: invoice.receipt_id || invoice.receiptId || null,
        invoice_date: invoice.invoice_date || invoice.invoiceDate 
          ? new Date(invoice.invoice_date || invoice.invoiceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || invoice.dueDate 
          ? new Date(invoice.due_date || invoice.dueDate).toISOString().split('T')[0]
          : null,
        status: invoice.status || "Unpaid",
        notes: invoice.notes || "",
        items: itemsData && itemsData.length > 0 ? itemsData.map((it) => {
          const total = calculateItemTotal(it);
          return {
            description: it.description || "",
            quantity: it.quantity || 1,
            unit_price: it.unit_price || it.unitPrice || 0,
            line_total: total,
          };
        }) : [{
          description: "",
          quantity: 1,
          unit_price: 0,
          line_total: 0,
        }],
      });
    } catch (err) {
      console.error("Error loading AP Invoice:", err);
      setError("Không thể tải thông tin Hóa đơn phải trả");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.items];
      next[index] = { ...next[index], [field]: value };
      
      if (field === "quantity" || field === "unit_price") {
        const total = calculateItemTotal(next[index]);
        next[index].line_total = total;
      }
      
      return { ...prev, items: next };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          line_total: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      const next = [...prev.items];
      next.splice(index, 1);
      return { 
        ...prev, 
        items: next.length ? next : [{
          description: "",
          quantity: 1,
          unit_price: 0,
          line_total: 0,
        }] 
      };
    });
  };

  const validate = () => {
    const errors = {};
    if (!formData.invoice_no || !formData.invoice_no.trim()) {
      errors.invoice_no = "Số hóa đơn là bắt buộc";
    }
    if (!formData.vendor_id) {
      errors.vendor_id = "Nhà cung cấp là bắt buộc";
    }
    if (!formData.invoice_date) {
      errors.invoice_date = "Ngày hóa đơn là bắt buộc";
    }
    if (formData.items.length === 0) {
      errors.items = "Cần ít nhất 1 dòng hàng";
    } else {
      const itemErrs = formData.items.map((it, idx) => {
        const e = {};
        if (!it.description || !it.description.trim()) {
          e.description = "Mô tả là bắt buộc";
        }
        if (!it.quantity || Number(it.quantity) <= 0) {
          e.quantity = "Số lượng phải > 0";
        }
        if (!it.unit_price || Number(it.unit_price) <= 0) {
          e.unit_price = "Đơn giá phải > 0";
        }
        return e;
      });
      if (itemErrs.some((x) => Object.keys(x).length > 0)) {
        errors.itemDetails = itemErrs;
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
        invoice_no: formData.invoice_no,
        vendor_id: formData.vendor_id,
        order_id: formData.order_id,
        receipt_id: formData.receipt_id,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        subtotal: subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        balance_amount: balanceAmount,
        status: formData.status,
        notes: formData.notes,
        items: formData.items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price || 0),
          tax_rate: 0,
          line_total: Number(it.line_total || 0),
        })),
      };

      if (isEdit) {
        await apInvoiceService.updateInvoice(id, payload);
        toast.success("Cập nhật Hóa đơn phải trả thành công!");
      } else {
        await apInvoiceService.createInvoice(payload);
        toast.success("Tạo Hóa đơn phải trả thành công!");
      }
      navigate("/purchase/ap-invoices");
    } catch (err) {
      console.error("Error saving AP Invoice:", err);
      setError(err?.response?.data?.message || (isEdit ? "Không thể cập nhật Hóa đơn phải trả" : "Không thể tạo Hóa đơn phải trả"));
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
              {isEdit ? "Cập nhật Hóa đơn phải trả" : "Tạo Hóa đơn phải trả mới"}
            </h1>
            <button
              onClick={() => navigate("/purchase/ap-invoices")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin hóa đơn</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số hóa đơn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.invoice_no}
                      readOnly
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 ${validationErrors.invoice_no ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Số sẽ được tự động tạo"
                    />
                    {validationErrors.invoice_no && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.invoice_no}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhà cung cấp <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={vendors.find((v) => v.value === formData.vendor_id) || null}
                      onChange={(option) => handleInputChange("vendor_id", option ? option.value : null)}
                      options={vendors}
                      isClearable
                      placeholder="Chọn nhà cung cấp"
                      classNamePrefix="react-select"
                    />
                    {validationErrors.vendor_id && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.vendor_id}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn hàng (tùy chọn)
                    </label>
                    <Select
                      value={orders.find((o) => o.value === formData.order_id) || null}
                      onChange={(option) => handleInputChange("order_id", option ? option.value : null)}
                      options={orders}
                      isClearable
                      placeholder="Chọn đơn hàng"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phiếu nhập (tùy chọn)
                    </label>
                    <Select
                      value={receipts.find((r) => r.value === formData.receipt_id) || null}
                      onChange={(option) => handleInputChange("receipt_id", option ? option.value : null)}
                      options={receipts}
                      isClearable
                      placeholder="Chọn phiếu nhập"
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày hóa đơn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => handleInputChange("invoice_date", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.invoice_date ? "border-red-500" : "border-gray-300"}`}
                    />
                    {validationErrors.invoice_date && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.invoice_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày đến hạn
                    </label>
                    <input
                      type="date"
                      value={formData.due_date || ""}
                      onChange={(e) => handleInputChange("due_date", e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Thêm dòng
                  </button>
                </div>

                {validationErrors.items && (
                  <p className="text-red-500 text-sm mb-4">{validationErrors.items}</p>
                )}

                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Chưa có dòng hàng nào. Nhấn "Thêm dòng" để bắt đầu.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">#</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Mô tả</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Đơn giá</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thành tiền</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => {
                          const itemErr = validationErrors.itemDetails?.[index] || {};
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700 text-center">{index + 1}</td>
                              <td className="border border-gray-200 px-4 py-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                  className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${itemErr.description ? "border-red-500" : ""}`}
                                  placeholder="Mô tả sản phẩm/dịch vụ"
                                />
                                {itemErr.description && (
                                  <p className="text-red-500 text-xs mt-1">{itemErr.description}</p>
                                )}
                              </td>
                              <td className="border border-gray-200 px-4 py-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 1)}
                                  className={`w-20 px-2 py-1 border border-gray-300 rounded text-sm ${itemErr.quantity ? "border-red-500" : ""}`}
                                  min="1"
                                  step="1"
                                />
                                {itemErr.quantity && (
                                  <p className="text-red-500 text-xs mt-1">{itemErr.quantity}</p>
                                )}
                              </td>
                              <td className="border border-gray-200 px-4 py-2">
                                <input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                  className={`w-32 px-2 py-1 border border-gray-300 rounded text-sm ${itemErr.unit_price ? "border-red-500" : ""}`}
                                  min="0"
                                  step="0.01"
                                />
                                {itemErr.unit_price && (
                                  <p className="text-red-500 text-xs mt-1">{itemErr.unit_price}</p>
                                )}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-sm font-medium">
                                {formatCurrency(item.line_total || 0)}
                              </td>
                              <td className="border border-gray-200 px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100">
                          <td colSpan={4} className="border border-gray-200 px-4 py-2 text-right font-bold">
                            Tổng cộng:
                          </td>
                          <td className="border border-gray-200 px-4 py-2 font-bold">
                            {formatCurrency(totalAmount)}
                          </td>
                          <td className="border border-gray-200"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập ghi chú (không bắt buộc)"
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/purchase/ap-invoices")}
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
                    isEdit ? "Cập nhật" : "Tạo mới"
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

