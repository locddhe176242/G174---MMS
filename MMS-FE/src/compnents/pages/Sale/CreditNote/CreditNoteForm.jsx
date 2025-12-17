import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { creditNoteService } from "../../../../api/creditNoteService";
import { returnOrderService } from "../../../../api/returnOrderService";
import apiClient from "../../../../api/apiClient";

const defaultItem = () => ({
  productId: null,
  productCode: "",
  productName: "",
  uom: "",
  quantity: 0,
  unitPrice: 0,
  discountAmount: 0,
  taxRate: 0,
  note: "",
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const formatNumberDisplay = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "";
  return new Intl.NumberFormat("vi-VN").format(numeric);
};

const normalizeNumberInput = (rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return 0;
  }
  const cleaned = rawValue.toString().replace(/[^\d.]/g, "");
  return cleaned ? parseFloat(cleaned) : 0;
};

export default function CreditNoteForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [returnOrders, setReturnOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [returnOrderModalOpen, setReturnOrderModalOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [returnOrderSearch, setReturnOrderSearch] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [returnOrderLoading, setReturnOrderLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [formData, setFormData] = useState({
    invoiceId: "",
    returnOrderId: null,
    creditNoteDate: new Date(),
    commonDiscountRate: 0, // Chiết khấu chung (%)
    reason: "",
    notes: "",
    items: [defaultItem()],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInvoices();
    loadReturnOrders();
    loadProducts();
    if (isEdit) {
      loadCreditNote();
    }
  }, []);

  const loadInvoices = async () => {
    try {
      setInvoiceLoading(true);
      const response = await apiClient.get("/ar-invoices/all");
      const list = Array.isArray(response.data) ? response.data : response.data?.content || [];
      setInvoices(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Invoice");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const loadReturnOrders = async () => {
    try {
      setReturnOrderLoading(true);
      // Load all return orders (không filter theo status để có thể chọn cả Approved và Completed)
      const response = await returnOrderService.getAllReturnOrders();
      const list = Array.isArray(response) ? response : response?.content || [];
      // Filter client-side để chỉ hiển thị Approved hoặc Completed
      const filtered = list.filter(
        (ro) => ro.status === "Approved" || ro.status === "Completed"
      );
      setReturnOrders(filtered);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Return Order");
    } finally {
      setReturnOrderLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceModalOpen && invoices.length === 0) {
      loadInvoices();
    }
  }, [invoiceModalOpen]);

  useEffect(() => {
    if (returnOrderModalOpen && returnOrders.length === 0) {
      loadReturnOrders();
    }
  }, [returnOrderModalOpen]);

  const filteredInvoices = useMemo(() => {
    const term = invoiceSearch.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesKeyword =
        !term ||
        (inv.invoiceNo || "").toLowerCase().includes(term) ||
        (inv.customerName || "").toLowerCase().includes(term);
      return matchesKeyword;
    });
  }, [invoices, invoiceSearch]);

  const filteredReturnOrders = useMemo(() => {
    const term = returnOrderSearch.trim().toLowerCase();
    return returnOrders.filter((ro) => {
      const matchesKeyword =
        !term ||
        (ro.returnNo || "").toLowerCase().includes(term) ||
        (ro.customerName || "").toLowerCase().includes(term);
      return matchesKeyword;
    });
  }, [returnOrders, returnOrderSearch]);

  const loadProducts = async () => {
    try {
      const response = await apiClient.get("/product", {
        params: { page: 0, size: 100, sortBy: "createdAt", sortOrder: "desc" },
      });
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.content || [];
      setProducts(
        list.map((p) => ({
          value: p.productId ?? p.id ?? p.product_id,
          label: `${p.sku || p.productCode || "SP"} - ${p.name}`,
          product: p,
        }))
      );
    } catch (error) {
      console.error("Không thể tải sản phẩm:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    }
  };

  const loadCreditNote = async () => {
    try {
      setLoading(true);
      const data = await creditNoteService.getCreditNote(id);
      setFormData({
        invoiceId: data.invoiceId,
        returnOrderId: data.returnOrderId || null,
        creditNoteDate: data.creditNoteDate ? new Date(data.creditNoteDate) : new Date(),
        commonDiscountRate: Number(data.headerDiscountPercent || data.header_discount_percent || 0),
        reason: data.reason || "",
        notes: data.notes || "",
        items:
          data.items?.map((item) => ({
            productId: item.productId,
            productCode: item.productCode || "",
            productName: item.productName || "",
            uom: item.uom || "",
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            discountAmount: item.discountAmount || 0,
            taxRate: item.taxRate || 0,
            note: item.note || "",
          })) || [defaultItem()],
      });
      // Load invoice and return order data
      if (data.invoiceId) {
        const invoice = invoices.find(
          (inv) => (inv.arInvoiceId || inv.invoiceId) === data.invoiceId
        );
        if (invoice) {
          setSelectedInvoice(invoice);
        } else {
          // Try to load from API
          try {
            const response = await apiClient.get(`/ar-invoices/${data.invoiceId}`);
            setSelectedInvoice(response.data);
          } catch (err) {
            console.error("Could not load invoice:", err);
          }
        }
      }
      if (data.returnOrderId) {
        const ro = returnOrders.find((r) => r.roId === data.returnOrderId);
        if (ro) {
          setSelectedReturnOrder(ro);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải Credit Note");
      navigate("/sales/credit-notes");
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelectFromModal = (invoice) => {
    setInvoiceModalOpen(false);
    if (!invoice?.arInvoiceId && !invoice?.invoiceId) return;
    const invoiceId = invoice.arInvoiceId || invoice.invoiceId;
    setSelectedInvoice(invoice);
    handleInputChange("invoiceId", invoiceId);
  };

  const handleReturnOrderSelectFromModal = (ro) => {
    setReturnOrderModalOpen(false);
    if (!ro?.roId) return;
    setSelectedReturnOrder(ro);
    handleInputChange("returnOrderId", ro.roId);
  };

  const loadFromReturnOrder = async () => {
    if (!selectedReturnOrder?.roId) {
      toast.warn("Vui lòng chọn Return Order");
      return;
    }
    const returnOrderId = selectedReturnOrder.roId;
    try {
      setLoading(true);
      const returnOrder = await returnOrderService.getReturnOrder(returnOrderId);

      // Nếu Return Order có Invoice, tự động chọn Invoice đó
      if (returnOrder.invoiceId) {
        try {
          const response = await apiClient.get(`/ar-invoices/${returnOrder.invoiceId}`);
          setSelectedInvoice(response.data);
          handleInputChange("invoiceId", returnOrder.invoiceId);
        } catch (err) {
          console.error("Could not load invoice:", err);
          toast.warn("Không thể tải Invoice từ Return Order. Vui lòng chọn Invoice thủ công.");
        }
      } else {
        // Tự động tìm Invoice từ Delivery/SalesOrder
        if (returnOrder.deliveryId) {
          try {
            const deliveryResponse = await apiClient.get(`/deliveries/${returnOrder.deliveryId}`);
            const delivery = deliveryResponse.data;
            if (delivery.salesOrderId) {
              // Tìm Invoice có liên kết với SalesOrder này
              const invoicesResponse = await apiClient.get("/ar-invoices/all");
              const allInvoices = Array.isArray(invoicesResponse.data) 
                ? invoicesResponse.data 
                : invoicesResponse.data?.content || [];
              const matchingInvoice = allInvoices.find(
                (inv) => inv.salesOrderId === delivery.salesOrderId || inv.deliveryId === returnOrder.deliveryId
              );
              if (matchingInvoice) {
                setSelectedInvoice(matchingInvoice);
                handleInputChange("invoiceId", matchingInvoice.arInvoiceId || matchingInvoice.invoiceId);
                toast.success("Đã tự động chọn Invoice từ Sales Order");
              } else {
                toast.info("Không tìm thấy Invoice liên quan. Vui lòng chọn Invoice trong form.");
              }
            }
          } catch (err) {
            console.error("Could not find related invoice:", err);
            toast.info("Return Order này chưa liên kết với Invoice. Vui lòng chọn Invoice trong form.");
          }
        } else {
          toast.info("Return Order này chưa liên kết với Invoice. Vui lòng chọn Invoice trong form.");
        }
      }

      // Load items từ Return Order
      if (returnOrder.items && returnOrder.items.length > 0) {
        const items = returnOrder.items.map((item) => ({
          productId: item.productId,
          productCode: item.productCode || item.productSku || "",
          productName: item.productName || "",
          uom: item.uom || "",
          quantity: item.returnedQty || item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          discountAmount: item.discountAmount || 0,
          taxRate: item.taxRate || 0,
          note: item.note || "",
        }));

        setFormData((prev) => ({
          ...prev,
          items: items.length > 0 ? items : [defaultItem()],
        }));

        toast.success("Đã tải dữ liệu từ Return Order");
      } else {
        toast.warn("Return Order không có sản phẩm nào");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể tải dữ liệu từ Return Order");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field, date) => {
    handleInputChange(field, date);
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = prev.items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return { ...prev, items };
    });
  };

  const handleProductSelect = (index, selectedOption) => {
    if (!selectedOption) {
      handleItemChange(index, "productId", null);
      handleItemChange(index, "productName", "");
      handleItemChange(index, "productCode", "");
      handleItemChange(index, "uom", "");
      return;
    }
    const product = selectedOption.product || {};
    handleItemChange(index, "productId", selectedOption.value);
    handleItemChange(index, "productName", product.name || "");
    handleItemChange(index, "productCode", product.sku || product.productCode || "");
    handleItemChange(index, "uom", product.uom || product.unit || "");
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, defaultItem()],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      const items = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items: items.length ? items : [defaultItem()] };
    });
  };

  const totals = useMemo(() => {
    // 1. Tổng tiền hàng (gross)
    const gross = formData.items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      return sum + qty * price;
    }, 0);

    // 2. Tổng chiết khấu từng sản phẩm (line discount)
    const lineDiscount = formData.items.reduce((sum, item) => {
      return sum + Number(item.discountAmount || 0);
    }, 0);

    // 3. Tổng sau chiết khấu từng sản phẩm
    const subtotalBeforeHeader = gross - lineDiscount;

    // 4. Chiết khấu chung (header discount)
    const headerDiscountPercent = Number(formData.commonDiscountRate || 0);
    const headerDiscount = subtotalBeforeHeader * (headerDiscountPercent / 100);

    // 5. Tổng sau chiết khấu chung
    const subtotalAfterHeader = subtotalBeforeHeader - headerDiscount;

    // 6. Thuế (đã được tính trên từng dòng sau line discount)
    const tax = formData.items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      const discount = Number(item.discountAmount || 0);
      const taxable = Math.max(qty * price - discount, 0);
      const taxRate = Number(item.taxRate || 0);
      return sum + (taxable * taxRate) / 100;
    }, 0);

    // 7. Tổng cộng
    const total = subtotalAfterHeader + tax;

    return {
      gross,
      lineDiscount,
      subtotalBeforeHeader,
      headerDiscountPercent,
      headerDiscount,
      subtotalAfterHeader,
      tax,
      total,
    };
  }, [formData.items, formData.commonDiscountRate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.invoiceId) {
      newErrors.invoiceId = "Vui lòng chọn Invoice";
    }
    if (!formData.items || formData.items.length === 0) {
      newErrors.items = "Cần ít nhất một dòng sản phẩm";
    } else {
      const itemErrors = formData.items.map((item, idx) => {
        const err = {};
        if (!item.productId) {
          err.productId = "Chọn sản phẩm";
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          err.quantity = "Số lượng phải lớn hơn 0";
        }
        if (Number(item.unitPrice || 0) < 0) {
          err.unitPrice = "Đơn giá không hợp lệ";
        }
        return err;
      });
      if (itemErrors.some((err) => Object.keys(err).length > 0)) {
        newErrors.itemDetails = itemErrors;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    invoiceId: formData.invoiceId,
    returnOrderId: formData.returnOrderId || null,
    creditNoteDate: formData.creditNoteDate ? formData.creditNoteDate.toISOString().slice(0, 10) : null,
    headerDiscountPercent: Number(formData.commonDiscountRate || 0),
    reason: formData.reason || null,
    notes: formData.notes || null,
    items: formData.items.map((item) => ({
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      uom: item.uom,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      discountAmount: Number(item.discountAmount || 0),
      taxRate: Number(item.taxRate || 0),
      note: item.note || null,
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
      return;
    }
    try {
      setSubmitting(true);
      const payload = buildPayload();
      if (isEdit) {
        await creditNoteService.updateCreditNote(id, payload);
        toast.success("Đã cập nhật Credit Note");
      } else {
        await creditNoteService.createCreditNote(payload);
        toast.success("Đã tạo Credit Note");
      }
      navigate("/sales/credit-notes");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể lưu Credit Note");
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? "Cập nhật Credit Note" : "Tạo Credit Note mới"}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {isEdit ? "Cập nhật thông tin Credit Note" : "Nhập thông tin Credit Note"}
                </p>
              </div>
              <button
                onClick={() => navigate("/sales/credit-notes")}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Quay lại
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice <span className="text-red-500">*</span>
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    value={selectedInvoice?.invoiceNo || ""}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedInvoice?.invoiceNo || ""}
                      readOnly
                      placeholder="Chọn Invoice"
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setInvoiceModalOpen(true)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Chọn
                    </button>
                    {selectedInvoice && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoice(null);
                          handleInputChange("invoiceId", "");
                        }}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-red-600"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                )}
                {errors.invoiceId && (
                  <p className="text-red-500 text-xs mt-1">{errors.invoiceId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Order
                </label>
                {!isEdit ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedReturnOrder?.returnNo || ""}
                      readOnly
                      placeholder="Chọn Return Order (tùy chọn)"
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setReturnOrderModalOpen(true)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Chọn
                    </button>
                    {selectedReturnOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReturnOrder(null);
                          handleInputChange("returnOrderId", null);
                        }}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-red-600"
                      >
                        Xóa
                      </button>
                    )}
                    {selectedReturnOrder && (
                      <button
                        type="button"
                        onClick={loadFromReturnOrder}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Tạo từ RO
                      </button>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={selectedReturnOrder?.returnNo || ""}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày Credit Note
                </label>
                <DatePicker
                  selected={formData.creditNoteDate}
                  onChange={(date) => handleDateChange("creditNoteDate", date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nhập lý do điều chỉnh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiết khấu chung (%) <span className="text-gray-500 text-xs font-normal">- Tùy chọn</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commonDiscountRate}
                  onChange={(e) => handleInputChange("commonDiscountRate", parseFloat(e.target.value) || 0)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  💡 Chiết khấu áp dụng sau khi trừ chiết khấu từng sản phẩm
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Thông tin bổ sung"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Thêm sản phẩm
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Sản phẩm</th>
                      <th className="px-4 py-3 text-left">ĐVT</th>
                      <th className="px-4 py-3 text-right">Số lượng</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Chiết khấu</th>
                      <th className="px-4 py-3 text-right">Thuế (%)</th>
                      <th className="px-4 py-3 text-right">Tạm tính</th>
                      <th className="px-4 py-3 text-center">#</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formData.items.map((item, index) => {
                      const baseTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
                      const discount = Number(item.discountAmount || 0);
                      const taxable = Math.max(baseTotal - discount, 0);
                      const tax = (taxable * Number(item.taxRate || 0)) / 100;
                      const lineTotal = taxable + tax;
                      const itemError = errors.itemDetails?.[index] || {};

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Select
                              placeholder="Chọn sản phẩm"
                              value={products.find((opt) => opt.value === item.productId)}
                              onChange={(option) => handleProductSelect(index, option)}
                              options={products}
                              isClearable
                            />
                            {itemError.productId && (
                              <p className="text-xs text-red-600 mt-1">{itemError.productId}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.uom}
                              onChange={(e) => handleItemChange(index, "uom", e.target.value)}
                              className="w-24 border rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumberDisplay(item.quantity)}
                              onChange={(e) =>
                                handleItemChange(index, "quantity", normalizeNumberInput(e.target.value))
                              }
                              className="w-24 border rounded px-2 py-1 text-right"
                            />
                            {itemError.quantity && (
                              <p className="text-xs text-red-600 mt-1">{itemError.quantity}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumberDisplay(item.unitPrice)}
                              onChange={(e) =>
                                handleItemChange(index, "unitPrice", normalizeNumberInput(e.target.value))
                              }
                              className="w-32 border rounded px-3 py-1 text-right tracking-wide"
                            />
                            {itemError.unitPrice && (
                              <p className="text-xs text-red-600 mt-1">{itemError.unitPrice}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumberDisplay(item.discountAmount)}
                              onChange={(e) =>
                                handleItemChange(index, "discountAmount", normalizeNumberInput(e.target.value))
                              }
                              className="w-28 border rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.taxRate}
                              onChange={(e) => handleItemChange(index, "taxRate", e.target.value)}
                              className="w-24 border rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(lineTotal)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:underline"
                              >
                                Xóa
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan tiền tệ</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            {/* Tổng quan tiền tệ */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan tiền tệ</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền hàng:</span>
                  <span className="font-medium">{formatCurrency(totals.gross)}</span>
                </div>
                {totals.lineDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Chiết khấu sản phẩm:</span>
                    <span>-{formatCurrency(totals.lineDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng sau chiết khấu sản phẩm:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotalBeforeHeader)}</span>
                </div>
                {totals.headerDiscountPercent > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Chiết khấu chung ({totals.headerDiscountPercent}%):</span>
                      <span>-{formatCurrency(totals.headerDiscount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng sau chiết khấu chung:</span>
                      <span className="font-medium">{formatCurrency(totals.subtotalAfterHeader)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Thuế VAT:</span>
                  <span className="font-medium">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/sales/credit-notes")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <InvoicePickerModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoices={filteredInvoices}
        loading={invoiceLoading}
        onSelect={handleInvoiceSelectFromModal}
        searchTerm={invoiceSearch}
        onSearchChange={setInvoiceSearch}
      />

      <ReturnOrderPickerModal
        isOpen={returnOrderModalOpen}
        onClose={() => setReturnOrderModalOpen(false)}
        returnOrders={filteredReturnOrders}
        loading={returnOrderLoading}
        onSelect={handleReturnOrderSelectFromModal}
        searchTerm={returnOrderSearch}
        onSearchChange={setReturnOrderSearch}
      />
    </div>
  );
}

const InvoicePickerModal = ({
  isOpen,
  onClose,
  invoices,
  loading,
  onSelect,
  searchTerm,
  onSearchChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Chọn Invoice</h3>
            <p className="text-sm text-gray-500">Tìm và chọn Invoice</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-6 border-b">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo số hóa đơn hoặc khách hàng..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách Invoice...</div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có Invoice nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số hóa đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày xuất
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tổng tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr
                    key={inv.arInvoiceId || inv.invoiceId}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => onSelect(inv)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {inv.invoiceNo || `INV-${inv.arInvoiceId || inv.invoiceId}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{inv.customerName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {inv.invoiceDate
                        ? new Date(inv.invoiceDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const ReturnOrderPickerModal = ({
  isOpen,
  onClose,
  returnOrders,
  loading,
  onSelect,
  searchTerm,
  onSearchChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Chọn Return Order</h3>
            <p className="text-sm text-gray-500">Tìm và chọn Return Order đã hoàn thành</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-6 border-b">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo số Return Order hoặc khách hàng..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Đang tải danh sách Return Order...
            </div>
          ) : returnOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có Return Order nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số Return Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sales Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tổng tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returnOrders.map((ro) => {
                  const getStatusLabel = (status) => {
                    const statusMap = {
                      Draft: "Nháp",
                      Approved: "Đã duyệt",
                      Rejected: "Từ chối",
                      Completed: "Hoàn thành",
                      Cancelled: "Đã hủy",
                    };
                    return statusMap[status] || status;
                  };

                  const getStatusColor = (status) => {
                    const colorMap = {
                      Draft: "bg-gray-100 text-gray-800",
                      Approved: "bg-blue-100 text-blue-800",
                      Rejected: "bg-red-100 text-red-800",
                      Completed: "bg-green-100 text-green-800",
                      Cancelled: "bg-gray-100 text-gray-500",
                    };
                    return colorMap[status] || "bg-gray-100 text-gray-800";
                  };

                  return (
                    <tr
                      key={ro.roId}
                      className="hover:bg-gray-100 cursor-pointer"
                      onClick={() => onSelect(ro)}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {ro.returnNo || `RO-${ro.roId}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{ro.customerName || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{ro.deliveryNo || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{ro.salesOrderNo || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {ro.invoiceNo ? (
                          <span className="text-blue-600">{ro.invoiceNo}</span>
                        ) : (
                          <span className="text-gray-400">Chưa có</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            ro.status
                          )}`}
                        >
                          {getStatusLabel(ro.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(ro.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

