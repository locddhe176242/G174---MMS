import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { salesQuotationService } from "../../../../api/salesQuotationService";
import { customerService } from "../../../../api/customerService";
import { getProducts } from "../../../../api/productService";

const defaultItem = () => ({
  productId: null,
  productCode: "",
  productName: "",
  uom: "",
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

export default function SalesQuotationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customerId: "",
    quotationDate: new Date(),
    validUntil: "",
    paymentTerms: "",
    deliveryTerms: "",
    headerDiscount: 0,
    notes: "",
    items: [defaultItem()],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCustomers();
    loadProductsList();
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadQuotation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomersWithPagination(0, 100, "createdAt,desc");
      const list = response.content || [];
      setCustomers(
        list.map((c) => ({
          value: c.customerId || c.id,
          label: `${c.customerCode || ""} - ${c.firstName || ""} ${c.lastName || ""}`,
        }))
      );
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Không thể tải danh sách khách hàng");
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

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const data = await salesQuotationService.getQuotationById(id);
      setFormData({
        customerId: data.customerId,
        quotationDate: data.quotationDate ? new Date(data.quotationDate) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : "",
        paymentTerms: data.paymentTerms || "",
        deliveryTerms: data.deliveryTerms || "",
        headerDiscount: data.headerDiscount || 0,
        notes: data.notes || "",
        items: (data.items || []).map((item) => {
          const qty = Number(item.quantity || 0);
          const unitPrice = Number(item.unitPrice || 0);
          const base = qty * unitPrice;
          const discountValue = Number(item.discountAmount || 0);
          const discountPercent = base > 0 ? Math.min((discountValue / base) * 100, 100) : 0;
          return {
            productId: item.productId,
            productCode: item.productCode || "",
            productName: item.productName || "",
            uom: item.uom || "",
            quantity: qty || 1,
            unitPrice: unitPrice || 0,
            discountPercent,
            taxRate: item.taxRate || 0,
            note: item.note || "",
          };
        }),
      });
    } catch (error) {
      console.error("Error loading quotation:", error);
      toast.error("Không thể tải báo giá");
    } finally {
      setLoading(false);
    }
  };

  const totalValue = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const discountPercent = Number(item.discountPercent || 0);
      const taxRate = Number(item.taxRate || 0);
      const discountValue = Math.min(qty * unitPrice * (discountPercent / 100), qty * unitPrice);
      const base = Math.max(qty * unitPrice - discountValue, 0);
      const tax = base * (taxRate / 100);
      return sum + base + tax;
    }, 0);
  }, [formData.items]);

  const handleSelectCustomer = (option) => {
    setFormData((prev) => ({ ...prev, customerId: option ? option.value : "" }));
  };

  const handleProductChange = (index, option) => {
    setFormData((prev) => {
      const next = [...prev.items];
      if (option) {
        next[index] = {
          ...next[index],
          productId: option.value,
          productCode: option.data?.sku || "",
          productName: option.data?.name || "",
          uom: option.data?.uom || "",
          unitPrice: option.data?.sellingPrice || 0,
        };
      } else {
        next[index] = {
          ...next[index],
          productId: null,
          productCode: "",
          productName: "",
          uom: "",
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
      newErrors.customerId = "Vui lòng chọn khách hàng";
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
        if (Number(item.discountPercent || 0) < 0) {
          e.discountPercent = "Chiết khấu >= 0";
        } else if (Number(item.discountPercent || 0) > 100) {
          e.discountPercent = "Chiết khấu tối đa 100%";
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
      quotationDate: formData.quotationDate
        ? formData.quotationDate.toISOString().slice(0, 10)
        : null,
      validUntil: formData.validUntil
        ? formData.validUntil.toISOString().slice(0, 10)
        : null,
      paymentTerms: formData.paymentTerms || null,
      deliveryTerms: formData.deliveryTerms || null,
      headerDiscount: Number(formData.headerDiscount || 0),
      notes: formData.notes || null,
      items: formData.items.map((item) => ({
        productId: item.productId,
        productCode: item.productCode || null,
        productName: item.productName || null,
        uom: item.uom || null,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        discountPercent: Number(item.discountPercent || 0),
        taxRate: Number(item.taxRate || 0),
        note: item.note || null,
      })),
    };

    try {
      setLoading(true);
      if (isEdit) {
        await salesQuotationService.updateQuotation(id, payload);
        toast.success("Đã cập nhật báo giá");
      } else {
        await salesQuotationService.createQuotation(payload);
        toast.success("Đã tạo báo giá");
      }
      navigate("/sales/quotations");
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Lỗi lưu báo giá";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Cập nhật Sales Quotation" : "Tạo Sales Quotation"}
            </h1>
            <p className="text-gray-500">
              Nhập thông tin báo giá và danh sách sản phẩm
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
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khách hàng <span className="text-red-500">*</span>
              </label>
              <Select
                value={customers.find((c) => c.value === formData.customerId) || null}
                onChange={handleSelectCustomer}
                options={customers}
                placeholder="Chọn khách hàng"
              />
              {errors.customerId && (
                <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày báo giá
                </label>
                <DatePicker
                  selected={formData.quotationDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, quotationDate: date }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hạn báo giá
                </label>
                <DatePicker
                  selected={formData.validUntil}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, validUntil: date }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điều khoản thanh toán
              </label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="VD: 30% upfront, 70% on delivery"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điều khoản giao hàng
              </label>
              <input
                type="text"
                value={formData.deliveryTerms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deliveryTerms: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="VD: FOB, giao tại kho khách"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chiết khấu tổng (VND)
              </label>
              <input
                type="number"
                min="0"
                value={formData.headerDiscount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    headerDiscount: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Danh sách sản phẩm
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Thêm dòng
              </button>
            </div>
            {errors.items && (
              <p className="text-red-500 text-sm mb-2">{errors.items}</p>
            )}
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
                      Đơn vị
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
                    const discount = Math.min(
                      qty * price * (discountPercent / 100),
                      qty * price
                    );
                    const taxRate = Number(item.taxRate || 0);
                    const base = Math.max(qty * price - discount, 0);
                    const tax = base * (taxRate / 100);
                    const lineTotal = base + tax;
                    return (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-3 py-2">
                          <Select
                            value={
                              products.find((p) => p.value === item.productId) || null
                            }
                            onChange={(opt) => handleProductChange(index, opt)}
                            options={products}
                            placeholder="Chọn sản phẩm"
                            className="mb-2"
                            isClearable
                          />
                          {itemError.productId && (
                            <p className="text-red-500 text-xs">{itemError.productId}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.uom}
                            onChange={(e) => handleItemChange(index, "uom", e.target.value)}
                            className="w-full px-2 py-1 border rounded"
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
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(index, "unitPrice", Number(e.target.value))
                            }
                            className="w-28 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "discountPercent",
                                Number(e.target.value)
                              )
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Tổng giá trị dự kiến</div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalValue - Number(formData.headerDiscount || 0))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/sales/quotations")}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo báo giá"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

