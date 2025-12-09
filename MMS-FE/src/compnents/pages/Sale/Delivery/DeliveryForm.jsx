import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { deliveryService } from "../../../../api/deliveryService";
import { salesOrderService } from "../../../../api/salesOrderService";
import { warehouseService } from "../../../../api/warehouseService";
import { warehouseStockService } from "../../../../api/warehouseStockService";
import { getProducts } from "../../../../api/productService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

const defaultItem = () => ({
  salesOrderItemId: null,
  productId: null,
  warehouseId: null,
  orderedQty: 0, // Số lượng đặt
  deliveredQtyFromSalesOrder: 0, // Số lượng đã giao từ các Delivery khác (từ SalesOrder) - chỉ đọc
  deliveredQty: 0, // Số lượng đã giao của Delivery này (nhập khi status = Shipped)
  remainingQty: 0, // Số lượng chưa giao
  plannedQty: 0, // Số lượng dự kiến
  note: "",
});

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
  const [deliveryStatus, setDeliveryStatus] = useState(null); // Lưu status khi edit
  const [stockWarningDialog, setStockWarningDialog] = useState({
    open: false,
    items: [],
    onConfirm: null,
  });
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
      setDeliveryStatus(data.status); // Lưu status để biết khi nào hiển thị cột deliveredQty
      
      // Load SalesOrder để lấy thông tin orderedQty, deliveredQty, remainingQty
      let salesOrder = null;
      if (data.salesOrderId) {
        try {
          salesOrder = await salesOrderService.getOrderById(data.salesOrderId);
        } catch (err) {
          console.error("Không thể tải Sales Order:", err);
        }
      }
      
      // Tạo map để tra cứu thông tin từ SalesOrder items
      const salesOrderItemMap = new Map();
      if (salesOrder?.items) {
        salesOrder.items.forEach((soItem) => {
          salesOrderItemMap.set(soItem.soiId, {
            orderedQty: soItem.quantity || 0,
            deliveredQty: soItem.deliveredQty || 0,
            remainingQty: soItem.remainingQty || 0,
          });
        });
      }
      
      setFormData({
        salesOrderId: data.salesOrderId,
        warehouseId: data.warehouseId,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : new Date(),
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        shippingAddress: data.shippingAddress || "",
        carrierName: data.carrierName || "",
        trackingCode: data.trackingCode || "",
        notes: data.notes || "",
        items: (data.items || []).map((item) => {
          const soItemInfo = salesOrderItemMap.get(item.salesOrderItemId) || {
            orderedQty: item.orderedQty || 0,
            deliveredQty: 0,
            remainingQty: item.orderedQty || 0,
          };
          return {
            salesOrderItemId: item.salesOrderItemId,
            productId: item.productId,
            warehouseId: item.warehouseId || null,
          orderedQty: soItemInfo.orderedQty,
          deliveredQtyFromSalesOrder: soItemInfo.deliveredQty || 0, // Số lượng đã giao từ các Delivery khác
          deliveredQty: item.deliveredQty || 0, // Số lượng đã giao của Delivery này
          remainingQty: soItemInfo.remainingQty,
          plannedQty: item.plannedQty || 0, // Số lượng dự kiến
          note: item.note || "",
          };
        }),
      });
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải phiếu giao hàng");
    } finally {
      setLoading(false);
    }
  };

  const loadFromSalesOrder = async (salesOrderIdArg) => {
    const targetId = salesOrderIdArg || formData.salesOrderId;
    if (!targetId) {
      toast.warn("Vui lòng chọn Sales Order");
      return;
    }
    try {
      setLoading(true);
      // Load SalesOrder trực tiếp 
      const salesOrder = await salesOrderService.getOrderById(targetId);
      
      // Filter chỉ lấy items có remainingQty > 0 (chưa giao hết)
      const availableItems = (salesOrder.items || []).filter(
        (item) => Number(item.remainingQty || 0) > 0
      );
      
      // Kiểm tra nếu tất cả items đã giao hết
      if (availableItems.length === 0) {
        toast.error("Đơn hàng này đã được giao hết. Không thể tạo phiếu giao hàng mới.");
        // Reset form
        setFormData((prev) => ({
          ...prev,
          salesOrderId: "",
          items: [defaultItem()],
        }));
        setSelectedSalesOrder(null);
        return;
      }
      
      // Lấy warehouse đầu tiên từ items hoặc để null
      const firstWarehouseId = availableItems[0]?.warehouseId || null;
      
      setFormData((prev) => ({
        ...prev,
        salesOrderId: salesOrder.soId || targetId,
        warehouseId: firstWarehouseId || prev.warehouseId || "",
        shippingAddress: salesOrder.shippingAddress || "",
        items: availableItems.map((item) => ({
          salesOrderItemId: item.soiId,
          productId: item.productId,
          warehouseId: item.warehouseId || firstWarehouseId || null,
          orderedQty: item.quantity || 0,
          deliveredQtyFromSalesOrder: item.deliveredQty || 0, // Số lượng đã giao từ các Delivery khác (từ SalesOrder)
          deliveredQty: 0, // Số lượng đã giao của Delivery này (ban đầu = 0, nhập khi status = Shipped)
          remainingQty: item.remainingQty || 0,
          plannedQty: item.remainingQty || 0, // Số lượng dự kiến = số lượng chưa giao (khi tạo mới)
          note: "",
        })),
      }));
      toast.success("Đã tải dữ liệu từ Sales Order");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể tải Sales Order");
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
    // Tự động load data từ Sales Order khi chọn (giống SalesOrderForm)
    loadFromSalesOrder(so.orderId);
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
        // Không validate plannedQty khi tạo mới (sẽ tự động set = remainingQty khi submit)
        // Chỉ validate deliveredQty khi status = Shipped (sắp chuyển sang Delivered)
        // Validation khi change status sang Delivered sẽ được xử lý ở backend
        return e;
      });
      if (itemErrors.some((e) => Object.keys(e).length > 0)) {
        newErrors.itemDetails = itemErrors;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Kiểm tra số lượng trong kho trước khi submit
  const checkStockBeforeSubmit = async (items) => {
    const insufficientItems = [];
    
    for (const item of items) {
      if (!item.productId || !item.warehouseId || Number(item.remainingQty || 0) <= 0) {
        continue;
      }
      
      try {
        const stockQty = await warehouseStockService.getQuantityByWarehouseAndProduct(
          item.warehouseId,
          item.productId
        );
        // Sử dụng remainingQty để check stock (vì plannedQty sẽ = remainingQty khi submit)
        const plannedQty = Number(item.plannedQty || item.remainingQty || 0);
        const availableQty = Number(stockQty || 0);
        
        if (plannedQty > availableQty) {
          const product = products.find((p) => p.value === item.productId);
          const warehouse = warehouses.find((w) => w.value === item.warehouseId);
          insufficientItems.push({
            productName: product?.label || `Sản phẩm ID ${item.productId}`,
            warehouseName: warehouse?.label || `Kho ID ${item.warehouseId}`,
            plannedQty: plannedQty,
            availableQty,
            shortage: plannedQty - availableQty,
          });
        }
      } catch (error) {
        console.error(`Error checking stock for product ${item.productId}:`, error);
        // Nếu không kiểm tra được, vẫn cho phép tiếp tục
      }
    }
    
    return insufficientItems;
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
        // Khi tạo mới: plannedQty = remainingQty (tự động)
        // Khi edit: plannedQty từ formData (user có thể chỉnh sửa)
        plannedQty: Number(item.plannedQty || item.remainingQty || 0),
        deliveredQty: Number(item.deliveredQty || 0), // Số lượng đã giao (chỉ nhập khi change status sang Delivered)
        note: item.note || null,
      })),
    };

    // Kiểm tra số lượng trong kho trước khi submit
    const insufficientItems = await checkStockBeforeSubmit(formData.items);
    
    if (insufficientItems.length > 0) {
      // Hiển thị dialog xác nhận
      setStockWarningDialog({
        open: true,
        items: insufficientItems,
        onConfirm: () => {
          setStockWarningDialog({ open: false, items: [], onConfirm: null });
          submitDelivery(payload);
        },
      });
      return;
    }

    // Nếu đủ stock, submit ngay
    submitDelivery(payload);
  };

  const submitDelivery = async (payload) => {
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
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Cập nhật Phiếu Giao Hàng" : "Tạo Phiếu Giao Hàng"}
            </h1>
            <p className="text-gray-500">Nhập thông tin phiếu giao hàng</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/sales/deliveries")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sales Order <span className="text-red-500">*</span>
              </label>
              {isEdit ? (
                <input
                  type="text"
                  value={formData.salesOrderId}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedSalesOrder?.label || ""}
                    readOnly
                    placeholder="Chọn Sales Order"
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setSalesOrderModalOpen(true)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
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
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-red-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              )}
              {errors.salesOrderId && (
                <p className="text-red-500 text-xs mt-1">{errors.salesOrderId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kho xuất hàng <span className="text-red-500">*</span>
              </label>
              <Select
                value={warehouses.find((w) => w.value === formData.warehouseId) || null}
                onChange={(option) =>
                  setFormData((prev) => ({ ...prev, warehouseId: option?.value || "" }))
                }
                options={warehouses}
                placeholder="Chọn kho"
              />
              {errors.warehouseId && (
                <p className="text-red-500 text-xs mt-1">{errors.warehouseId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày giao dự kiến
              </label>
              <DatePicker
                selected={formData.plannedDate}
                onChange={(date) => setFormData((prev) => ({ ...prev, plannedDate: date }))}
                className="w-full px-3 py-2 border rounded-lg"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày giao thực tế
              </label>
              <DatePicker
                selected={formData.actualDate}
                onChange={(date) => setFormData((prev) => ({ ...prev, actualDate: date }))}
                className="w-full px-3 py-2 border rounded-lg"
                dateFormat="dd/MM/yyyy"
                isClearable
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ giao hàng
            </label>
            <textarea
              value={formData.shippingAddress}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, shippingAddress: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Nhập địa chỉ giao hàng"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn vị vận chuyển
              </label>
              <input
                type="text"
                value={formData.carrierName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, carrierName: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Tên đơn vị vận chuyển"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã vận đơn
              </label>
              <input
                type="text"
                value={formData.trackingCode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, trackingCode: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Mã vận đơn"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Ghi chú"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Danh sách sản phẩm</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                + Thêm dòng
              </button>
            </div>
            {errors.items && (
              <p className="text-red-500 text-xs mb-2">{errors.items}</p>
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
                      Kho
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lượng đặt
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lượng đã giao
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lượng chưa giao
                    </th>
                    {(isEdit && deliveryStatus === "Shipped") && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Số lượng đã giao (nhập)
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ghi chú
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const itemError = errors.itemDetails?.[index] || {};
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
                          <div className="text-sm text-gray-700">
                            {Number(item.orderedQty || 0).toLocaleString("vi-VN")}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-700">
                            {Number(item.deliveredQtyFromSalesOrder || 0).toLocaleString("vi-VN")}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-700 font-medium">
                            {Number(item.remainingQty || 0).toLocaleString("vi-VN")}
                          </div>
                        </td>
                        {(isEdit && deliveryStatus === "Shipped") && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              max={item.plannedQty || item.remainingQty || 0}
                              value={item.deliveredQty || ""}
                              onChange={(e) =>
                                handleItemChange(index, "deliveredQty", Number(e.target.value))
                              }
                              className="w-24 px-2 py-1 border rounded"
                              placeholder="Nhập số lượng"
                            />
                            {itemError.deliveredQty && (
                              <p className="text-red-500 text-xs">{itemError.deliveredQty}</p>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.note || ""}
                            onChange={(e) => handleItemChange(index, "note", e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Ghi chú"
                          />
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate("/sales/deliveries")}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
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

      {/* Dialog cảnh báo số lượng trong kho không đủ */}
      {stockWarningDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-600">Số lượng trong kho không đủ</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Số lượng sản phẩm trong kho không đủ cho một số sản phẩm. Bạn có muốn tiếp tục tạo đơn?
                </p>
              </div>
              <button
                onClick={() => setStockWarningDialog({ open: false, items: [], onConfirm: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {stockWarningDialog.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-orange-50">
                    <div className="font-semibold text-gray-900">{item.productName}</div>
                    <div className="text-sm text-gray-600 mt-1">Kho: {item.warehouseName}</div>
                    <div className="text-sm text-gray-700 mt-2">
                      <span className="font-medium">Số lượng giao dự kiến:</span> {item.plannedQty.toLocaleString("vi-VN")}
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Số lượng có sẵn trong kho:</span>{" "}
                      <span className="text-red-600 font-semibold">{item.availableQty.toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="text-sm text-red-600 font-semibold mt-1">
                      Thiếu: {item.shortage.toLocaleString("vi-VN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setStockWarningDialog({ open: false, items: [], onConfirm: null })}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={stockWarningDialog.onConfirm}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Tiếp tục tạo đơn
              </button>
            </div>
          </div>
        </div>
      )}
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