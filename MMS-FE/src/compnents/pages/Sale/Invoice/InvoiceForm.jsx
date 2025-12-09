import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { invoiceService } from "../../../../api/invoiceService";
import { deliveryService } from "../../../../api/deliveryService";
import { salesOrderService } from "../../../../api/salesOrderService";

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

const formatNumber = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat("vi-VN").format(num);
};

const buildPriceMapFromSalesOrder = (so) => {
  if (!so?.items) return {};
  const map = {};
  so.items.forEach((it) => {
    const key = it.soiId || it.id || it.salesOrderItemId;
    const priceObj = {
      unitPrice: toNumber(it.unitPrice || it.unit_price, 0),
      discountPercent: toNumber(it.discountPercent || it.discount_percent, 0),
      taxRate: toNumber(it.taxRate || it.tax_rate, 0),
    };
    if (key) map[key] = priceObj;
    const pKey = it.productId || it.product_id || it.product?.productId;
    if (pKey && !map[pKey]) map[pKey] = priceObj;
    const pCode = it.productCode || it.product_code || it.product?.sku;
    if (pCode && !map[pCode]) map[pCode] = priceObj;
  });
  return map;
};

const mapDeliveryItems = (delivery, priceMap = {}) => {
  if (!delivery?.items) return [];
  return delivery.items
    .filter((it) => Number(it.deliveredQty || it.delivered_qty || 0) > 0)
    .map((it) => {
      const soiId = it.soiId || it.soi_id || it.salesOrderItemId || it.salesOrderItem?.soiId;
      const pId = it.productId || it.product_id || it.product?.productId;
      const pCode = it.productCode || it.product_code || it.product?.sku;
      const priceInfo = priceMap[soiId] || priceMap[pId] || priceMap[pCode] || {};

      const unitPrice =
        toNumber(it.unitPrice || it.unit_price) ||
        toNumber(it.salesOrderItem?.unitPrice || it.salesOrderItem?.unit_price) ||
        toNumber(priceInfo.unitPrice, 0);
      const discountPercent =
        toNumber(it.discountPercent || it.discount_percent, 0) ||
        toNumber(it.salesOrderItem?.discountPercent || it.salesOrderItem?.discount_percent, 0) ||
        toNumber(priceInfo.discountPercent, 0);
      const taxRate =
        toNumber(it.taxRate || it.tax_rate || it.salesOrderItem?.taxRate || it.salesOrderItem?.tax_rate, 0) ||
        toNumber(priceInfo.taxRate, 0);

      return {
        product_code:
          it.productCode || it.product_code || it.productSku || it.product?.sku || "",
        product_name: it.productName || it.product_name || it.product?.name || "",
        uom: it.uom || "",
        quantity: toNumber(it.deliveredQty || it.delivered_qty || 0, 0),
        unit_price: unitPrice,
        discount_percent: discountPercent,
        tax_rate: taxRate,
        description:
          it.productName || it.product_name || it.product?.name || it.product?.sku || "",
      };
    });
};

const calcItemTotals = (item) => {
  const qty = toNumber(item.quantity);
  const price = toNumber(item.unit_price);
  const ck = toNumber(item.discount_percent);
  const vat = toNumber(item.tax_rate);
  const subtotal = qty * price;
  const discount = subtotal * (ck / 100);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (vat / 100);
  const lineTotal = afterDiscount + tax;
  return { subtotal, discount, afterDiscount, tax, lineTotal };
};

// ===== Totals memo =====
const useTotals = (items) => {
  const subtotal = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, it) => sum + calcItemTotals(it).subtotal, 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, it) => sum + calcItemTotals(it).discount, 0);
  }, [items]);

  const subtotalAfterDiscount = useMemo(
    () => subtotal - totalDiscount,
    [subtotal, totalDiscount]
  );

  const taxAmount = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, it) => sum + calcItemTotals(it).tax, 0);
  }, [items]);

  const totalAmount = useMemo(
    () => subtotalAfterDiscount + taxAmount,
    [subtotalAfterDiscount, taxAmount]
  );

  return { subtotal, totalDiscount, subtotalAfterDiscount, taxAmount, totalAmount };
};

