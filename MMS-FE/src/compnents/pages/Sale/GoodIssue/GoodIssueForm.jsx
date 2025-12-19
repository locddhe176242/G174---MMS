import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { goodIssueService } from "../../../../api/goodIssueService";
import { deliveryService } from "../../../../api/deliveryService";
import { warehouseService } from "../../../../api/warehouseService";
import { warehouseStockService } from "../../../../api/warehouseStockService";
import { getCurrentUser, hasRole } from "../../../../api/authService";
import apiClient from "../../../../api/apiClient";

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

const defaultItem = () => ({
  diId: null,
  productId: null,
  warehouseId: null, // Kho riêng cho từng item
  issuedQty: 0,
  remark: "",
});

export default function GoodIssueForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const deliveryIdFromQuery = searchParams.get("deliveryId");

  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [issueStatus, setIssueStatus] = useState(null);
  const [stockWarningDialog, setStockWarningDialog] = useState({
    open: false,
    items: [],
    onConfirm: null,
  });

  const [formData, setFormData] = useState({
    issueNo: "",
    deliveryId: null,
    issueDate: new Date(),
    notes: "",
    items: [],
  });
  const [itemStocks, setItemStocks] = useState({}); // { "index": stockQuantity }

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUser();
    loadWarehouses();
    if (!isEdit) {
      loadDeliveries();
      // Backend sẽ tự động generate số phiếu nếu không có
      // Có thể gọi generateIssueNumber() để preview, nhưng không bắt buộc
      generateIssueNumber();
      if (deliveryIdFromQuery) {
        loadDelivery(deliveryIdFromQuery);
      }
    }
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      loadIssue();
    }
  }, [isEdit, id]);

  const loadUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {

    }
  };

  const generateIssueNumber = async () => {
    try {
      const response = await goodIssueService.generateIssueNo();
      if (response?.issueNo || response?.issue_no) {
        setFormData((prev) => ({
          ...prev,
          issueNo: response.issueNo || response.issue_no,
        }));
      }
    } catch (err) {
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await apiClient.get("/warehouses/page", {
        params: { page: 0, size: 100 },
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.content || [];
      setWarehouses(
        data.map((warehouse) => ({
          value: warehouse.warehouseId || warehouse.warehouse_id || warehouse.id,
          label: warehouse.name,
          warehouse,
        }))
      );
    } catch (err) {
      toast.error("Không thể tải danh sách kho");
    }
  };

  const loadDeliveries = async () => {
    try {
      setDeliveryLoading(true);
      const response = await deliveryService.getAllDeliveries();
      const data = Array.isArray(response) ? response : response?.content || [];
      
      // Filter: Chỉ lấy Delivery có status Picked và chưa có Good Issue approved
      const statusFiltered = data.filter((delivery) => {
        const status = delivery.status?.toString() || "";
        return status === "Picked";
      });
      
      const eligibleDeliveries = await Promise.all(
        statusFiltered.map(async (delivery) => {
          try {

            const issuesResponse = await goodIssueService.getIssuesByDeliveryId(
              delivery.deliveryId || delivery.delivery_id || delivery.id
            );
            const issues = Array.isArray(issuesResponse) ? issuesResponse : [];
            const hasApprovedIssue = issues.some(
              (issue) => issue.status === "Approved" && !issue.deletedAt
            );
            
            return {
              ...delivery,
              hasApprovedIssue,
            };
          } catch (err) {
            // Nếu lỗi, giả sử chưa có Good Issue
            return {
              ...delivery,
              hasApprovedIssue: false,
            };
          }
        })
      );

      const filtered = eligibleDeliveries.filter((d) => !d.hasApprovedIssue);

      setDeliveries(
        filtered.map((delivery) => ({
          value: delivery.deliveryId || delivery.delivery_id || delivery.id,
          label: `${delivery.deliveryNo || delivery.delivery_no} - ${delivery.salesOrderNo || ""}`,
          delivery,
          isDisabled: delivery.hasApprovedIssue,
        }))
      );
      
    } catch (err) {
      toast.error("Không thể tải danh sách phiếu giao hàng");
    } finally {
      setDeliveryLoading(false);
    }
  };

  const loadDelivery = async (deliveryId) => {
    try {
      setLoading(true);
      const delivery = await deliveryService.getDeliveryById(deliveryId);
      
      if (!delivery) {
        toast.error("Không tìm thấy phiếu giao hàng");
        return;
      }

      // Check xem Delivery đã có Good Issue approved chưa
      const issuesResponse = await goodIssueService.getIssuesByDeliveryId(deliveryId);
      const issues = Array.isArray(issuesResponse) ? issuesResponse : [];
      const hasApprovedIssue = issues.some(
        (issue) => issue.status === "Approved" && !issue.deletedAt
      );

      if (hasApprovedIssue) {
        toast.error("Phiếu giao hàng này đã có phiếu xuất kho được phê duyệt");
        navigate("/sales/good-issues");
        return;
      }

      // Validate delivery status - chỉ cho phép khi Delivery ở Picked
      if (delivery.status !== "Picked") {
        toast.error("Chỉ có thể tạo phiếu xuất kho khi phiếu giao hàng đã được submit cho kho (trạng thái: Đang chuẩn bị hàng)");
        navigate("/sales/good-issues");
        return;
      }

      setSelectedDelivery({
        value: delivery.deliveryId || delivery.delivery_id || delivery.id,
        label: `${delivery.deliveryNo || delivery.delivery_no} - ${delivery.salesOrderNo || ""}`,
        data: delivery,
      });

      // Load warehouse stock for each item - lấy kho từ deliveryItem.warehouseId
      const itemsWithStock = await Promise.all(
        (delivery.items || []).map(async (item) => {
          // Lấy kho từ deliveryItem.warehouseId (mỗi item có kho riêng)
          const warehouseId = item.warehouseId || item.warehouse_id || null;
          const productId = item.productId || item.product_id;
          
          let availableStock = 0;
          if (warehouseId && productId) {
            try {
              const stock = await warehouseStockService.getQuantityByWarehouseAndProduct(
                warehouseId,
                productId
              );
              availableStock = Number(stock || 0);
            } catch (err) {
              // Nếu lỗi, để availableStock = 0
            }
          }

          return {
            diId: item.deliveryItemId || item.diId || item.di_id || item.id,
            productId: productId,
            warehouseId: warehouseId, // Kho riêng cho từng item
            productName: item.productName || item.product_name,
            productCode: item.productSku || item.productCode || item.product_code || item.sku,
            plannedQty: Number(item.plannedQty || item.planned_qty || 0),
            uom: item.uom,
            availableStock,
          };
        })
      );

      setFormData({
        issueNo: "",
        deliveryId: delivery.deliveryId || delivery.delivery_id || delivery.id,
        issueDate: new Date(),
        notes: "",
        items: itemsWithStock.map((item, index) => ({
          diId: item.diId,
          productId: item.productId,
          warehouseId: item.warehouseId, // Kho riêng cho từng item
          issuedQty: item.plannedQty, // Default to plannedQty
          remark: "",
          // Store additional info for display
          productName: item.productName,
          productCode: item.productCode,
          plannedQty: item.plannedQty,
          uom: item.uom,
          availableStock: item.availableStock,
        })),
      });

      // Lưu tồn kho vào state để hiển thị
      const stocks = {};
      itemsWithStock.forEach((item, index) => {
        stocks[index] = item.availableStock;
      });
      setItemStocks(stocks);

      toast.success("Đã tải dữ liệu từ phiếu giao hàng");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể tải phiếu giao hàng");
    } finally {
      setLoading(false);
    }
  };

  const loadIssue = async () => {
    try {
      setLoading(true);
      const data = await goodIssueService.getGoodIssueById(id);
      
      setIssueStatus(data.status);
      
      // Load items với warehouseId từ Good Issue items hoặc từ Delivery items
      const itemsWithWarehouse = await Promise.all(
        (data.items || []).map(async (item) => {
          let warehouseId = item.warehouseId || item.warehouse_id || null;
          
          // Nếu không có warehouseId trong Good Issue item, lấy từ Delivery item
          if (!warehouseId && data.deliveryId) {
            try {
              const delivery = await deliveryService.getDeliveryById(data.deliveryId);
              const deliveryItem = (delivery.items || []).find(
                (di) => (di.deliveryItemId || di.diId || di.di_id || di.id) === (item.diId || item.di_id || item.deliveryItemId)
              );
              warehouseId = deliveryItem?.warehouseId || deliveryItem?.warehouse_id || null;
            } catch (err) {
              // Nếu lỗi, để warehouseId = null
            }
          }
          
          // Load tồn kho
          let availableStock = 0;
          if (warehouseId && item.productId) {
            try {
              const stock = await warehouseStockService.getQuantityByWarehouseAndProduct(
                warehouseId,
                item.productId || item.product_id
              );
              availableStock = Number(stock || 0);
            } catch (err) {
              // Nếu lỗi, để availableStock = 0
            }
          }
          
          return {
            diId: item.diId || item.di_id || item.deliveryItemId,
            productId: item.productId || item.product_id,
            warehouseId: warehouseId,
            issuedQty: Number(item.issuedQty || item.issued_qty || 0),
            remark: item.remark || "",
            productName: item.productName || item.product_name,
            productCode: item.productCode || item.product_code || item.productSku || item.sku,
            plannedQty: Number(item.plannedQty || item.planned_qty || 0),
            uom: item.uom,
            availableStock,
          };
        })
      );

      setFormData({
        issueNo: data.issueNo || data.issue_no || "",
        deliveryId: data.deliveryId || data.delivery_id,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        notes: data.notes || "",
        items: itemsWithWarehouse,
      });

      // Lưu tồn kho vào state
      const stocks = {};
      itemsWithWarehouse.forEach((item, index) => {
        stocks[index] = item.availableStock;
      });
      setItemStocks(stocks);

      // Load delivery info
      if (data.deliveryId) {
        const delivery = await deliveryService.getDeliveryById(data.deliveryId);
        setSelectedDelivery({
          value: delivery.deliveryId || delivery.delivery_id || delivery.id,
          label: `${delivery.deliveryNo || delivery.delivery_no} - ${delivery.salesOrderNo || ""}`,
          data: delivery,
        });
      }
    } catch (error) {
      toast.error("Không thể tải phiếu xuất kho");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySelectFromModal = (delivery) => {
    setDeliveryModalOpen(false);
    if (!delivery?.deliveryId && !delivery?.delivery_id && !delivery?.id) return;
    const deliveryId = delivery.deliveryId || delivery.delivery_id || delivery.id;
    loadDelivery(deliveryId);
  };

  const loadStockForItem = async (index, productId, warehouseId) => {
    if (!productId || !warehouseId) {
      setItemStocks((prev) => ({ ...prev, [index]: 0 }));
      return;
    }
    try {
      const stock = await warehouseStockService.getQuantityByWarehouseAndProduct(warehouseId, productId);
      const quantity = typeof stock === 'number' ? stock : (stock?.quantity ?? 0);
      setItemStocks((prev) => ({ ...prev, [index]: Number(quantity) || 0 }));
    } catch (error) {
      console.error("Error loading stock:", error);
      setItemStocks((prev) => ({ ...prev, [index]: 0 }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.items];
      next[index] = { ...next[index], [field]: value };
      
      // Validate issuedQty không vượt quá plannedQty
      if (field === "issuedQty") {
        const plannedQty = next[index].plannedQty || 0;
        if (value > plannedQty) {
          toast.warn(`Số lượng xuất không được vượt quá số lượng dự kiến (${plannedQty})`);
          next[index][field] = plannedQty;
        }
        // Validate không vượt quá tồn kho (chỉ validate nếu đã có kho)
        if (next[index].warehouseId) {
          const availableStock = itemStocks[index] !== undefined ? itemStocks[index] : 0;
          if (value > availableStock && availableStock > 0) {
            toast.warn(`Số lượng xuất không được vượt quá tồn kho (${availableStock})`);
            next[index][field] = Math.min(value, availableStock);
          }
        }
      }
      
      // Khi đổi kho, load lại tồn kho
      if (field === "warehouseId" && next[index].productId) {
        loadStockForItem(index, next[index].productId, value);
      }
      
      return { ...prev, items: next };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.deliveryId) {
      newErrors.deliveryId = "Chọn phiếu giao hàng";
    }
    if (!formData.items || formData.items.length === 0) {
      newErrors.items = "Cần ít nhất một dòng xuất kho";
    } else {
      const itemErrors = formData.items.map((item, index) => {
        const e = {};
        if (!item.diId) {
          e.diId = "Delivery Item ID không hợp lệ";
        }
        if (!item.productId) {
          e.productId = "Sản phẩm không hợp lệ";
        }
        // Mỗi item PHẢI có kho riêng
        if (!item.warehouseId) {
          e.warehouseId = "Chọn kho cho sản phẩm này";
        }
        if (!item.issuedQty || item.issuedQty <= 0) {
          e.issuedQty = "Số lượng xuất phải lớn hơn 0";
        }
        if (item.issuedQty > item.plannedQty) {
          e.issuedQty = `Số lượng xuất không được vượt quá số lượng dự kiến (${item.plannedQty})`;
        }
        // Validate không vượt quá tồn kho
        const availableStock = itemStocks[index] || 0;
        if (item.warehouseId && item.issuedQty > availableStock) {
          e.issuedQty = `Số lượng xuất không được vượt quá tồn kho (${availableStock})`;
        }
        return e;
      });
      if (itemErrors.some((e) => Object.keys(e).length > 0)) {
        newErrors.itemDetails = itemErrors;
      }
    }
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const checkStockBeforeSubmit = async (items) => {
    const insufficientItems = [];
    
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (!item.productId || !item.warehouseId || Number(item.issuedQty || 0) <= 0) {
        continue;
      }
      
      try {
        const stockQty = await warehouseStockService.getQuantityByWarehouseAndProduct(
          item.warehouseId, // Lấy kho từ item, không phải từ formData.warehouseId
          item.productId
        );
        const issuedQty = Number(item.issuedQty || 0);
        const availableQty = Number(stockQty || 0);
        
        if (issuedQty > availableQty) {
          insufficientItems.push({
            productName: item.productName || `Sản phẩm ID ${item.productId}`,
            warehouseName: warehouses.find((w) => w.value === item.warehouseId)?.label || `Kho ID ${item.warehouseId}`,
            issuedQty: issuedQty,
            availableQty,
            shortage: issuedQty - availableQty,
          });
        }
      } catch (error) {
        // Nếu lỗi, thêm vào insufficientItems để cảnh báo
        insufficientItems.push({
          productName: item.productName || `Sản phẩm ID ${item.productId}`,
          warehouseName: warehouses.find((w) => w.value === item.warehouseId)?.label || `Kho ID ${item.warehouseId}`,
          issuedQty: Number(item.issuedQty || 0),
          availableQty: 0,
          shortage: Number(item.issuedQty || 0),
        });
      }
    }
    
    return insufficientItems;
  };

  const handleSubmitForApproval = async () => {
    // Validate: Phải có items
    if (!formData.items || formData.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    if (
      !window.confirm(
        "Xác nhận hoàn tất phiếu xuất kho? Sau khi hoàn tất, hệ thống sẽ trừ tồn kho và bạn sẽ không thể sửa phiếu này"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const userId = currentUser?.userId || currentUser?.id || 1;
      await goodIssueService.submitForApproval(id, userId);
      toast.success("Đã hoàn tất phiếu xuất kho và cập nhật tồn kho");
      // Reload để lấy status mới (Approved)
      await loadIssue();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể gửi yêu cầu duyệt");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationResult = validate();
    if (!validationResult.isValid) {
      // Hiển thị lỗi cụ thể từ validation result
      const validationErrors = validationResult.errors;
      const errorMessages = [];
      if (validationErrors.deliveryId) errorMessages.push(validationErrors.deliveryId);
      if (validationErrors.warehouseId) errorMessages.push(validationErrors.warehouseId);
      if (validationErrors.items) errorMessages.push(validationErrors.items);
      if (validationErrors.itemDetails) {
        validationErrors.itemDetails.forEach((itemErr, idx) => {
          if (itemErr.issuedQty) {
            errorMessages.push(`Dòng ${idx + 1}: ${itemErr.issuedQty}`);
          }
          if (itemErr.diId) {
            errorMessages.push(`Dòng ${idx + 1}: ${itemErr.diId}`);
          }
          if (itemErr.productId) {
            errorMessages.push(`Dòng ${idx + 1}: ${itemErr.productId}`);
          }
        });
      }
      
      const errorMsg = errorMessages.length > 0 
        ? errorMessages.join(". ") 
        : "Vui lòng kiểm tra thông tin";
      
      toast.error(errorMsg);
      return;
    }

    const payload = {
      // Backend sẽ tự động generate số phiếu nếu issueNo null/empty
      issueNo: formData.issueNo?.trim() || undefined,
      deliveryId: formData.deliveryId,
      issueDate: formData.issueDate ? formData.issueDate.toISOString() : new Date().toISOString(),
      notes: formData.notes || null,
      items: formData.items.map((item) => ({
        diId: item.diId,
        productId: item.productId,
        warehouseId: item.warehouseId || null, // Kho riêng cho từng item
        issuedQty: Number(item.issuedQty || 0),
        remark: item.remark || null,
      })),
    };

    // Check stock availability
    const insufficientItems = await checkStockBeforeSubmit(formData.items);
    
    if (insufficientItems.length > 0) {
      setStockWarningDialog({
        open: true,
        items: insufficientItems,
        onConfirm: () => {
          setStockWarningDialog({ open: false, items: [], onConfirm: null });
          submitIssue(payload);
        },
      });
      return;
    }

    submitIssue(payload);
  };

  const submitIssue = async (payload) => {
    try {
      setLoading(true);
      const userId = currentUser?.id || currentUser?.userId || 1;
      
      if (isEdit) {
        await goodIssueService.updateGoodIssue(id, payload, userId);
        toast.success("Đã cập nhật phiếu xuất kho");
      } else {
        await goodIssueService.createGoodIssue(payload, userId);
        toast.success("Đã tạo phiếu xuất kho");
      }
      navigate("/sales/good-issues");
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Lỗi lưu phiếu xuất kho";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) =>
    delivery.label.toLowerCase().includes(deliverySearch.toLowerCase())
  );

  // Tính toán lock rules
  const isManager = hasRole("MANAGER") || hasRole("ROLE_MANAGER");
  // Khi tạo mới (issueStatus = undefined/null) hoặc Draft: có thể edit
  // Khi Approved: chỉ Manager mới edit được
  const canEditAll = !issueStatus || issueStatus === "Draft" || (issueStatus === "Approved" && isManager);
  const canEditFields = !issueStatus || issueStatus === "Draft" || (issueStatus === "Approved" && isManager);

  if (loading && isEdit && !formData.deliveryId) {
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
              onClick={() => navigate("/sales/good-issues")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Quay lại trang trước"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className="text-2xl font-semibold">
              {isEdit ? "Cập nhật Phiếu Xuất Kho" : "Tạo Phiếu Xuất Kho"}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Thông tin phiếu xuất kho */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin phiếu xuất kho</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Số phiếu xuất kho</label>
                  <input
                    type="text"
                    value={formData.issueNo || ""}
                    readOnly
                    placeholder="Sẽ được tự động tạo khi lưu"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Phiếu Giao Hàng <span className="text-red-500">*</span>
                  </label>
                  {isEdit ? (
                    <input
                      type="text"
                      value={selectedDelivery?.label || ""}
                      disabled
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    />
                  ) : (
                    <div className="mt-1 flex flex-col lg:flex-row gap-2">
                      <input
                        type="text"
                        value={selectedDelivery?.label || ""}
                        readOnly
                        placeholder="Chọn phiếu giao hàng"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryModalOpen(true)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          Chọn
                        </button>
                        {selectedDelivery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDelivery(null);
                              setFormData((prev) => ({ ...prev, deliveryId: null, items: [] }));
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-red-600"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {errors.deliveryId && (
                    <p className="text-sm text-red-600 mt-1">{errors.deliveryId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ngày xuất kho</label>
                  <DatePicker
                    selected={formData.issueDate}
                    onChange={(date) => setFormData((prev) => ({ ...prev, issueDate: date }))}
                    disabled={!canEditFields}
                    className={`mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditFields ? 'bg-gray-100' : ''}`}
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    disabled={!canEditFields}
                    className={`mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditFields ? 'bg-gray-100' : ''}`}
                    rows={3}
                    placeholder="Ghi chú"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Mã sản phẩm</th>
                    <th className="px-4 py-3 text-left">Tên sản phẩm</th>
                    <th className="px-4 py-3 text-right">ĐVT</th>
                    <th className="px-4 py-3 text-left">Kho <span className="text-red-500">*</span></th>
                    <th className="px-4 py-3 text-right">Số lượng dự kiến</th>
                    <th className="px-4 py-3 text-right">Tồn kho</th>
                    <th className="px-4 py-3 text-right">Số lượng xuất <span className="text-red-500">*</span></th>
                    <th className="px-4 py-3 text-left">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.items.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        {selectedDelivery ? "Không có sản phẩm nào" : "Vui lòng chọn phiếu giao hàng để tải sản phẩm"}
                      </td>
                    </tr>
                  ) : (
                    formData.items.map((item, index) => {
                      const itemError = errors.itemDetails?.[index] || {};
                      const availableStock = itemStocks[index] !== undefined ? itemStocks[index] : (item.availableStock || 0);
                      const isStockInsufficient = availableStock !== undefined && availableStock !== null && item.issuedQty > availableStock;
                      return (
                        <tr key={index} className={`hover:bg-gray-50 ${isStockInsufficient ? "bg-red-50" : ""}`}>
                          <td className="px-4 py-3 text-xs text-gray-700 text-center">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.productCode || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.productName || "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700 align-top">
                            {item.uom || "-"}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Select
                              value={warehouses.find((w) => w.value === item.warehouseId) || null}
                              onChange={(option) => {
                                const newWarehouseId = option?.value || null;
                                handleItemChange(index, "warehouseId", newWarehouseId);
                              }}
                              options={warehouses}
                              placeholder="Chọn kho"
                              isClearable={false}
                              isDisabled={!canEditFields}
                              styles={compactSelectStyles}
                              menuPortalTarget={
                                typeof window !== "undefined" ? document.body : null
                              }
                              menuPosition="fixed"
                            />
                            {itemError.warehouseId && (
                              <p className="text-xs text-red-600 mt-1">{itemError.warehouseId}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <div className="text-sm text-gray-700 font-medium">
                              {Number(item.plannedQty || 0).toLocaleString("vi-VN")}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <div className={`text-sm ${availableStock !== undefined && availableStock !== null && availableStock < item.issuedQty ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                              {availableStock !== undefined && availableStock !== null
                                ? Number(availableStock).toLocaleString("vi-VN")
                                : "-"}
                            </div>
                            {item.warehouseId && item.productId && itemStocks[index] !== undefined && (
                              <div className="mt-1 text-xs text-gray-500">
                                Tồn kho tại kho đã chọn
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              max={item.plannedQty || 0}
                              value={item.issuedQty || ""}
                              onChange={(e) =>
                                handleItemChange(index, "issuedQty", Number(e.target.value))
                              }
                              disabled={!canEditFields}
                              className={`w-24 border rounded px-2 py-1 text-right ${
                                !canEditFields
                                  ? "bg-gray-100"
                                  : isStockInsufficient
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              }`}
                              placeholder="Nhập số lượng"
                            />
                            {itemError.issuedQty && (
                              <p className="text-xs text-red-600 mt-1">{itemError.issuedQty}</p>
                            )}
                            {isStockInsufficient && (
                              <p className="text-xs text-red-600 mt-1">
                                Thiếu: {(item.issuedQty - availableStock).toLocaleString("vi-VN")}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 w-40">
                            <input
                              type="text"
                              value={item.remark || ""}
                              onChange={(e) => handleItemChange(index, "remark", e.target.value)}
                              disabled={!canEditFields}
                              className={`w-full border border-gray-300 rounded px-2 py-1 ${!canEditFields ? 'bg-gray-100' : ''}`}
                              placeholder="Ghi chú"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {errors.items && (
              <p className="text-sm text-red-600 px-6 py-3">{errors.items}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales/good-issues")}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Hủy
            </button>
            {isEdit && issueStatus === "Draft" && (
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Hoàn tất phiếu xuất kho"}
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

      {/* Delivery Picker Modal */}
      <DeliveryPickerModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        deliveries={filteredDeliveries}
        loading={deliveryLoading}
        onSelect={handleDeliverySelectFromModal}
        searchTerm={deliverySearch}
        onSearchChange={setDeliverySearch}
      />

      {/* Stock Warning Dialog */}
      {stockWarningDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-600">Số lượng trong kho không đủ</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Số lượng sản phẩm trong kho không đủ cho một số sản phẩm. Bạn có muốn tiếp tục tạo phiếu xuất kho?
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
                      <span className="font-medium">Số lượng xuất:</span> {item.issuedQty.toLocaleString("vi-VN")}
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
                Tiếp tục tạo phiếu
              </button>
            </div>
          </div>
        </div>
      )}
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
          <h2 className="text-xl font-semibold text-gray-900">Chọn Phiếu Giao Hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-4 border-b">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo số phiếu giao hàng..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Đang tải...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? (
                <div>
                  <p className="font-medium">Không tìm thấy phiếu giao hàng</p>
                  <p className="text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Không có phiếu giao hàng nào</p>
                  <p className="text-sm mt-2 text-gray-400">
                    Chỉ có thể tạo phiếu xuất kho từ phiếu giao hàng ở trạng thái <strong>Đang chuẩn bị hàng</strong>
                  </p>
                  <p className="text-sm mt-1 text-gray-400">
                    và chưa có phiếu xuất kho được phê duyệt
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {deliveries.map((delivery) => (
                <button
                  key={delivery.value}
                  onClick={() => onSelect(delivery.delivery)}
                  disabled={delivery.isDisabled}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                    delivery.isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="font-medium text-gray-900">{delivery.label}</div>
                  {delivery.delivery?.salesOrderNo && (
                    <div className="text-sm text-gray-500 mt-1">
                      Sales Order: {delivery.delivery.salesOrderNo}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-end">
          <button
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