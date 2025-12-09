import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { salesOrderService } from "../../../../api/salesOrderService";
import { salesQuotationService } from "../../../../api/salesQuotationService";
import { customerService } from "../../../../api/customerService";
import { getProducts } from "../../../../api/productService";
import { warehouseService } from "../../../../api/warehouseService";

const defaultItem = () => ({
  productId: null,
  warehouseId: null,
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  taxRate: 0,
  note: "",
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

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

export default function SalesOrderForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [quotationSearch, setQuotationSearch] = useState("");
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [globalTaxRate, setGlobalTaxRate] = useState("");
  const [formData, setFormData] = useState({
    orderNo: "",
    customerId: "",
    salesQuotationId: "",
    orderDate: new Date(),
    shippingAddress: "",
    paymentTerms: "",
    notes: "",
    items: [defaultItem()],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCustomers();
    loadProductsList();
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadOrder();
    } else {
      generateTempOrderNo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      const res = await customerService.getCustomersWithPagination(0, 100, "createdAt,desc");
      const list = res.content || [];
      setCustomers(
        list.map((c) => ({
          value: c.customerId || c.id,
          label: getCustomerLabel(c),
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải khách hàng");
    }
  };

  const loadProductsList = async () => {
    try {
      const response = await getProducts();
      const list = Array.isArray(response) ? response : response?.content || [];
      setProducts(
        list.map((p) => ({
          value: p.productId || p.id,
          label: `${p.sku || ""} - ${p.name || ""}`,
          data: p,
        }))
      );
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await warehouseService.getAllWarehouses();
      setWarehouses(
        (res || []).map((w) => ({
          value: w.warehouseId || w.id,
          label: `${w.code || ""} - ${w.name}`,
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách kho");
    }
  };

  const fetchQuotations = async () => {
    try {
      setQuotationLoading(true);
      const response = await salesQuotationService.getAllQuotations();
      const list = Array.isArray(response) ? response : response?.content || response?.data || [];
      setQuotations(list);
    } catch (error) {
      console.error("Không thể tải danh sách báo giá:", error);
      toast.error("Không thể tải danh sách báo giá");
    } finally {
      setQuotationLoading(false);
    }
  };

  useEffect(() => {
    if (quotationModalOpen && quotations.length === 0) {
      fetchQuotations();
    }
  }, [quotationModalOpen]);

  const filteredQuotations = useMemo(() => {
    const term = quotationSearch.trim().toLowerCase();
    return quotations.filter((quotation) => {
      const matchesKeyword =
        !term ||
        (quotation.quotationNo || "").toLowerCase().includes(term) ||
        (quotation.customerName || "").toLowerCase().includes(term);
      return matchesKeyword;
    });
  }, [quotations, quotationSearch]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await salesOrderService.getOrderById(id);
      setFormData({
        orderNo: data.orderNo || "",
        customerId: data.customerId,
        salesQuotationId: data.salesQuotationId || "",
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        shippingAddress: data.shippingAddress || "",
        paymentTerms: data.paymentTerms || "",
        notes: data.notes || "",
        items: (data.items || []).map((item) => ({
          productId: item.productId,
          warehouseId: item.warehouseId || null,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          discountPercent: item.discountPercent || 0,
          taxRate: item.taxRate || 0,
          note: item.note || "",
        })),
      });
      const uniqueTaxRates = new Set((data.items || []).map((item) => item.taxRate ?? ""));
      if (uniqueTaxRates.size === 1) {
        const [onlyRate] = Array.from(uniqueTaxRates);
        setGlobalTaxRate(onlyRate ?? "");
      } else {
        setGlobalTaxRate("");
      }
      if (data.quotationId) {
        setSelectedQuotation({
          value: data.quotationId,
          label: `Báo giá #${data.quotationId}`,
        });
      } else {
        setSelectedQuotation(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải đơn bán hàng");
    } finally {
      setLoading(false);
    }
  };

  const generateTempOrderNo = () => {
    setFormData((prev) => {
      if (prev.orderNo) return prev;
      const timestamp = Date.now().toString().slice(-6);
      return {
        ...prev,
        orderNo: `SO-${timestamp}`,
      };
    });
  };

  const loadFromQuotation = async (quotationIdArg) => {
    const targetId = quotationIdArg || formData.salesQuotationId;
    if (!targetId) {
      toast.warn("Vui lòng chọn báo giá để chuyển sang đơn hàng");
      return;
    }
    try {
      setLoading(true);
      const quotation = await salesQuotationService.getQuotationById(targetId);
      setFormData((prev) => ({
        ...prev,
        salesQuotationId: quotation.quotationId || targetId,
        customerId: quotation.customerId,
        paymentTerms: quotation.paymentTerms || "",
        notes: quotation.notes || "",
        items: (quotation.items || []).map((item) => ({
          productId: item.productId,
          warehouseId: null,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          discountPercent: 0,
          taxRate: item.taxRate || 0,
          note: item.note || "",
        })),
      }));
      setSelectedQuotation({
        value: quotation.quotationId || targetId,
        label: `${quotation.quotationNo || `Báo giá #${quotation.quotationId || targetId}`} - ${
          quotation.customerName || "Không rõ khách hàng"
        }`,
      });
      const uniqueTaxRates = new Set((quotation.items || []).map((item) => item.taxRate ?? ""));
      if (uniqueTaxRates.size === 1) {
        const [onlyRate] = Array.from(uniqueTaxRates);
        setGlobalTaxRate(onlyRate ?? "");
      } else {
        setGlobalTaxRate("");
      }
      toast.success("Đã tải dữ liệu từ báo giá");
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải báo giá");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return formData.items.reduce(
      (acc, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const gross = qty * price;
        const discountPercent = Number(item.discountPercent || 0);
        const taxRate = getEffectiveTaxRate(item.taxRate, globalTaxRate);
        const discount = Math.min((gross * discountPercent) / 100, gross);
        const taxable = Math.max(gross - discount, 0);
        const tax = taxable * (taxRate / 100);
        acc.gross += gross;
        acc.discount += discount;
        acc.subtotal += taxable;
        acc.tax += tax;
        return acc;
      },
      { gross: 0, discount: 0, subtotal: 0, tax: 0 }
    );
  }, [formData.items, globalTaxRate]);

  const totalValue = totals.subtotal + totals.tax;

  const handleCustomerChange = (option) => {
    setFormData((prev) => ({ ...prev, customerId: option ? option.value : "" }));
  };

  const handleGlobalTaxChange = (value) => {
    const numericValue = value === "" ? "" : parseFloat(value);
    setGlobalTaxRate(numericValue === "" || Number.isNaN(numericValue) ? "" : numericValue);
    if (value === "" || Number.isNaN(numericValue)) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        taxRate: numericValue || 0,
      })),
    }));
  };

  const handleQuotationSelectFromModal = (quotation) => {
    setQuotationModalOpen(false);
    if (!quotation?.quotationId) return;
    loadFromQuotation(quotation.quotationId);
  };

  const clearSelectedQuotation = () => {
    setSelectedQuotation(null);
    setFormData((prev) => ({ ...prev, salesQuotationId: "" }));
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

  const handleItemSelect = (index, option) => {
    setFormData((prev) => {
      const next = [...prev.items];
      if (option) {
        const product = option.data || option.product || {};
        const productPrice = getProductPrice(product);
        next[index] = {
          ...next[index],
          productId: option.value,
          unitPrice: productPrice,
          quantity: next[index].quantity || 1,
        };
      } else {
        next[index] = {
          ...next[index],
          productId: null,
          unitPrice: 0,
        };
      }
      return { ...prev, items: next };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.items];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, items: next };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, defaultItem()],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      if (prev.items.length === 1) return prev;
      const next = [...prev.items];
      next.splice(index, 1);
      return { ...prev, items: next };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customerId) {
      newErrors.customerId = "Chọn khách hàng";
    }
    if (!formData.items || formData.items.length === 0) {
      newErrors.items = "Cần ít nhất một dòng sản phẩm";
    } else {
      const itemErrors = formData.items.map((item) => {
        const e = {};
        if (!item.productId) {
          e.productId = "Chọn sản phẩm";
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          e.quantity = "Số lượng > 0";
        }
        if (Number(item.discountPercent || 0) < 0 || Number(item.discountPercent || 0) > 100) {
          e.discountPercent = "Chiết khấu 0-100%";
        }
        if (Number(item.taxRate || 0) < 0) {
          e.taxRate = "Thuế >= 0";
        }
        return e;
      });
      if (itemErrors.some((e) => Object.keys(e).length > 0)) {
        newErrors.itemDetails = itemErrors;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra thông tin");
      return;
    }
    const payload = {
      customerId: formData.customerId,
      salesQuotationId: formData.salesQuotationId || null,
      orderDate: formData.orderDate ? formData.orderDate.toISOString() : null,
      shippingAddress: formData.shippingAddress || null,
      paymentTerms: formData.paymentTerms || null,
      notes: formData.notes || null,
      items: formData.items.map((item) => ({
        productId: item.productId,
        warehouseId: item.warehouseId || null,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        discountPercent: Number(item.discountPercent || 0),
        taxRate: getEffectiveTaxRate(item.taxRate, globalTaxRate),
        note: item.note || null,
      })),
    };
    try {
      setSubmitting(true);
      if (isEdit) {
        await salesOrderService.updateOrder(id, payload);
        toast.success("Đã cập nhật đơn bán hàng");
      } else {
        await salesOrderService.createOrder(payload);
        toast.success("Đã tạo đơn bán hàng");
      }
      navigate("/sales/orders");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Lỗi lưu đơn bán hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Cập nhật đơn bán hàng" : "Tạo đơn bán hàng"}
            </h1>
            <p className="text-gray-500">Nhập thông tin đơn hàng và danh sách sản phẩm</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/sales/orders")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Thông tin đơn hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Số đơn</label>
                  <input
                    type="text"
                    readOnly
                    value={
                      formData.orderNo ||
                      (isEdit ? "—" : "Sẽ được tạo tự động sau khi lưu")
                    }
                    className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Khách hàng <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="mt-1"
                    value={customers.find((c) => c.value === formData.customerId) || null}
                    onChange={handleCustomerChange}
                    options={customers}
                    placeholder="Chọn khách hàng"
                    isClearable
                  />
                  {errors.customerId && (
                    <p className="text-xs text-red-500 mt-1">{errors.customerId}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Báo giá liên quan</label>
                  <div className="mt-1 flex flex-col lg:flex-row gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        selectedQuotation?.label ||
                        (formData.salesQuotationId
                          ? `Báo giá #${formData.salesQuotationId}`
                          : "")
                      }
                      placeholder="Chưa chọn báo giá"
                      className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setQuotationModalOpen(true)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                      >
                        Chọn
                      </button>
                      {selectedQuotation && (
                        <button
                          type="button"
                          onClick={clearSelectedQuotation}
                          className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-red-600"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="text-sm text-gray-600">Ngày tạo đơn</label>
                    <DatePicker
                      selected={formData.orderDate}
                      onChange={(date) => setFormData((prev) => ({ ...prev, orderDate: date }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      wrapperClassName="mt-1 w-full"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Điều khoản thanh toán</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))
                      }
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      placeholder="VD: Thanh toán trong 30 ngày"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Địa chỉ giao hàng</label>
                    <input
                      type="text"
                      value={formData.shippingAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, shippingAddress: e.target.value }))
                      }
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      placeholder="Nhập địa chỉ giao hàng"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Ghi chú</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      placeholder="Thông tin bổ sung cho đơn hàng"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Tổng quan tiền tệ</h2>
              <label className="text-sm text-gray-600">Thuế (%)</label>
              <input
                type="number"
                min="0"
                value={globalTaxRate}
                onChange={(e) => handleGlobalTaxChange(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                placeholder="Áp dụng thuế chung cho toàn bộ sản phẩm"
              />
              <hr className="my-3" />
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold">{formatCurrency(totals.gross)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chiết khấu dòng</span>
                  <span>{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Thêm dòng
              </button>
            </div>

            {errors.items && <p className="text-red-500 text-sm mb-2">{errors.items}</p>}

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Sản phẩm
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Kho
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lượng
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Đơn giá
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Chiết khấu (%)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Thuế (%)
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Thành tiền
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const itemError = errors.itemDetails?.[index] || {};
                    const qty = Number(item.quantity || 0);
                    const price = Number(item.unitPrice || 0);
                    const discountPercent = Number(item.discountPercent || 0);
                    const taxRate = getEffectiveTaxRate(item.taxRate, globalTaxRate);
                    const discount = Math.min((qty * price * discountPercent) / 100, qty * price);
                    const base = Math.max(qty * price - discount, 0);
                    const tax = base * (taxRate / 100);
                    const lineTotal = base + tax;
                    return (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-3 py-2">
                          <Select
                            value={products.find((p) => p.value === item.productId) || null}
                            onChange={(opt) => handleItemSelect(index, opt)}
                            options={products}
                            placeholder="Chọn sản phẩm"
                            isClearable
                          />
                          {itemError.productId && (
                            <p className="text-red-500 text-xs">{itemError.productId}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={warehouses.find((w) => w.value === item.warehouseId) || null}
                            onChange={(opt) =>
                              handleItemChange(index, "warehouseId", opt ? opt.value : null)
                            }
                            options={warehouses}
                            placeholder="Chọn kho (tuỳ chọn)"
                            isClearable
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", Number(e.target.value))
                            }
                            className="w-24 px-2 py-1 border rounded"
                          />
                          {itemError.quantity && (
                            <p className="text-red-500 text-xs">{itemError.quantity}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
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
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) =>
                              handleItemChange(index, "discountPercent", Number(e.target.value))
                            }
                            className="w-24 px-2 py-1 border rounded"
                          />
                          {itemError.discountPercent && (
                            <p className="text-red-500 text-xs">{itemError.discountPercent}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemChange(index, "taxRate", Number(e.target.value))
                            }
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:underline"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Tổng dự kiến</div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalValue)}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/sales/orders")}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo đơn bán hàng"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <QuotationPickerModal
        isOpen={quotationModalOpen}
        onClose={() => setQuotationModalOpen(false)}
        quotations={filteredQuotations}
        loading={quotationLoading}
        onSelect={handleQuotationSelectFromModal}
        searchTerm={quotationSearch}
        onSearchChange={setQuotationSearch}
      />
    </div>
  );
}

const QuotationPickerModal = ({
  isOpen,
  onClose,
  quotations,
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
            <h3 className="text-lg font-semibold text-gray-900">Chọn báo giá</h3>
            <p className="text-sm text-gray-500">Tìm và chuyển báo giá sang đơn bán hàng</p>
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
            placeholder="Tìm theo số báo giá hoặc khách hàng..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách báo giá...</div>
          ) : quotations.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có báo giá nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số báo giá
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày báo giá
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tổng tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotations.map((quotation) => (
                  <tr
                    key={quotation.quotationId}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => onSelect(quotation)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {quotation.quotationNo || `BQ-${quotation.quotationId}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{quotation.customerName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{quotation.status || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {quotation.quotationDate
                        ? new Date(quotation.quotationDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(quotation.totalAmount)}
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