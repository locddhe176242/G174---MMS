import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { apInvoiceService } from "../../../api/apInvoiceService";
import apiClient from "../../../api/apiClient";
import { formatCurrency, formatNumberInput, parseNumberInput } from "../../../utils/formatters";

export default function APInvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    invoice_no: "",
    vendor_id: null,
    order_id: null,
    receipt_id: null,
    invoice_date: new Date(),
    due_date: null,
    status: "Unpaid",
    notes: "",
    header_discount: 0,
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
  const [isFromGR, setIsFromGR] = useState(false);

  const calculateItemTotal = (item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.unit_price || 0);
    const discountPercent = Number(item.discount_percent || 0) / 100;

    // Bước 1: Tính subtotal
    const subtotal = qty * price;

    // Bước 2: Áp dụng chiết khấu dòng
    const discountAmount = subtotal * discountPercent;
    const amountAfterDiscount = subtotal - discountAmount;

    return {
      subtotal,
      discountAmount,
      amountAfterDiscount
    };
  };

  const totalBeforeTax = useMemo(() => {
    if (!Array.isArray(formData.items)) return 0;
    return formData.items.reduce((sum, it) => {
      const calc = calculateItemTotal(it);
      return sum + calc.subtotal;
    }, 0);
  }, [formData.items]);

  const totalDiscount = useMemo(() => {
    if (!Array.isArray(formData.items)) return 0;
    return formData.items.reduce((sum, it) => {
      const calc = calculateItemTotal(it);
      return sum + calc.discountAmount;
    }, 0);
  }, [formData.items]);

  const totalAfterLineDiscount = useMemo(() => {
    if (!Array.isArray(formData.items)) return 0;
    return formData.items.reduce((sum, it) => {
      const calc = calculateItemTotal(it);
      return sum + calc.amountAfterDiscount;
    }, 0);
  }, [formData.items]);

  const headerDiscountAmount = useMemo(() => {
    const discountPercent = Number(formData.header_discount || 0);
    // Header discount áp dụng trên tổng sau khi trừ chiết khấu dòng
    return totalAfterLineDiscount * (discountPercent / 100);
  }, [totalAfterLineDiscount, formData.header_discount]);

  const taxAmount = useMemo(() => {
    if (!Array.isArray(formData.items)) return 0;
    // Thuế tính trên tổng sau khi trừ TẤT CẢ chiết khấu (line discount + header discount)
    const baseAmount = totalAfterLineDiscount - headerDiscountAmount;
    // Lấy tax rate trung bình hoặc tax rate của dòng đầu tiên (thường các dòng cùng tax rate)
    const taxRate = formData.items.length > 0 ? (Number(formData.items[0].tax_rate || 0) / 100) : 0;
    return baseAmount * taxRate;
  }, [formData.items, totalAfterLineDiscount, headerDiscountAmount]);

  const totalAmount = useMemo(() => {
    // Công thức chuẩn ERP: Tổng = (Tổng sau CK dòng - CK tổng đơn) + Thuế
    // Thuế đã được tính trên số tiền sau tất cả chiết khấu
    return totalAfterLineDiscount - headerDiscountAmount + taxAmount;
  }, [totalAfterLineDiscount, headerDiscountAmount, taxAmount]);

  const balanceAmount = useMemo(() => {
    return totalAmount; // Initially balance = total, will be updated when payments are made
  }, [totalAmount]);

  const formatCurrency = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));

  // Load initial data
  useEffect(() => {
    console.log("APInvoiceForm mounted - id:", id, "isEdit:", isEdit);
    loadVendors();
    loadOrders();
    loadReceipts();
    if (isEdit) {
      loadInvoice();
    } else {
      generateInvoiceNo();
    }
  }, [id]);

  const loadFromGoodsReceipt = async (receiptId) => {
    try {
      setLoading(true);
      console.log("loadFromGoodsReceipt called with receiptId:", receiptId);
      
      // Ensure vendors are loaded first and get the list directly
      let vendorsList = vendors;
      if (vendors.length === 0) {
        vendorsList = await loadVendors();
      }
      
      // Get goods receipt details
      const grResponse = await apiClient.get(`/goods-receipts/${receiptId}`);
      console.log("GR response:", grResponse.data);
      console.log("GR items:", grResponse.data?.items);
      const gr = grResponse.data;

      if (!gr.items || gr.items.length === 0) {
        toast.error("Phiếu nhập kho không có sản phẩm nào");
        setLoading(false);
        return;
      }

      const extractedReceiptId = gr.receiptId || gr.receipt_id;
      console.log("Extracted receipt_id:", extractedReceiptId);

      // Get PO info (vendor + header discount) if available
      let headerDiscount = 0;
      let vendorId = null;
      const extractedOrderId = gr.orderId || gr.order_id || gr.purchaseOrder?.orderId || gr.purchaseOrder?.order_id || gr.order?.orderId || gr.order?.order_id;
      
      if (extractedOrderId) {
        try {
          const poResponse = await apiClient.get(`/purchase-orders/${extractedOrderId}`);
          const poData = poResponse.data;
          headerDiscount = poData?.headerDiscount || poData?.header_discount || 0;
          vendorId = poData?.vendorId || poData?.vendor_id || poData?.vendor?.vendorId || poData?.vendor?.vendor_id;
          console.log("PO header discount:", headerDiscount);
          console.log("PO vendor_id:", vendorId);
        } catch (err) {
          console.warn("Could not fetch PO info:", err);
        }
      }

      // Fallback to GR vendor if PO doesn't have it
      if (!vendorId) {
        vendorId = gr.vendorId || gr.vendor_id || gr.vendor?.vendorId || gr.vendor?.vendor_id || gr.vendor?.id;
      }
      
      console.log("Final vendor_id:", vendorId);
      console.log("Final order_id:", extractedOrderId);
      console.log("Header discount:", headerDiscount);

      // Pre-fill form with GR data
      setFormData(prev => ({
        ...prev,
        vendor_id: vendorId,
        order_id: extractedOrderId,
        receipt_id: extractedReceiptId,
        invoice_date: new Date(),
        header_discount: headerDiscount,
        notes: `Tạo từ phiếu nhập kho ${gr.receiptNo || gr.receipt_no || ''}`,
        items: (gr.items || []).map((item, idx) => {
          console.log(`Item ${idx}:`, item);
          const itemData = {
            description: item.productCode || item.product_code || item.productName || item.product_name || item.description || '',
            uom: item.uom || '',
            quantity: item.receivedQty || item.receivedQuantity || item.received_quantity || item.quantity || 0,
            unit_price: item.unitPrice || item.unit_price || 0,
            discount_percent: item.discountPercent || item.discount_percent || 0,
            tax_rate: item.taxRate || item.tax_rate || 10
          };
          // Calculate line_total using the same formula
          const totals = calculateItemTotal(itemData);
          itemData.line_total = totals.total;
          return itemData;
        })
      }));

      console.log("Form data updated with GR info");
      console.log("Vendors list used:", vendorsList);
      console.log("Looking for vendor_id:", vendorId, "type:", typeof vendorId);
      if (vendorsList.length > 0) {
        console.log("First vendor:", vendorsList[0]);
      }
      console.log("Vendor match test:", vendorsList.find((v) => v.value === vendorId));
      setIsFromGR(true); // Mark as imported from GR
      toast.success("Đã import dữ liệu từ phiếu nhập kho");
      setLoading(false);
    } catch (err) {
      console.error("Error loading GR data:", err);
      toast.error(err?.response?.data?.message || "Không thể load dữ liệu từ phiếu nhập kho");
      setLoading(false);
    }
  };

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
      const vendorList = data.map((v) => ({
        value: v.vendorId || v.vendor_id || v.id,
        label: v.name || `Vendor ${v.vendorId || v.vendor_id || v.id}`,
        vendor: v,
      }));
      setVendors(vendorList);
      return vendorList; // Return for chaining
    } catch (err) {
      console.error("Error loading vendors:", err);
      toast.error("Không thể tải danh sách nhà cung cấp");
      return [];
    }
  };

  const loadOrders = async () => {
    try {
      const response = await apiClient.get("/purchase-orders/page", {
        params: { page: 0, size: 100 }
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.content || [];
      setOrders(
        data.map((o) => ({
          value: o.order_id || o.orderId || o.id,
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
      const response = await apiClient.get("/goods-receipts/page", {
        params: { page: 0, size: 100 }
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.content || [];

      // Only show Approved receipts
      const approvedReceipts = data.filter(r => r.status === "Approved");

      setReceipts(
        approvedReceipts.map((r) => ({
          value: r.receipt_id || r.receiptId || r.id,
          label: `${r.receipt_no || r.receiptNo || "GR"} - ${formatDate(r.received_date || r.receivedDate)}${r.hasInvoice ? " ✓" : ""}`,
          receipt: r,
          isDisabled: r.hasInvoice,
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
      const itemsData = invoice.items || [];

      setFormData({
        invoice_no: invoice.invoice_no || invoice.invoiceNo || "",
        vendor_id: invoice.vendor_id || invoice.vendorId || null,
        order_id: invoice.order_id || invoice.orderId || null,
        receipt_id: invoice.receipt_id || invoice.receiptId || null,
        invoice_date: invoice.invoice_date || invoice.invoiceDate
          ? new Date(invoice.invoice_date || invoice.invoiceDate)
          : new Date(),
        due_date: invoice.due_date || invoice.dueDate
          ? new Date(invoice.due_date || invoice.dueDate)
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

      if (field === "quantity" || field === "unit_price" || field === "discount_percent") {
        const calc = calculateItemTotal(next[index]);
        next[index].line_total = calc.amountAfterDiscount;
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
        invoiceNo: formData.invoice_no,
        vendorId: formData.vendor_id,
        orderId: formData.order_id,
        receiptId: formData.receipt_id,
        invoiceDate: formData.invoice_date,
        dueDate: formData.due_date,
        headerDiscount: formData.header_discount || 0,
        subtotal: totalBeforeTax,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        balanceAmount: balanceAmount,
        status: formData.status,
        notes: formData.notes,
        items: formData.items.map((it) => ({
          description: it.description,
          uom: it.uom || '',
          quantity: Number(it.quantity),
          unitPrice: Number(it.unit_price || 0),
          discountPercent: Number(it.discount_percent || 0),
          taxRate: Number(it.tax_rate || 0),
          lineTotal: Number(it.line_total || 0),
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
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={receipts.find((r) => r.value === formData.receipt_id) || null}
                          onChange={(option) => handleInputChange("receipt_id", option ? option.value : null)}
                          options={receipts}
                          isClearable
                          isOptionDisabled={(option) => option.isDisabled}
                          placeholder="Chọn phiếu nhập"
                          classNamePrefix="react-select"
                        />
                      </div>
                      {formData.receipt_id && !isFromGR && (
                        <button
                          type="button"
                          onClick={() => loadFromGoodsReceipt(formData.receipt_id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Import
                        </button>
                      )}
                      {isFromGR && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsFromGR(false);
                            setFormData(prev => ({ ...prev, receipt_id: null, items: [] }));
                          }}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
                          title="Xóa dữ liệu import và chọn lại"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    {isFromGR && (
                      <p className="mt-1 text-sm text-blue-600">✓ Đã import từ phiếu nhập kho - Nhấn "Reset" để import lại</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Phiếu nhập đã có hóa đơn sẽ hiển thị "(Đã có hóa đơn)" và không thể chọn
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày hóa đơn <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={formData.invoice_date instanceof Date ? formData.invoice_date : (formData.invoice_date ? new Date(formData.invoice_date) : new Date())}
                      onChange={(date) => handleInputChange("invoice_date", date)}
                      dateFormat="dd/MM/yyyy"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.invoice_date ? "border-red-500" : "border-gray-300"}`}
                    />
                    {validationErrors.invoice_date && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.invoice_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày đến hạn thanh toán <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={formData.due_date instanceof Date ? formData.due_date : (formData.due_date ? new Date(formData.due_date) : null)}
                      onChange={(date) => handleInputChange("due_date", date)}
                      dateFormat="dd/MM/yyyy"
                      isClearable
                      placeholderText="Chọn hạn thanh toán cho vendor"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      minDate={new Date()}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      💡 Ngày phải trả tiền cho nhà cung cấp. Hệ thống sẽ nhắc khi đến hạn.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chiết khấu tổng đơn (%)
                    </label>
                    <input
                      type="number"
                      value={formData.header_discount || 0}
                      onChange={(e) => handleInputChange("header_discount", parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isFromGR ? "bg-gray-100" : "border-gray-300"}`}
                      min="0"
                      max="100"
                      step="0.01"
                      readOnly={isFromGR}
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-gray-500">Áp dụng trước khi tính thuế</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thuế VAT (%)
                    </label>
                    <input
                      type="number"
                      value={formData.items.length > 0 ? formData.items[0].tax_rate || 10 : 10}
                      onChange={(e) => {
                        const newTaxRate = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          items: prev.items.map(item => ({ ...item, tax_rate: newTaxRate }))
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="10.00"
                    />
                    <p className="mt-1 text-xs text-gray-500">Thuế tính trên tổng sau tất cả chiết khấu</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
                  {!isFromGR && (
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      Thêm dòng
                    </button>
                  )}
                  {isFromGR && (
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
                      📋 Dữ liệu từ phiếu nhập kho
                    </span>
                  )}
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
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-3 pr-4">#</th>
                          <th className="py-3 pr-4">Mã SP</th>
                          <th className="py-3 pr-4 text-center">ĐVT</th>
                          <th className="py-3 pr-4 text-right">Số lượng</th>
                          <th className="py-3 pr-4 text-right">Đơn giá</th>
                          <th className="py-3 pr-4 text-center">CK (%)</th>
                          <th className="py-3 pr-4 text-right">Thành tiền</th>
                          <th className="py-3 pr-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => {
                          const itemErr = validationErrors.itemDetails?.[index] || {};
                          const calc = calculateItemTotal(item);

                          return (
                            //#
                            <tr key={index} className="border-t hover:bg-gray-50">
                              <td className="py-3 pr-4">{index + 1}</td>
                              <td className="py-3 pr-4">
                                {isFromGR ? (
                                  <span className="text-gray-900">{item.description || "-"}</span>
                                ) : (
                                  <>

                                    <input
                                      type="text" // Mã sản phẩm
                                      value={item.description}
                                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                      className={`w-full px-2 py-1 border rounded text-sm ${itemErr.description ? "border-red-500" : "border-gray-300"}`}
                                      placeholder="Mã sản phẩm"
                                    />
                                    {itemErr.description && (
                                      <p className="text-red-500 text-xs mt-1">{itemErr.description}</p>
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="py-3 pr-4">
                                {isFromGR ? (
                                  <span>{item.uom || "-"}</span>
                                ) : (
                                  <input
                                    type="text" // Đơn vị tính
                                    value={item.uom || ""}
                                    onChange={(e) => handleItemChange(index, "uom", e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="ĐVT"
                                  />
                                )}
                              </td>
                              <td className="py-3 pr-4 text-right">
                                {isFromGR ? (
                                  <span>{Number(item.quantity || 0).toLocaleString()}</span>
                                ) : (
                                  <>
                                    <input
                                      type="number" // Số lượng
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 1)}
                                      className={`w-20 px-2 py-1 border rounded text-sm text-right ${itemErr.quantity ? "border-red-500" : "border-gray-300"}`}
                                      min="1"
                                      step="1"
                                    />
                                    {itemErr.quantity && (
                                      <p className="text-red-500 text-xs mt-1">{itemErr.quantity}</p>
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-right">
                                {isFromGR ? (
                                  <span>{formatCurrency(item.unit_price || 0)}</span>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      value={formatNumberInput(item.unit_price)}
                                      onChange={(e) => handleItemChange(index, "unit_price", parseNumberInput(e.target.value))}
                                      className={`w-32 px-2 py-1 border rounded text-sm text-right ${itemErr.unit_price ? "border-red-500" : "border-gray-300"}`}
                                      placeholder="0"
                                    />
                                    {itemErr.unit_price && (
                                      <p className="text-red-500 text-xs mt-1">{itemErr.unit_price}</p>
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-center">
                                {isFromGR ? (
                                  <span className={item.discount_percent ? "text-green-600 font-medium" : ""}>
                                    {Number(item.discount_percent || 0).toFixed(2)}%
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    value={item.discount_percent || 0}
                                    onChange={(e) => handleItemChange(index, "discount_percent", parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                  />
                                )}
                              </td>
                              <td className="py-3 pr-4 text-right font-medium">
                                {formatCurrency(Number(item.quantity || 0) * Number(item.unit_price || 0))}
                              </td>
                              <td className="py-3 pr-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  disabled={isFromGR}
                                  className={`text-sm font-medium ${isFromGR ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}`}
                                  title={isFromGR ? "Không thể xóa dòng khi import từ GR" : "Xóa dòng"}
                                >
                                  Xoá
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan="7" className="py-3 pr-4 text-right whitespace-nowrap">
                            Tạm tính:
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {formatCurrency(totalBeforeTax)}
                          </td>
                        </tr>
                        {totalDiscount > 0 && (
                          <tr className="border-t font-semibold bg-gray-50">
                            <td colSpan="7" className="py-3 pr-4 text-right whitespace-nowrap">
                              Chiết khấu sản phẩm:
                            </td>
                            <td className="py-3 pr-4 text-right text-red-600">
                              -{formatCurrency(totalDiscount)}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan="7" className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng sau chiết khấu sản phẩm:
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {formatCurrency(totalAfterLineDiscount)}
                          </td>
                        </tr>
                        {formData.header_discount > 0 && (
                          <>
                            <tr className="border-t font-semibold bg-gray-50">
                              <td colSpan="7" className="py-3 pr-4 text-right whitespace-nowrap">
                                Chiết khấu tổng đơn ({formData.header_discount}%):
                              </td>
                              <td className="py-3 pr-4 text-right text-red-600">
                                -{formatCurrency(headerDiscountAmount)}
                              </td>
                            </tr>
                            <tr className="border-t font-semibold bg-gray-50">
                              <td colSpan="7" className="py-3 pr-4 text-right whitespace-nowrap">
                                Tiền sau khi chiết khấu tổng đơn:
                              </td>
                              <td className="py-3 pr-4 text-right font-bold">
                                {formatCurrency(totalAfterLineDiscount - headerDiscountAmount)}
                              </td>
                            </tr>
                          </>
                        )}
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan="7" className="py-3 pr-4 text-right whitespace-nowrap">
                            Thuế VAT ({formData.items.length > 0 ? formData.items[0].tax_rate || 0 : 0}%):
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {formatCurrency(taxAmount)}
                          </td>
                        </tr>
                        <tr className="border-t-2 font-bold bg-blue-50 text-blue-900">
                          <td colSpan="7" className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng cộng:
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {formatCurrency(totalAmount)}
                          </td>
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