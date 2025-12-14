import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { deliveryService } from "../../../../api/deliveryService";
import { salesOrderService } from "../../../../api/salesOrderService";
import { warehouseService } from "../../../../api/warehouseService";
import { goodIssueService } from "../../../../api/goodIssueService";
import { getProducts } from "../../../../api/productService";
import { hasRole } from "../../../../api/authService";

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
  const [hasApprovedGoodIssue, setHasApprovedGoodIssue] = useState(false); // Có Good Issue approved không
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
      setDeliveryStatus(data.status);
      
      // Load Good Issue approved để lấy deliveredQty
      let goodIssueQtyMap = new Map(); // productId -> issuedQty
      let hasApproved = false;
      try {
        const issues = await goodIssueService.getIssuesByDeliveryId(id);
        const approvedIssues = issues.filter(issue => issue.status === "Approved" && !issue.deletedAt);
        if (approvedIssues.length > 0) {
          hasApproved = true;
          setHasApprovedGoodIssue(true);
          // Tính tổng issuedQty theo productId từ tất cả Good Issue approved
          approvedIssues.forEach(issue => {
            if (issue.items) {
              issue.items.forEach(item => {
                const productId = item.productId;
                const issuedQty = Number(item.issuedQty || 0);
                goodIssueQtyMap.set(productId, (goodIssueQtyMap.get(productId) || 0) + issuedQty);
              });
            }
          });
        }
      } catch (err) {
        console.warn("Không thể tải Good Issue:", err);
      }
      
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
          // deliveredQty từ Good Issue approved (ưu tiên) hoặc từ Delivery data
          const deliveredQtyFromGoodIssue = goodIssueQtyMap.get(item.productId) || 0;
          return {
            salesOrderItemId: item.salesOrderItemId,
            productId: item.productId,
            warehouseId: item.warehouseId || null,
            orderedQty: soItemInfo.orderedQty,
            deliveredQtyFromSalesOrder: soItemInfo.deliveredQty || 0,
            deliveredQty: deliveredQtyFromGoodIssue > 0 ? deliveredQtyFromGoodIssue : (item.deliveredQty || 0),
            remainingQty: soItemInfo.remainingQty,
            plannedQty: item.plannedQty || 0,
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
        // Khi tạo mới: plannedQty = remainingQty (tự động)
        // Khi edit: plannedQty từ formData
        plannedQty: Number(item.plannedQty || item.remainingQty || 0),
        // deliveredQty: Khi có Good Issue approved, được tự động fill từ Good Issue (read-only)
        deliveredQty: Number(item.deliveredQty || 0),
        note: item.note || null,
      })),
    };

    // Khi edit Delivery: Chỉ BẮT BUỘC phải có Good Issue approved khi status không phải Draft
    // deliveredQty sẽ được tự động fill từ Good Issue's issuedQty ở backend
    if (isEdit && deliveryStatus !== "Draft" && !hasApprovedGoodIssue) {
      toast.error("Không thể cập nhật phiếu giao hàng. Phải có phiếu xuất kho đã được phê duyệt trước.");
      return;
    }

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

  const handleSubmitToWarehouse = async () => {
    // Validate: Phải có items
    if (!formData.items || formData.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    // Validate: Phải có shippingAddress
    if (!formData.shippingAddress || formData.shippingAddress.trim() === "") {
      toast.error("Vui lòng điền địa chỉ giao hàng");
      return;
    }

    // Validate: Phải có warehouseId
    if (!formData.warehouseId) {
      toast.error("Vui lòng chọn kho");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn submit phiếu giao hàng cho kho xử lý? Sau khi submit, bạn sẽ không thể sửa sản phẩm nữa.")) {
      return;
    }

    try {
      setLoading(true);
      
      // Cập nhật Delivery trước để đảm bảo shippingAddress được lưu vào database
      const updatePayload = {
        salesOrderId: formData.salesOrderId,
        warehouseId: formData.warehouseId,
        plannedDate: formData.plannedDate ? formData.plannedDate.toISOString() : null,
        actualDate: formData.actualDate ? formData.actualDate.toISOString() : null,
        shippingAddress: formData.shippingAddress,
        carrierName: formData.carrierName,
        trackingCode: formData.trackingCode,
        notes: formData.notes,
        items: formData.items.map((item) => ({
          salesOrderItemId: item.salesOrderItemId,
          productId: item.productId,
          warehouseId: item.warehouseId || null,
          plannedQty: Number(item.plannedQty || item.remainingQty || 0),
          deliveredQty: Number(item.deliveredQty || 0),
          note: item.note || null,
        })),
      };
      
      // Update trước
      await deliveryService.updateDelivery(id, updatePayload);
      
      // Sau đó submit
      await deliveryService.submitToWarehouse(id);
      toast.success("Đã submit phiếu giao hàng cho kho xử lý");
      // Reload để lấy status mới
      await loadDelivery();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể submit phiếu giao hàng");
    } finally {
      setLoading(false);
    }
  };

  // Tính toán lock rules
  const isManager = hasRole("MANAGER") || hasRole("ROLE_MANAGER");
  const canEditAll = !deliveryStatus || deliveryStatus === "Draft" || (deliveryStatus === "Delivered" && isManager) || (deliveryStatus === "Shipped" && isManager);
  const canEditItems = deliveryStatus === "Draft" || (deliveryStatus === "Delivered" && isManager) || (deliveryStatus === "Shipped" && isManager);
  const canEditNotes = deliveryStatus === "Draft" || deliveryStatus === "Picked" || (deliveryStatus === "Delivered" && isManager) || (deliveryStatus === "Shipped" && isManager);
  const canEditTracking = deliveryStatus === "Draft" || deliveryStatus === "Picked" || deliveryStatus === "Shipped" || (deliveryStatus === "Delivered" && isManager);
  const canEditBasicInfo = deliveryStatus === "Draft" || (deliveryStatus === "Delivered" && isManager) || (deliveryStatus === "Shipped" && isManager);

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
              disabled={!canEditBasicInfo}
              className={`w-full px-3 py-2 border rounded-lg ${!canEditBasicInfo ? 'bg-gray-100' : ''}`}
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
                disabled={!canEditTracking}
                className={`w-full px-3 py-2 border rounded-lg ${!canEditTracking ? 'bg-gray-100' : ''}`}
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
                disabled={!canEditTracking}
                className={`w-full px-3 py-2 border rounded-lg ${!canEditTracking ? 'bg-gray-100' : ''}`}
                placeholder="Mã vận đơn"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              disabled={!canEditNotes}
              className={`w-full px-3 py-2 border rounded-lg ${!canEditNotes ? 'bg-gray-100' : ''}`}
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
                disabled={!canEditItems}
                className={`px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm ${!canEditItems ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    {isEdit && hasApprovedGoodIssue && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Số lượng đã giao
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
                            isDisabled={!canEditItems}
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
                            isDisabled={!canEditItems}
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
                        {isEdit && hasApprovedGoodIssue && (
                          <td className="px-3 py-2">
                            <div className="text-sm text-gray-700 font-medium">
                              {Number(item.deliveredQty || 0).toLocaleString("vi-VN")}
                              <span className="text-xs text-gray-500 ml-1">(từ phiếu xuất kho)</span>
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.note || ""}
                            onChange={(e) => handleItemChange(index, "note", e.target.value)}
                            disabled={!canEditNotes}
                            className={`w-full px-2 py-1 border rounded text-sm ${!canEditNotes ? 'bg-gray-100' : ''}`}
                            placeholder="Ghi chú"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={!canEditItems}
                            className={`text-red-600 hover:underline ${!canEditItems ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            {isEdit && deliveryStatus === "Draft" && (
              <button
                type="button"
                onClick={handleSubmitToWarehouse}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Submit cho kho xử lý"}
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !canEditAll}
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
