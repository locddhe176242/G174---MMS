import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { deliveryService } from "../../../../api/deliveryService";
import { salesOrderService } from "../../../../api/salesOrderService";
import { warehouseService } from "../../../../api/warehouseService";
import { getProducts } from "../../../../api/productService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

const defaultItem = () => ({
  salesOrderItemId: null,
  productId: null,
  warehouseId: null,
  plannedQty: 0,
  deliveredQty: 0,
  note: "",
});

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: "none",
    minHeight: "40px",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
};

const compactSelectStyles = {
  control: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: "none",
    minHeight: "36px",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
    },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 8px" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
};

export default function DeliveryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [salesOrderModalOpen, setSalesOrderModalOpen] = useState(false);
  const [salesOrderSearch, setSalesOrderSearch] = useState("");
  const [salesOrderLoading, setSalesOrderLoading] = useState(false);
  const [formData, setFormData] = useState({
    salesOrderId: "",
    warehouseId: "",
    plannedDate: new Date(),
    actualDate: null,
    shippingAddress: "",
    carrierName: "",
    trackingCode: "",
    notes: "",
    items: [defaultItem()],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadWarehouses();
    loadProductsList();
    if (!isEdit) {
      loadSalesOrders();
    }
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadDelivery();
    }
  }, [id]);

  const loadSalesOrders = async () => {
    try {
      setSalesOrderLoading(true);
      const response = await salesOrderService.getOrders({
        status: "Approved",
        approvalStatus: "Approved",
        page: 0,
        size: 100,
        sortBy: "orderDate",
        sortDir: "desc",
      });
      const list = response.content || [];
      setSalesOrders(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Sales Order");
    } finally {
      setSalesOrderLoading(false);
    }
  };

  useEffect(() => {
    if (salesOrderModalOpen && salesOrders.length === 0) {
      loadSalesOrders();
    }
  }, [salesOrderModalOpen]);

  const filteredSalesOrders = useMemo(() => {
    const term = salesOrderSearch.trim().toLowerCase();
    return salesOrders.filter((so) => {
      const matchesKeyword =
        !term ||
        (so.orderNo || "").toLowerCase().includes(term) ||
        (so.customerName || "").toLowerCase().includes(term);
      return matchesKeyword;
    });
  }, [salesOrders, salesOrderSearch]);

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

  const loadDelivery = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getDeliveryById(id);
      setFormData({
        salesOrderId: data.salesOrderId,
        warehouseId: data.warehouseId,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : new Date(),
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        shippingAddress: data.shippingAddress || "",
        carrierName: data.carrierName || "",
        trackingCode: data.trackingCode || "",
        notes: data.notes || "",
        items: (data.items || []).map((item) => ({
          salesOrderItemId: item.salesOrderItemId,
          productId: item.productId,
          warehouseId: item.warehouseId || null,
          plannedQty: item.plannedQty || 0,
          deliveredQty: item.deliveredQty || 0,
          note: item.note || "",
        })),
      });
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải phiếu giao hàng");
    } finally {
      setLoading(false);
    }
  };

  const loadFromSalesOrder = async () => {
    if (!formData.salesOrderId) {
      toast.warn("Vui lòng chọn Sales Order");
      return;
    }
    try {
      setLoading(true);
      const delivery = await deliveryService.createFromSalesOrder(formData.salesOrderId);
      setFormData({
        salesOrderId: delivery.salesOrderId,
        warehouseId: delivery.warehouseId,
        plannedDate: delivery.plannedDate ? new Date(delivery.plannedDate) : new Date(),
        actualDate: null,
        shippingAddress: delivery.shippingAddress || "",
        carrierName: "",
        trackingCode: "",
        notes: "",
        items: (delivery.items || []).map((item) => ({
          salesOrderItemId: item.salesOrderItemId,
          productId: item.productId,
          warehouseId: item.warehouseId || null,
          plannedQty: item.plannedQty || 0,
          deliveredQty: 0,
          note: "",
        })),
      });
      toast.success("Đã tải dữ liệu từ Sales Order");
    } catch (error) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể tải từ Sales Order";
      if (errorMessage.includes("Sản phẩm trong đơn hàng hết hàng")) {
        toast.error("Tất cả sản phẩm trong đơn hàng này đã được giao hết. Vui lòng chọn đơn hàng khác hoặc tạo phiếu giao hàng thủ công.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSalesOrderSelectFromModal = (so) => {
    setSalesOrderModalOpen(false);
    if (!so?.orderId) return;
    setSelectedSalesOrder({
      value: so.orderId,
      label: `${so.orderNo} - ${so.customerName || ""}`,
      data: so,
    });
    setFormData((prev) => ({
      ...prev,
      salesOrderId: so.orderId,
    }));
  };

  const handleItemSelect = (index, option) => {
    setFormData((prev) => {
      const next = [...prev.items];
      if (option) {
        next[index] = {
          ...next[index],
          productId: option.value,
        };
      } else {
        next[index] = {
          ...next[index],
          productId: null,
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
    if (!formData.salesOrderId) {
      newErrors.salesOrderId = "Chọn Sales Order";
    }
    if (!formData.warehouseId) {
      newErrors.warehouseId = "Chọn kho xuất hàng";
    }
    if (!formData.items || formData.items.length === 0) {
      newErrors.items = "Cần ít nhất một dòng giao hàng";
    } else {
      const itemErrors = formData.items.map((item) => {
        const e = {};
        if (!item.salesOrderItemId) {
          e.salesOrderItemId = "Chọn Sales Order Item";
        }
        if (!item.productId) {
          e.productId = "Chọn sản phẩm";
        }
        if (!item.plannedQty || Number(item.plannedQty) <= 0) {
          e.plannedQty = "Số lượng giao > 0";
        }
        if (item.deliveredQty && Number(item.deliveredQty) > Number(item.plannedQty || 0)) {
          e.deliveredQty = "Số lượng đã giao không được vượt quá số lượng dự kiến";
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
      salesOrderId: formData.salesOrderId,
      warehouseId: formData.warehouseId,
      plannedDate: formData.plannedDate ? formData.plannedDate.toISOString().split("T")[0] : null,
      actualDate: formData.actualDate ? formData.actualDate.toISOString().split("T")[0] : null,
      shippingAddress: formData.shippingAddress || null,
      carrierName: formData.carrierName || null,
      trackingCode: formData.trackingCode || null,
      notes: formData.notes || null,
      items: formData.items.map((item) => ({
        salesOrderItemId: item.salesOrderItemId,
        productId: item.productId,
        warehouseId: item.warehouseId || null,
        plannedQty: Number(item.plannedQty || 0),
        deliveredQty: Number(item.deliveredQty || 0),
        note: item.note || null,
      })),
    };
    try {
      setLoading(true);
      if (isEdit) {
        await deliveryService.updateDelivery(id, payload);
        toast.success("Đã cập nhật phiếu giao hàng");
      } else {
        await deliveryService.createDelivery(payload);
        toast.success("Đã tạo phiếu giao hàng");
      }
      navigate("/sales/deliveries");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Lỗi lưu phiếu giao hàng");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit && !formData.salesOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-5 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Cập nhật Phiếu Giao Hàng" : "Tạo Phiếu Giao Hàng"}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/sales/deliveries")}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                ← Quay lại
              </button>
              {!isEdit && (
                <button
                  type="button"
                  onClick={loadFromSalesOrder}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Tải từ Sales Order
                </button>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Thông tin phiếu giao hàng */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin phiếu giao hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">
                    Sales Order <span className="text-red-500">*</span>
                  </label>
                  {isEdit ? (
                    <input
                      type="text"
                      value={formData.salesOrderId}
                      disabled
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    />
                  ) : (
                    <div className="mt-1 flex flex-col lg:flex-row gap-2">
                      <input
                        type="text"
                        value={selectedSalesOrder?.label || ""}
                        readOnly
                        placeholder="Chọn Sales Order"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSalesOrderModalOpen(true)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          Chọn
                        </button>
                        {selectedSalesOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSalesOrder(null);
                              setFormData((prev) => ({ ...prev, salesOrderId: "" }));
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-red-600"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {errors.salesOrderId && (
                    <p className="text-sm text-red-600 mt-1">{errors.salesOrderId}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Kho xuất hàng <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="mt-1"
                    value={warehouses.find((w) => w.value === formData.warehouseId) || null}
                    onChange={(option) =>
                      setFormData((prev) => ({ ...prev, warehouseId: option?.value || "" }))
                    }
                    options={warehouses}
                    placeholder="Chọn kho"
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                    styles={selectStyles}
                  />
                  {errors.warehouseId && (
                    <p className="text-sm text-red-600 mt-1">{errors.warehouseId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ngày giao dự kiến</label>
                  <DatePicker
                    selected={formData.plannedDate}
                    onChange={(date) => setFormData((prev) => ({ ...prev, plannedDate: date }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ngày giao thực tế</label>
                  <DatePicker
                    selected={formData.actualDate}
                    onChange={(date) => setFormData((prev) => ({ ...prev, actualDate: date }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    dateFormat="dd/MM/yyyy"
                    isClearable
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Địa chỉ giao hàng</label>
                  <textarea
                    value={formData.shippingAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, shippingAddress: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Nhập địa chỉ giao hàng"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Đơn vị vận chuyển</label>
                  <input
                    type="text"
                    value={formData.carrierName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, carrierName: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tên đơn vị vận chuyển"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mã vận đơn</label>
                  <input
                    type="text"
                    value={formData.trackingCode}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, trackingCode: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mã vận đơn"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Ghi chú"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h2>
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
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Sản phẩm</th>
                    <th className="px-4 py-3 text-left">Kho</th>
                    <th className="px-4 py-3 text-right">Số lượng dự kiến</th>
                    <th className="px-4 py-3 text-right">Số lượng đã giao</th>
                    <th className="px-4 py-3 text-left">Ghi chú</th>
                    <th className="px-4 py-3 text-center">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.items.map((item, index) => {
                    const itemError = errors.itemDetails?.[index] || {};
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-700 text-center">{index + 1}</td>
                        <td className="px-4 py-3 w-64">
                          <Select
                            value={products.find((p) => p.value === item.productId) || null}
                            onChange={(opt) => handleItemSelect(index, opt)}
                            options={products}
                            placeholder="Chọn sản phẩm"
                            isClearable
                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            menuPosition="fixed"
                            menuShouldScrollIntoView={false}
                            styles={compactSelectStyles}
                          />
                          {itemError.productId && (
                            <p className="text-xs text-red-600 mt-1">{itemError.productId}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={warehouses.find((w) => w.value === item.warehouseId) || null}
                            onChange={(opt) =>
                              handleItemChange(index, "warehouseId", opt ? opt.value : null)
                            }
                            options={warehouses}
                            placeholder="Chọn kho (tuỳ chọn)"
                            isClearable
                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            menuPosition="fixed"
                            menuShouldScrollIntoView={false}
                            styles={compactSelectStyles}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.plannedQty || ""}
                            onChange={(e) =>
                              handleItemChange(index, "plannedQty", Number(e.target.value))
                            }
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-right"
                          />
                          {itemError.plannedQty && (
                            <p className="text-xs text-red-600 mt-1">{itemError.plannedQty}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.deliveredQty || ""}
                            onChange={(e) =>
                              handleItemChange(index, "deliveredQty", Number(e.target.value))
                            }
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-right"
                          />
                          {itemError.deliveredQty && (
                            <p className="text-xs text-red-600 mt-1">{itemError.deliveredQty}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 w-40">
                          <input
                            type="text"
                            value={item.note || ""}
                            onChange={(e) => handleItemChange(index, "note", e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            placeholder="Ghi chú"
                          />
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
            {errors.items && (
              <p className="text-sm text-red-600 px-6 py-3">{errors.items}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales/deliveries")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>

      <SalesOrderPickerModal
        isOpen={salesOrderModalOpen}
        onClose={() => setSalesOrderModalOpen(false)}
        salesOrders={filteredSalesOrders}
        loading={salesOrderLoading}
        onSelect={handleSalesOrderSelectFromModal}
        searchTerm={salesOrderSearch}
        onSearchChange={setSalesOrderSearch}
      />
    </div>
  );
}

const SalesOrderPickerModal = ({
  isOpen,
  onClose,
  salesOrders,
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
            <h3 className="text-lg font-semibold text-gray-900">Chọn Sales Order</h3>
            <p className="text-sm text-gray-500">Tìm và chọn Sales Order đã được phê duyệt</p>
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
            placeholder="Tìm theo số đơn hoặc khách hàng..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách Sales Order...</div>
          ) : salesOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có Sales Order nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày đơn
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tổng tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {salesOrders.map((so) => (
                  <tr
                    key={so.orderId}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => onSelect(so)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {so.orderNo || `SO-${so.orderId}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{so.customerName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {so.orderDate
                        ? new Date(so.orderDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(so.totalAmount)}
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