export default function InvoiceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryId: "",
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    notes: "",
    items: [],
  });
  const [errors, setErrors] = useState({});
  const { subtotal, subtotalAfterDiscount, taxAmount, totalAmount } = useTotals(formData.items);

  useEffect(() => {
    if (!isEdit) {
      loadDeliveries();
    } else {
      loadInvoice();
    }
  }, [id, isEdit]);

  const loadDeliveries = async () => {
    try {
      setDeliveryLoading(true);
      const response = await deliveryService.getAllDeliveries({ status: "Delivered" });
      const list = Array.isArray(response) ? response : response?.content || [];
      setDeliveries(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Delivery");
    } finally {
      setDeliveryLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryModalOpen && deliveries.length === 0) {
      loadDeliveries();
    }
  }, [deliveryModalOpen]);

  const filteredDeliveries = useMemo(() => {
    const term = deliverySearch.trim().toLowerCase();
    return deliveries.filter((d) => {
      const matchesKeyword =
        !term ||
        (d.deliveryNo || "").toLowerCase().includes(term) ||
        (d.customerName || "").toLowerCase().includes(term) ||
        (d.salesOrderNo || "").toLowerCase().includes(term);
      return matchesKeyword;
    });
  }, [deliveries, deliverySearch]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(id);
      let priceMap = {};
      const soIdFromInvoice =
        data.salesOrderId ||
        data.salesOrder?.soId ||
        data.salesOrder?.id ||
        data.salesOrder?.so_id ||
        data.salesOrder?.salesOrderId;
      if (soIdFromInvoice) {
        try {
          const soData = await salesOrderService.getOrderById(soIdFromInvoice);
          priceMap = buildPriceMapFromSalesOrder(soData);
        } catch (err) {
          console.warn("Không thể load Sales Order để map giá:", err);
        }
      }
      const mappedItems =
        (data.items || []).map((it) => ({
          product_code: it.productCode || it.product_code || "",
          product_name: it.productName || it.product_name || it.description || "",
          uom: it.uom || "",
          quantity: toNumber(it.quantity),
          unit_price:
            toNumber(it.unitPrice || it.unit_price) ||
            toNumber(priceMap[it.salesOrderItemId || it.productId]?.unitPrice, 0),
          discount_percent:
            toNumber(it.discountPercent || it.discount_percent || 0) ||
            toNumber(priceMap[it.salesOrderItemId || it.productId]?.discountPercent, 0),
          tax_rate:
            toNumber(it.taxRate || it.tax_rate || 0) ||
            toNumber(priceMap[it.salesOrderItemId || it.productId]?.taxRate, 0),
          description: it.description || it.productName || it.product_code || "",
          delivery_item_id: it.deliveryItemId || it.delivery_item_id || null,
          sales_order_item_id: it.salesOrderItemId || it.sales_order_item_id || null,
          product_id: it.productId || it.product_id || null,
        })) || [];

      setFormData({
        deliveryId: data.deliveryId || "",
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        notes: data.notes || "",
        items: mappedItems.length > 0 ? mappedItems : mapDeliveryItems(data.delivery) || [],
      });
      if (data.deliveryId) {
        const delivery = await deliveryService.getDeliveryById(data.deliveryId);
        setSelectedDelivery(delivery);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải hóa đơn");
      navigate("/sales/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySelectFromModal = async (delivery) => {
    setDeliveryModalOpen(false);
    if (!delivery?.deliveryId) return;
    try {
      setLoading(true);
      const fullDelivery = await deliveryService.getDeliveryById(delivery.deliveryId);
      let priceMap = {};
      const soIdFromDelivery =
        fullDelivery.salesOrderId ||
        fullDelivery.salesOrder?.soId ||
        fullDelivery.salesOrder?.id ||
        fullDelivery.salesOrder?.so_id ||
        fullDelivery.salesOrder?.salesOrderId ||
        fullDelivery.items?.[0]?.salesOrderItem?.soId ||
        fullDelivery.items?.[0]?.salesOrderItem?.salesOrderId;
      if (soIdFromDelivery) {
        try {
          const soData = await salesOrderService.getOrderById(soIdFromDelivery);
          priceMap = buildPriceMapFromSalesOrder(soData);
        } catch (err) {
          console.warn("Không thể load Sales Order để map giá:", err);
        }
      }
      setSelectedDelivery(fullDelivery);
      setFormData((prev) => ({
        ...prev,
        deliveryId: delivery.deliveryId,
        items: mapDeliveryItems(fullDelivery, priceMap),
      }));
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin Delivery");
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.deliveryId) newErrors.deliveryId = "Vui lòng chọn Delivery";
    if (!formData.invoiceDate) newErrors.invoiceDate = "Vui lòng chọn ngày xuất hóa đơn";

    const itemErrors = (formData.items || []).map((it) => {
      const e = {};
      if (!it.product_code) e.product_code = "Nhập mã SP";
      if (!it.description) e.description = "Nhập mô tả";
      if (toNumber(it.quantity) <= 0) e.quantity = "SL > 0";
      if (toNumber(it.unit_price) < 0) e.unit_price = "Đơn giá >= 0";
      if (toNumber(it.discount_percent) < 0) e.discount_percent = "CK >= 0";
      return e;
    });
    if (itemErrors.some((e) => Object.keys(e).length > 0)) newErrors.itemDetails = itemErrors;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        // Không cho phép chỉnh sửa invoice gốc: hướng dẫn tạo Credit Note
        toast.error(
          "Hóa đơn gốc không được chỉnh sửa. Vui lòng tạo Credit Note (hóa đơn điều chỉnh) để điều chỉnh hóa đơn này."
        );
        setSubmitting(false);
        return;
      } else {
        // Tạo invoice từ delivery
        await invoiceService.createInvoiceFromDelivery(formData.deliveryId);
        toast.success("Đã tạo hóa đơn");
      }
      navigate("/sales/invoices");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể lưu hóa đơn");
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
                  {isEdit ? "Cập nhật hóa đơn" : "Tạo hóa đơn mới"}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {isEdit ? "Cập nhật thông tin hóa đơn" : "Tạo hóa đơn từ Delivery đã giao hàng"}
                </p>
              </div>
              <button
                onClick={() => navigate("/sales/invoices")}
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
                  Delivery (Đã giao hàng) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedDelivery?.deliveryNo || ""}
                    readOnly
                    placeholder="Chọn Delivery đã giao hàng"
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setDeliveryModalOpen(true)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                  >
                    Chọn
                  </button>
                  {selectedDelivery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDelivery(null);
                        setFormData((prev) => ({ ...prev, deliveryId: "", items: [] }));
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-red-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                {errors.deliveryId && (
                  <p className="text-red-500 text-xs mt-1">{errors.deliveryId}</p>
                )}
                {selectedDelivery && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                    <div>Khách hàng: {selectedDelivery.customerName || "—"}</div>
                    <div>Sales Order: {selectedDelivery.salesOrderNo || "—"}</div>
                    <div>Số sản phẩm: {selectedDelivery.items?.length || 0}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày xuất hóa đơn <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  selected={formData.invoiceDate}
                  onChange={(date) => handleDateChange("invoiceDate", date)}
                  dateFormat="dd/MM/yyyy"
                  disabled={!!formData.deliveryId}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    formData.deliveryId ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
                {errors.invoiceDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đến hạn thanh toán
                </label>
                <DatePicker
                  selected={formData.dueDate}
                  onChange={(date) => handleDateChange("dueDate", date)}
                  dateFormat="dd/MM/yyyy"
                  disabled={!!formData.deliveryId}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    formData.deliveryId ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã SP</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên SP</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ĐVT</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">CK (%)</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Thuế (%)</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.items || []).map((item, index) => {
                      const calc = calcItemTotals(item);
                      const itemErr = errors.itemDetails?.[index] || {};
                      const isDeliveryLoaded = !!formData.deliveryId;
                      return (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2 text-sm text-gray-700">{index + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.product_code || ""}
                              onChange={(e) =>
                                setFormData((prev) => {
                                  const items = [...prev.items];
                                  items[index] = { ...items[index], product_code: e.target.value };
                                  return { ...prev, items };
                                })
                              }
                              readOnly={isDeliveryLoaded}
                              disabled={isDeliveryLoaded}
                              className={`w-full px-2 py-1 border rounded ${
                                itemErr.product_code ? "border-red-500" : "border-gray-300"
                              } ${isDeliveryLoaded ? "bg-gray-100 cursor-not-allowed" : ""}`}
                              placeholder="Mã sản phẩm"
                            />
                            {itemErr.product_code && (
                              <p className="text-red-500 text-xs">{itemErr.product_code}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-sm text-gray-800">
                              {item.product_name || item.description || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.uom || ""}
                              onChange={(e) =>
                                setFormData((prev) => {
                                  const items = [...prev.items];
                                  items[index] = { ...items[index], uom: e.target.value };
                                  return { ...prev, items };
                                })
                              }
                              readOnly={isDeliveryLoaded}
                              disabled={isDeliveryLoaded}
                              className={`w-20 px-2 py-1 border rounded border-gray-300 ${
                                isDeliveryLoaded ? "bg-gray-100 cursor-not-allowed" : ""
                              }`}
                              placeholder="ĐVT"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                setFormData((prev) => {
                                  const items = [...prev.items];
                                  items[index] = { ...items[index], quantity: e.target.value };
                                  return { ...prev, items };
                                })
                              }
                              readOnly={isDeliveryLoaded}
                              disabled={isDeliveryLoaded}
                              className={`w-20 px-2 py-1 text-right border rounded ${
                                itemErr.quantity ? "border-red-500" : "border-gray-300"
                              } ${isDeliveryLoaded ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            />
                            {itemErr.quantity && (
                              <p className="text-red-500 text-xs text-left">{itemErr.quantity}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isDeliveryLoaded ? (
                              <div className="w-32 px-2 py-1 text-right text-sm font-medium text-gray-800">
                                {formatNumber(item.unit_price || 0)} ₫
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) =>
                                  setFormData((prev) => {
                                    const items = [...prev.items];
                                    items[index] = { ...items[index], unit_price: e.target.value };
                                    return { ...prev, items };
                                  })
                                }
                                className={`w-32 px-2 py-1 text-right border rounded ${
                                  itemErr.unit_price ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="0"
                              />
                            )}
                            {itemErr.unit_price && !isDeliveryLoaded && (
                              <p className="text-red-500 text-xs text-left">{itemErr.unit_price}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount_percent || 0}
                              onChange={(e) =>
                                setFormData((prev) => {
                                  const items = [...prev.items];
                                  items[index] = { ...items[index], discount_percent: e.target.value };
                                  return { ...prev, items };
                                })
                              }
                              readOnly={isDeliveryLoaded}
                              disabled={isDeliveryLoaded}
                              className={`w-20 px-2 py-1 text-right border rounded ${
                                itemErr.discount_percent ? "border-red-500" : "border-gray-300"
                              } ${isDeliveryLoaded ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            />
                            {itemErr.discount_percent && (
                              <p className="text-red-500 text-xs text-left">{itemErr.discount_percent}</p>
                            )}
                          </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.tax_rate || 0}
                                onChange={(e) =>
                                  setFormData((prev) => {
                                    const items = [...prev.items];
                                    items[index] = { ...items[index], tax_rate: e.target.value };
                                    return { ...prev, items };
                                  })
                                }
                                readOnly={isDeliveryLoaded}
                                disabled={isDeliveryLoaded}
                                className={`w-20 px-2 py-1 text-right border rounded border-gray-300 ${
                                  isDeliveryLoaded ? "bg-gray-100 cursor-not-allowed" : ""
                                }`}
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-gray-700 font-medium">
                            {formatCurrency(calc.lineTotal)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {!isDeliveryLoaded && (
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => {
                                    const items = [...prev.items];
                                    items.splice(index, 1);
                                    return { ...prev, items: items.length ? items : [] };
                                  })
                                }
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

              <div className="border rounded-lg overflow-hidden">
                <div className="flex justify-between px-4 py-2 text-sm text-gray-700">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-sm text-gray-700 border-t">
                  <span>Tổng sau chiết khấu sản phẩm:</span>
                  <span>{formatCurrency(subtotalAfterDiscount)}</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-sm text-gray-700 border-t">
                  <span>Thuế VAT:</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-sm font-semibold text-gray-900 border-t">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                readOnly={!!formData.deliveryId}
                disabled={!!formData.deliveryId}
                className={`w-full border rounded-lg px-3 py-2 ${
                  formData.deliveryId ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                placeholder="Nhập ghi chú (không bắt buộc)"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/sales/invoices")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submitting}
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

      <DeliveryPickerModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        deliveries={filteredDeliveries}
        loading={deliveryLoading}
        onSelect={handleDeliverySelectFromModal}
        searchTerm={deliverySearch}
        onSearchChange={setDeliverySearch}
      />
    </div>
  );
}

const DeliveryPickerModal = ({
  isOpen,
  onClose,
  deliveries,
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
            <h3 className="text-lg font-semibold text-gray-900">Chọn Delivery</h3>
            <p className="text-sm text-gray-500">Tìm và chọn Delivery đã giao hàng</p>
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
            placeholder="Tìm theo số Delivery, khách hàng hoặc Sales Order..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách Delivery...</div>
          ) : deliveries.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có Delivery nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sales Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày giao
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deliveries.map((d) => (
                  <tr
                    key={d.deliveryId}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => onSelect(d)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {d.deliveryNo || `DLV-${d.deliveryId}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{d.customerName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{d.salesOrderNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {d.actualDate
                        ? new Date(d.actualDate).toLocaleDateString("vi-VN")
                        : "—"}
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
