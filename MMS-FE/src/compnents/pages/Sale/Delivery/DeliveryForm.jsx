import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { deliveryService } from "../../../../api/deliveryService";
import { salesOrderService } from "../../../../api/salesOrderService";
import { warehouseService } from "../../../../api/warehouseService";
import { warehouseStockService } from "../../../../api/warehouseStockService";
import { goodIssueService } from "../../../../api/goodIssueService";
import { getProducts } from "../../../../api/productService";
import { hasRole } from "../../../../api/authService";
import useAuthStore from "../../../../store/authStore";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

const productSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: 4,
    borderColor: state.isFocused ? "#2563eb" : "#000000",
    borderWidth: 1,
    boxShadow: "none",
    minHeight: 36,
    "&:hover": {
      borderColor: state.isFocused ? "#2563eb" : "#4b5563",
    },
  }),
};

const defaultItem = () => ({
  salesOrderItemId: null,
  productId: null,
  warehouseId: null,
  uom: "", // Đơn vị tính
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
  const { roles } = useAuthStore();
  
  // Check if user is MANAGER or SALE
  const canEdit = roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name;
    return roleName === 'MANAGER' || roleName === 'ROLE_MANAGER' || 
           roleName === 'SALE' || roleName === 'ROLE_SALE';
  }) || false;
  
  // Redirect users without permission
  useEffect(() => {
    if (!canEdit) {
      toast.error('Bạn không có quyền truy cập trang này!');
      navigate('/sales/deliveries');
    }
  }, [canEdit, navigate]);

  const [loading, setLoading] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [salesOrderModalOpen, setSalesOrderModalOpen] = useState(false);
  const [salesOrderSearch, setSalesOrderSearch] = useState("");
  const [salesOrderLoading, setSalesOrderLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null); // Thông tin khách hàng từ Sales Order
  const [deliveryStatus, setDeliveryStatus] = useState(null); // Lưu status khi edit
  const [hasApprovedGoodIssue, setHasApprovedGoodIssue] = useState(false); // Có Good Issue approved không
  const [itemStocks, setItemStocks] = useState({}); // { "index": stockQuantity }
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
      toast.error("Không thể tải danh sách đơn bán hàng");
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
      // Loại bỏ các đơn hàng đã giao hết hàng
      if (so.isFullyDelivered === true) {
        return false;
      }
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
        console.warn("Không thể tải phiếu xuất hàng:", err);
      }
      
      // Load SalesOrder để lấy thông tin orderedQty, deliveredQty, remainingQty
      let salesOrder = null;
      if (data.salesOrderId) {
        try {
          salesOrder = await salesOrderService.getOrderById(data.salesOrderId);
        } catch (err) {
          console.error("Không thể tải đơn bán hàng:", err);
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
          const product = products.find(p => p.value === item.productId)?.data;
          return {
            salesOrderItemId: item.salesOrderItemId,
            productId: item.productId,
            warehouseId: item.warehouseId || null,
            uom: product?.uom || item.uom || "",
            orderedQty: soItemInfo.orderedQty,
            deliveredQtyFromSalesOrder: soItemInfo.deliveredQty || 0,
            deliveredQty: deliveredQtyFromGoodIssue > 0 ? deliveredQtyFromGoodIssue : (item.deliveredQty || 0),
            remainingQty: soItemInfo.remainingQty,
            plannedQty: item.plannedQty || 0,
            note: item.note || "",
          };
        }),
      });

      // Load thông tin khách hàng từ Sales Order
      if (salesOrder) {
        setCustomerInfo({
          customerId: salesOrder.customerId,
          customerName: salesOrder.customerName || salesOrder.customer?.name || "",
          customerCode: salesOrder.customerCode || salesOrder.customer?.code || "",
        });
      }

      // Load tồn kho cho tất cả items sau khi set formData
      setTimeout(() => {
        (data.items || []).forEach((item, index) => {
          if (item.productId && item.warehouseId) {
            loadStockForItem(index, item.productId, item.warehouseId);
          }
        });
      }, 100);
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
      toast.warn("Vui lòng chọn đơn bán hàng");
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
        setCustomerInfo(null);
        return;
      }
      
      // Lưu thông tin khách hàng
      setCustomerInfo({
        customerId: salesOrder.customerId,
        customerName: salesOrder.customerName || salesOrder.customer?.name || "",
        customerCode: salesOrder.customerCode || salesOrder.customer?.code || "",
      });

      setFormData((prev) => ({
        ...prev,
        salesOrderId: salesOrder.soId || targetId,
        shippingAddress: salesOrder.shippingAddress || "",
        items: availableItems.map((item) => {
          const product = products.find(p => p.value === item.productId)?.data;
          return {
            salesOrderItemId: item.soiId,
            productId: item.productId,
            warehouseId: item.warehouseId || null, // Lấy từ Sales Order item, nếu không có thì để null
            uom: product?.uom || item.uom || "",
            orderedQty: item.quantity || 0,
            deliveredQtyFromSalesOrder: item.deliveredQty || 0, // Số lượng đã giao từ các Delivery khác (từ SalesOrder)
            deliveredQty: 0, // Số lượng đã giao của Delivery này (ban đầu = 0, nhập khi status = Shipped)
            remainingQty: item.remainingQty || 0,
            plannedQty: item.remainingQty || 0, // Số lượng dự kiến = số lượng chưa giao (khi tạo mới)
            note: "",
          };
        }),
      }));

      // Load tồn kho cho tất cả items sau khi set formData
      setTimeout(() => {
        availableItems.forEach((item, index) => {
          const itemWarehouseId = item.warehouseId; // Chỉ lấy từ Sales Order item
          if (item.productId && itemWarehouseId) {
            loadStockForItem(index, item.productId, itemWarehouseId);
          }
        });
      }, 100);
      toast.success("Đã tải dữ liệu từ đơn bán hàng");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể tải đơn bán hàng");
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

  const loadStockForItem = async (index, productId, warehouseId) => {
    if (!productId || !warehouseId) {
      setItemStocks((prev) => ({ ...prev, [index]: null }));
      return;
    }
    try {
      // Thử dùng getStockByWarehouseAndProduct để lấy đầy đủ thông tin
      const stock = await warehouseStockService.getStockByWarehouseAndProduct(warehouseId, productId);
      let quantity = 0;
      if (stock?.quantity !== undefined) {
        quantity = Number(stock.quantity) || 0;
      } else if (typeof stock === 'number') {
        quantity = stock;
      } else if (stock?.data?.quantity !== undefined) {
        quantity = Number(stock.data.quantity) || 0;
      }
      setItemStocks((prev) => ({ ...prev, [index]: quantity }));
    } catch (error) {
      console.error("Error loading stock:", error);
      // Nếu lỗi 404, thử dùng getQuantityByWarehouseAndProduct
      if (error?.response?.status === 404) {
        try {
          const qtyResponse = await warehouseStockService.getQuantityByWarehouseAndProduct(warehouseId, productId);
          const qty = typeof qtyResponse === 'number' ? qtyResponse : (qtyResponse?.quantity ?? 0);
          setItemStocks((prev) => ({ ...prev, [index]: Number(qty) || 0 }));
        } catch (qtyError) {
          console.error("Error loading quantity:", qtyError);
          setItemStocks((prev) => ({ ...prev, [index]: 0 }));
        }
      } else {
        setItemStocks((prev) => ({ ...prev, [index]: null }));
      }
    }
  };

  const handleItemSelect = (index, option) => {
    setFormData((prev) => {
      const next = [...prev.items];
      if (option) {
        const product = option.data || products.find(p => p.value === option.value)?.data;
        next[index] = {
          ...next[index],
          productId: option.value,
          uom: product?.uom || "",
        };
      } else {
        next[index] = {
          ...next[index],
          productId: null,
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
      
      // Load stock when warehouseId changes
      if (field === "warehouseId" && next[index].productId) {
        loadStockForItem(index, next[index].productId, value);
      }
      
      return { ...prev, items: next };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, defaultItem()], // Item mới không có kho, user phải chọn thủ công
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
      newErrors.salesOrderId = "Chọn đơn bán hàng";
    }
    // Kho xuất hàng ở header không bắt buộc nữa vì mỗi item có kho riêng
    // Chỉ validate nếu không có item nào có kho
    if (!formData.items || formData.items.length === 0) {
      newErrors.items = "Cần ít nhất một dòng giao hàng";
    } else {
      const itemErrors = formData.items.map((item) => {
        const e = {};
        if (!item.salesOrderItemId) {
          e.salesOrderItemId = "Chọn Dòng đơn bán hàng";
        }
        if (!item.productId) {
          e.productId = "Chọn sản phẩm";
        }
        // Mỗi item PHẢI có kho riêng
        if (!item.warehouseId) {
          e.warehouseId = "Chọn kho cho sản phẩm này";
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
      warehouseId: formData.items[0]?.warehouseId || null, // Lấy từ item đầu tiên (nếu backend cần)
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

  // Tính toán lock rules
  const isManager = hasRole("MANAGER") || hasRole("ROLE_MANAGER");
  const canEditAll = !deliveryStatus || deliveryStatus === "Draft" || (deliveryStatus === "Delivered" && isManager) || (deliveryStatus === "Shipped" && isManager);
  const canEditItems = !deliveryStatus || deliveryStatus === "Draft" || (deliveryStatus === "Delivered" && isManager) || (deliveryStatus === "Shipped" && isManager);
  const canEditNotes = !deliveryStatus || deliveryStatus === "Draft" || deliveryStatus === "Picked" || (deliveryStatus === "Delivered" && isManager) || (deliveryStatus === "Shipped" && isManager);
  const canEditTracking = !deliveryStatus || deliveryStatus === "Draft" || deliveryStatus === "Picked" || deliveryStatus === "Shipped" || (deliveryStatus === "Delivered" && isManager);
  const canEditBasicInfo = !deliveryStatus || deliveryStatus === "Draft" || (deliveryStatus === "Delivered" && isManager) || (deliveryStatus === "Shipped" && isManager);

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
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales/deliveries")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Quay lại trang trước"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">
                {isEdit ? "Cập nhật Phiếu Giao Hàng" : "Tạo Phiếu Giao Hàng"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn bán hàng <span className="text-red-500">*</span>
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
                    placeholder="Chọn Đơn bán hàng"
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
                        setCustomerInfo(null);
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
                Khách hàng
              </label>
              <input
                type="text"
                value={
                  customerInfo
                    ? `${customerInfo.customerCode ? customerInfo.customerCode + " - " : ""}${customerInfo.customerName || ""}`
                    : ""
                }
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                disabled
              />
            </div>
          </div>

          <div className={`grid grid-cols-1 ${isEdit ? 'lg:grid-cols-2' : ''} gap-6`}>
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
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày giao thực tế
                </label>
                <DatePicker
                  selected={formData.actualDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, actualDate: date }))}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                  disabled={true}
                  readOnly
                />
              </div>
            )}
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
                      Đơn vị
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
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-600 align-top">{index + 1}</td>
                        <td className="px-3 py-2 w-64 align-top">
                          <Select
                            value={products.find((p) => p.value === item.productId) || null}
                            onChange={(opt) => handleItemSelect(index, opt)}
                            options={products}
                            placeholder="Chọn sản phẩm"
                            isClearable
                            isDisabled={true}
                            styles={productSelectStyles}
                            menuPortalTarget={
                              typeof window !== "undefined" ? document.body : null
                            }
                            menuPosition="fixed"
                          />
                          {itemError.productId && (
                            <p className="text-red-500 text-xs mt-1">{itemError.productId}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <input
                            type="text"
                            value={item.uom || ""}
                            onChange={(e) =>
                              handleItemChange(index, "uom", e.target.value)
                            }
                            className="w-24 border rounded px-2 py-1 bg-gray-100"
                            disabled={true}
                            readOnly
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Select
                            value={warehouses.find((w) => w.value === item.warehouseId) || null}
                            onChange={(option) => {
                              const newWarehouseId = option?.value || null;
                              handleItemChange(index, "warehouseId", newWarehouseId);
                            }}
                            options={warehouses}
                            placeholder="Chọn kho"
                            isClearable
                            isDisabled={!canEditItems}
                            styles={productSelectStyles}
                            menuPortalTarget={
                              typeof window !== "undefined" ? document.body : null
                            }
                            menuPosition="fixed"
                          />
                          {itemError.warehouseId && (
                            <p className="text-red-500 text-xs mt-1">{itemError.warehouseId}</p>
                          )}
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
                          {item.productId && item.warehouseId && itemStocks[index] !== undefined && (
                            <div className="mt-1 text-xs">
                              <span className={itemStocks[index] !== null ? "text-gray-600" : "text-gray-400"}>
                                Tồn kho: {itemStocks[index] !== null ? Number(itemStocks[index]).toLocaleString("vi-VN") : "—"}
                              </span>
                              {itemStocks[index] !== null && item.plannedQty > itemStocks[index] && (
                                <p className="text-red-600 font-semibold mt-1">
                                  Không đủ hàng! (Cần: {Number(item.plannedQty || 0).toLocaleString("vi-VN")})
                                </p>
                              )}
                            </div>
                          )}
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
            <h3 className="text-lg font-semibold text-gray-900">Chọn Đơn bán hàng</h3>
            <p className="text-sm text-gray-500">Tìm và chọn Đơn bán hàng đã được phê duyệt</p>
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
            <div className="py-12 text-center text-gray-500">Đang tải danh sách Đơn bán hàng...</div>
          ) : salesOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có Đơn bán hàng nào</div>
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