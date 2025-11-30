import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { salesQuotationService } from "../../../../api/salesQuotationService";
import customerService from "../../../../api/customerService";
import apiClient from "../../../../api/apiClient";

const STATUS_LABELS = {
  Draft: "Nháp",
  Active: "Đang mở",
  Cancelled: "Đã hủy",
  Expired: "Hết hạn",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const DEFAULT_ITEM = {
  productId: null,
  productCode: "",
  productName: "",
  uom: "",
  quantity: 1,
  unitPrice: 0,
  discountRate: 0,
  taxRate: 0,
};

const currencyFormatter = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

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
  const cleaned = rawValue.toString().replace(/[^\d]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

const getEffectiveTaxRate = (itemTaxRate, commonTaxRate) => {
  if (itemTaxRate === null || itemTaxRate === undefined || itemTaxRate === "") {
    return Number(commonTaxRate || 0);
  }
  return Number(itemTaxRate || 0);
};

export default function SalesQuotationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [originalStatus, setOriginalStatus] = useState("Draft");

  const [formData, setFormData] = useState({
    quotationNo: "",
    customerId: null,
    status: "Draft",
    quotationDate: "",
    validUntil: "",
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    taxRate: 0,
    items: [DEFAULT_ITEM],
  });

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadQuotation();
    } else {
      generateTempQuotationNo();
    }
  }, [id, isEdit]);

  const getCustomerLabel = (customer) => {
    const code = customer.customerCode || customer.code || "KH";
    const fullName =
      customer.name ||
      [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
      customer.fullName ||
      customer.companyName ||
      "Không rõ tên";
    return `${code} - ${fullName}`;
  };

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomersWithPagination(0, 100, "createdAt,desc");
      const list = Array.isArray(response?.content) ? response.content : [];
      setCustomers(
        list.map((c) => ({
          value: c.customerId ?? c.id,
          label: getCustomerLabel(c),
        }))
      );
    } catch (error) {
      console.error("Không thể tải khách hàng:", error);
      toast.error("Không thể tải danh sách khách hàng");
    }
  };

  const loadProducts = async () => {
    try {
      const resp = await apiClient.get("/product", {
        params: { page: 0, size: 100, sortBy: "createdAt", sortOrder: "desc" },
      });
      const list = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.content || [];
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

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const quotation = await salesQuotationService.getQuotationById(id);
      setFormData({
        quotationNo: quotation.quotationNo || "",
        customerId: quotation.customerId || quotation.customer?.customerId || null,
        status: quotation.status || "Draft",
        quotationDate: quotation.quotationDate
          ? quotation.quotationDate.slice(0, 10)
          : "",
        validUntil: quotation.validUntil ? quotation.validUntil.slice(0, 10) : "",
        paymentTerms: quotation.paymentTerms || "",
        deliveryTerms: quotation.deliveryTerms || "",
        notes: quotation.notes || "",
        taxRate: quotation.taxRate || 0,
        items:
          quotation.items?.map((item) => ({
            productId: item.productId || item.product?.productId || null,
            productCode: item.productCode || item.productSku || "",
            productName: item.productName || "",
            uom: item.uom || "",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.price || 0,
            discountRate: item.discountAmount && item.quantity && item.unitPrice
              ? (Number(item.discountAmount) / (Number(item.quantity) * Number(item.unitPrice))) * 100
              : 0,
            taxRate: item.taxRate || 0,
          })) || [DEFAULT_ITEM],
      });
      setOriginalStatus(quotation.status || "Draft");
    } catch (error) {
      console.error("Không thể tải báo giá:", error);
      toast.error("Không thể tải báo giá");
      navigate("/sales/quotations");
    } finally {
      setLoading(false);
    }
  };

  const generateTempQuotationNo = () => {
    const ts = Date.now().toString().slice(-5);
    setFormData((prev) => ({
      ...prev,
      quotationNo: prev.quotationNo || `SQ-${ts}`,
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field, date) => {
    handleInputChange(field, date ? date.toISOString().slice(0, 10) : "");
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = prev.items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return { ...prev, items };
    });
  };

  const getProductPrice = (product) => {
    return (
      product?.salePrice ??
      product?.sellingPrice ??
      product?.price ??
      product?.unitPrice ??
      product?.selling_price ??
      product?.priceUnit ??
      0
    );
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
    handleItemChange(
      index,
      "productCode",
      product.sku || product.productCode || ""
    );
    handleItemChange(index, "uom", product.uom || product.unit || "");
    const productPrice = getProductPrice(product);
    if (productPrice) {
      handleItemChange(index, "unitPrice", productPrice);
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...DEFAULT_ITEM }],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      const items = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items: items.length ? items : [{ ...DEFAULT_ITEM }] };
    });
  };

  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      return sum + qty * price;
    }, 0);

    const discount = formData.items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      const rate = Number(item.discountRate || 0);
      const lineTotal = qty * price;
      return sum + (lineTotal * rate) / 100;
    }, 0);

    const taxable = Math.max(subtotal - discount, 0);
    const taxRate = Number(formData.taxRate || 0);
    const taxAmount =
      formData.items.reduce((sum, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const discountRate = Number(item.discountRate || 0);
        const lineTotal = qty * price;
        const lineDiscount = (lineTotal * discountRate) / 100;
        const lineBase = Math.max(lineTotal - lineDiscount, 0);
        const itemTaxRate = getEffectiveTaxRate(item.taxRate, formData.taxRate);
        return sum + (lineBase * itemTaxRate) / 100;
      }, 0) || (taxable * taxRate) / 100;
    const total = taxable + Number(taxAmount || 0);

    return {
      subtotal,
      discountTotal: discount,
      taxAmount,
      totalAmount: total,
    };
  }, [formData.items, formData.taxRate]);

  const validateForm = () => {
    const errors = {};
    if (!formData.customerId) {
      errors.customerId = "Vui lòng chọn khách hàng";
    }
    if (!formData.quotationDate) {
      errors.quotationDate = "Vui lòng chọn ngày báo giá";
    }
    if (formData.validUntil && formData.validUntil < formData.quotationDate) {
      errors.validUntil = "Hạn báo giá phải sau ngày báo giá";
    }
    if (!formData.items || formData.items.length === 0) {
      errors.items = "Cần ít nhất một dòng sản phẩm";
    } else {
      const itemErrors = formData.items.map((item) => {
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
        errors.itemDetails = itemErrors;
      }
    }
    return errors;
  };

  const buildPayload = () => ({
    quotationNo: formData.quotationNo || null,
    customerId: formData.customerId,
    status: formData.status,
    quotationDate: formData.quotationDate,
    validUntil: formData.validUntil || null,
    paymentTerms: formData.paymentTerms || null,
    deliveryTerms: formData.deliveryTerms || null,
    notes: formData.notes || null,
    headerDiscount: 0,
    taxRate: Number(formData.taxRate || 0),
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    items: formData.items.map((item) => ({
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      uom: item.uom,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      discountPercent: Number(item.discountRate || 0),
      taxRate: getEffectiveTaxRate(item.taxRate, formData.taxRate),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
      return;
    }
    try {
      setSubmitting(true);
      const payload = buildPayload();
      if (isEdit) {
        await salesQuotationService.updateQuotation(id, payload);
        if (formData.status && formData.status !== originalStatus) {
          await salesQuotationService.changeStatus(id, formData.status);
        }
        toast.success("Đã cập nhật báo giá");
      } else {
        const created = await salesQuotationService.createQuotation(payload);
        const newId = created?.quotationId ?? created?.id;
        if (newId && formData.status && formData.status !== "Draft") {
          await salesQuotationService.changeStatus(newId, formData.status);
        }
        toast.success("Đã tạo báo giá");
      }
      navigate("/sales/quotations");
    } catch (error) {
      console.error("Không thể lưu báo giá:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể lưu báo giá";
      toast.error(message);
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
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Chỉnh sửa báo giá" : "Tạo báo giá mới"}
            </h1>
            <p className="text-gray-500">
              Nhập thông tin chung và danh sách sản phẩm báo giá
            </p>
          </div>
          <button
            onClick={() => navigate("/sales/quotations")}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin báo giá
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Số báo giá</label>
                  <input
                    type="text"
                    value={formData.quotationNo}
                    onChange={(e) =>
                      handleInputChange("quotationNo", e.target.value)
                    }
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="Ví dụ: SQ-20231125-0001"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Khách hàng <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="mt-1"
                    placeholder="Chọn khách hàng"
                    value={customers.find(
                      (opt) => opt.value === formData.customerId
                    )}
                    onChange={(option) =>
                      handleInputChange("customerId", option?.value || null)
                    }
                    options={customers}
                    isClearable
                  />
                  {validationErrors.customerId && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.customerId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Ngày báo giá <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={
                      formData.quotationDate
                        ? new Date(formData.quotationDate)
                        : null
                    }
                    onChange={(date) => handleDateChange("quotationDate", date)}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                  {validationErrors.quotationDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.quotationDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Hạn báo giá</label>
                  <DatePicker
                    selected={
                      formData.validUntil ? new Date(formData.validUntil) : null
                    }
                    onChange={(date) => handleDateChange("validUntil", date)}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    minDate={
                      formData.quotationDate
                        ? new Date(formData.quotationDate)
                        : null
                    }
                  />
                  {validationErrors.validUntil && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.validUntil}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Điều khoản thanh toán</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) =>
                      handleInputChange("paymentTerms", e.target.value)
                    }
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="VD: Thanh toán trong 30 ngày"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Điều khoản giao hàng</label>
                  <input
                    type="text"
                    value={formData.deliveryTerms}
                    onChange={(e) =>
                      handleInputChange("deliveryTerms", e.target.value)
                    }
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="VD: Giao tại kho khách hàng"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Ghi chú</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="Thông tin bổ sung cho báo giá"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-600">Thuế (%)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.taxRate}
                  onChange={(e) =>
                    handleInputChange("taxRate", e.target.value)
                  }
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="border-t pt-4 space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold">
                    {currencyFormatter(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Chiết khấu dòng</span>
                  <span>{currencyFormatter(totals.discountTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế</span>
                  <span>{currencyFormatter(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Tổng cộng</span>
                  <span>{currencyFormatter(totals.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách sản phẩm
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                    <th className="px-4 py-3 text-right">Chiết khấu (%)</th>
                    <th className="px-4 py-3 text-right">Thuế (%)</th>
                    <th className="px-4 py-3 text-right">Tạm tính</th>
                    <th className="px-4 py-3 text-center">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formData.items.map((item, index) => {
                    const baseTotal =
                      Number(item.quantity || 0) * Number(item.unitPrice || 0);
                    const discountRate = Number(item.discountRate || 0);
                    const lineDiscount = (baseTotal * discountRate) / 100;
                    const taxable = Math.max(baseTotal - lineDiscount, 0);
                    const lineTax =
                      (taxable * Number(item.taxRate || formData.taxRate || 0)) /
                      100;
                    const lineGrandTotal = taxable + lineTax;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 w-64">
                          <Select
                            placeholder="Chọn sản phẩm"
                            value={products.find(
                              (opt) => opt.value === item.productId
                            )}
                            onChange={(option) =>
                              handleProductSelect(index, option)
                            }
                            options={products}
                            isClearable
                          />
                          {validationErrors.itemDetails?.[index]?.productId && (
                            <p className="text-xs text-red-600 mt-1">
                              {validationErrors.itemDetails[index].productId}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.uom}
                            onChange={(e) =>
                              handleItemChange(index, "uom", e.target.value)
                            }
                            className="w-24 border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                            className="w-24 border rounded px-2 py-1 text-right"
                          />
                          {validationErrors.itemDetails?.[index]?.quantity && (
                            <p className="text-xs text-red-600 mt-1">
                              {validationErrors.itemDetails[index].quantity}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumberDisplay(item.unitPrice)}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unitPrice",
                                normalizeNumberInput(e.target.value)
                              )
                            }
                            className="w-32 border rounded px-3 py-1 text-right tracking-wide"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.discountRate}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "discountRate",
                                e.target.value
                              )
                            }
                            className="w-28 border rounded px-2 py-1 text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemChange(index, "taxRate", e.target.value)
                            }
                            className="w-24 border rounded px-2 py-1 text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {currencyFormatter(lineGrandTotal)}
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
            {validationErrors.items && (
              <p className="text-sm text-red-600 px-6 py-3">
                {validationErrors.items}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales/quotations")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
