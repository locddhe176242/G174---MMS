import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { returnOrderService } from "../../../../api/returnOrderService";
import { deliveryService } from "../../../../api/deliveryService";
import { warehouseService } from "../../../../api/warehouseService";
import { getProducts } from "../../../../api/productService";

const defaultItem = () => ({
  deliveryItemId: null,
  productId: null,
  warehouseId: null,
  returnedQty: 0,
  reason: "",
  note: "",
});

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

export default function ReturnOrderForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [alreadyReturnedMap, setAlreadyReturnedMap] = useState({}); // Map<deliveryItemId, alreadyReturnedQty>
  const [formData, setFormData] = useState({
    deliveryId: "",
    invoiceId: null,
    warehouseId: "",
    returnDate: new Date(),
    reason: "",
    notes: "",
    items: [defaultItem()],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadWarehouses();
    loadProductsList();
    if (!isEdit) {
      loadDeliveries();
    }
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadReturnOrder();
    }
  }, [id]);

  const loadDeliveries = async () => {
    try {
      setDeliveryLoading(true);
      const response = await deliveryService.getAllDeliveries({ status: "Delivered" });
      const list = Array.isArray(response) ? response : response?.content || [];
      setDeliveries(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách phiếu giao hàng");
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
      // Loại bỏ các Delivery đã trả hết hàng
      if (d.isFullyReturned === true) {
        return false;
      }
      const matchesKeyword =
        !term ||
        (d.deliveryNo || "").toLowerCase().includes(term) ||
        (d.customerName || "").toLowerCase().includes(term) ||
        (d.salesOrderNo || "").toLowerCase().includes(term);
      return matchesKeyword;
    });
  }, [deliveries, deliverySearch]);

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

  const loadReturnOrder = async () => {
    try {
      setLoading(true);
      const data = await returnOrderService.getReturnOrder(id);
      setFormData({
        deliveryId: data.deliveryId,
        invoiceId: data.invoiceId || null,
        warehouseId: data.warehouseId,
        returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
        reason: data.reason || "",
        notes: data.notes || "",
        items: (data.items || []).map((item) => ({
          deliveryItemId: item.deliveryItemId,
          productId: item.productId,
          warehouseId: item.warehouseId,
          returnedQty: item.returnedQty || 0,
          reason: item.reason || "",
          note: item.note || "",
        })),
      });
      if (data.deliveryId) {
        const delivery = await deliveryService.getDeliveryById(data.deliveryId);
        setSelectedDelivery(delivery);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải đơn trả hàng");
      navigate("/sales/return-orders");
    } finally {
      setLoading(false);
    }
  };

  const loadFromDelivery = async (deliveryIdArg = null) => {
    const targetDeliveryId = deliveryIdArg || formData.deliveryId;
    if (!targetDeliveryId) {
      toast.warn("Vui lòng chọn phiếu giao hàng");
      return;
    }
    try {
      setLoading(true);
      const delivery = await deliveryService.getDeliveryById(targetDeliveryId);
      setSelectedDelivery(delivery);

      // Load các Return Order đã Approved cho delivery này để tính alreadyReturned
      try {
        const allReturnOrders = await returnOrderService.getAllReturnOrders();
        const returnOrders = Array.isArray(allReturnOrders) ? allReturnOrders : allReturnOrders?.content || [];
        
        // Get deliveryId from delivery object (ensure correct format)
        const deliveryIdFromDelivery = delivery.deliveryId || delivery.delivery_id || targetDeliveryId;
        const targetDeliveryIdNum = typeof deliveryIdFromDelivery === 'string' 
          ? parseInt(deliveryIdFromDelivery) 
          : (deliveryIdFromDelivery || (typeof targetDeliveryId === 'string' ? parseInt(targetDeliveryId) : targetDeliveryId));
        
        console.log("=== Loading alreadyReturned ===", {
          targetDeliveryId,
          deliveryIdFromDelivery,
          targetDeliveryIdNum,
          allReturnOrdersCount: returnOrders.length
        });
        
        // Lọc các Return Order có deliveryId trùng và status = Approved
        // (Loại trừ Return Order đang được edit nếu có)
        const approvedReturnOrders = returnOrders.filter(ro => {
          const roDeliveryId = ro.deliveryId || ro.delivery?.deliveryId || ro.delivery?.delivery_id;
          const roDeliveryIdNum = typeof roDeliveryId === 'string' ? parseInt(roDeliveryId) : roDeliveryId;
          const isSameDelivery = roDeliveryIdNum === targetDeliveryIdNum;
          // Check status: "Approved" (string) or ReturnStatus.Approved (enum)
          const statusStr = ro.status?.toString() || ro.status;
          const isApproved = statusStr === "Approved" || statusStr === "APPROVED";
          const isNotCurrentEdit = !isEdit || (ro.roId && ro.roId !== parseInt(id));
          
          const match = isSameDelivery && isApproved && isNotCurrentEdit;
          if (isSameDelivery) {
            console.log(`  RO ${ro.roId || ro.returnNo}: deliveryId=${roDeliveryId} (${roDeliveryIdNum}), target=${targetDeliveryIdNum}, status=${statusStr}, approved=${isApproved}, notEdit=${isNotCurrentEdit}, match=${match}`);
          }
          
          return match;
        });
        
        console.log("=== Calculating alreadyReturned ===", {
          targetDeliveryId,
          targetDeliveryIdNum,
          approvedReturnOrders: approvedReturnOrders.map(ro => ({
            roId: ro.roId,
            deliveryId: ro.deliveryId || ro.delivery?.deliveryId,
            status: ro.status,
            itemsCount: ro.items?.length || 0
          }))
        });
        
        // Tính alreadyReturned cho mỗi deliveryItemId
        // Sử dụng cả number và string key để đảm bảo match
        const alreadyReturned = {};
        approvedReturnOrders.forEach(ro => {
          console.log(`  Processing RO ${ro.roId || ro.returnNo}:`, {
            itemsCount: ro.items?.length || 0,
            items: ro.items?.map(item => ({
              roiId: item.roiId,
              deliveryItemId: item.deliveryItemId,
              productId: item.productId,
              productName: item.productName,
              returnedQty: item.returnedQty
            }))
          });
          
          (ro.items || []).forEach(roItem => {
            const diId = roItem.deliveryItemId || roItem.deliveryItem?.deliveryItemId || roItem.diId;
            if (diId) {
              const returnedQty = Number(roItem.returnedQty || 0);
              // Store with both number and string key to ensure match
              const diIdNum = typeof diId === 'string' ? parseInt(diId) : diId;
              const diIdStr = String(diIdNum);
              
              alreadyReturned[diIdNum] = (alreadyReturned[diIdNum] || 0) + returnedQty;
              alreadyReturned[diIdStr] = alreadyReturned[diIdNum]; // Also store as string key
              console.log(`    Item diId=${diId} (num=${diIdNum}, str=${diIdStr}): +${returnedQty} (total: ${alreadyReturned[diIdNum]})`);
            } else {
              console.warn(`    Item missing deliveryItemId:`, roItem);
            }
          });
        });
        
        console.log("=== Final alreadyReturnedMap ===", alreadyReturned);
        console.log("=== Delivery items for comparison ===", (delivery.items || []).map(item => ({
          diId: item.deliveryItemId || item.diId,
          productId: item.productId,
          productName: item.productName,
          deliveredQty: item.deliveredQty
        })));
        setAlreadyReturnedMap(alreadyReturned);
      } catch (error) {
        console.warn("Không thể load Return Orders để tính alreadyReturned:", error);
        setAlreadyReturnedMap({});
      }

      const items = (delivery.items || [])
        .filter((item) => Number(item.deliveredQty || 0) > 0)
        .map((item) => ({
          deliveryItemId: item.deliveryItemId || item.diId,
          productId: item.productId,
          warehouseId: item.warehouseId || delivery.warehouseId,
          returnedQty: 0,
          reason: "",
          note: "",
        }));

      if (items.length === 0) {
        toast.warn("Phiếu giao hàng này không có sản phẩm đã giao");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        deliveryId: targetDeliveryId, // Đảm bảo deliveryId được set
        // warehouseId không còn ở header, nhưng giữ lại để backward compatibility
        warehouseId: delivery.warehouseId || prev.warehouseId,
        items: items.length > 0 ? items : [defaultItem()],
      }));
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu từ phiếu giao hàng");
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

  const handleDeliverySelectFromModal = async (delivery) => {
    setDeliveryModalOpen(false);
    if (!delivery?.deliveryId) return;
    // Gọi loadFromDelivery với deliveryId trực tiếp, không cần đợi state update
    await loadFromDelivery(delivery.deliveryId);
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.deliveryId) {
      newErrors.deliveryId = "Vui lòng chọn phiếu giao hàng";
    }
    // Không validate warehouseId ở header nữa, vì mỗi item có kho riêng
    
    // Chỉ lấy các items có returnedQty > 0 để validate
    const itemsWithReturnQty = (formData.items || []).filter(
      (item) => item.returnedQty && Number(item.returnedQty) > 0
    );
    
    if (itemsWithReturnQty.length === 0) {
      newErrors.items = "Cần ít nhất một dòng sản phẩm có số lượng trả lại > 0";
    } else {
      // Chỉ validate các items có returnedQty > 0
      const itemErrors = formData.items.map((item, idx) => {
        const err = {};
        const returnedQty = Number(item.returnedQty || 0);
        
        // Chỉ validate nếu returnedQty > 0
        if (returnedQty > 0) {
          if (!item.deliveryItemId) {
            err.deliveryItemId = "Thiếu dòng phiếu giao hàng";
          }
          if (!item.productId) {
            err.productId = "Chọn sản phẩm";
          }
          if (!item.warehouseId) {
            err.warehouseId = "Chọn kho";
          }
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

  const buildPayload = () => {
    // Tự động lấy warehouseId từ item đầu tiên có returnedQty > 0
    // Hoặc từ delivery nếu không có item nào
    const firstItemWithQty = formData.items.find(
      (item) => item.returnedQty && Number(item.returnedQty) > 0
    );
    const autoWarehouseId = firstItemWithQty?.warehouseId || 
                           selectedDelivery?.warehouseId || 
                           formData.warehouseId || 
                           null;

    return {
      deliveryId: formData.deliveryId,
      invoiceId: formData.invoiceId || null,
      warehouseId: autoWarehouseId, // Tự động lấy từ item đầu tiên
      returnDate: formData.returnDate ? formData.returnDate.toISOString().slice(0, 10) : null,
      reason: formData.reason || null,
      notes: formData.notes || null,
      // Chỉ gửi các items có returnedQty > 0
      items: formData.items
        .filter((item) => item.returnedQty && Number(item.returnedQty) > 0)
        .map((item) => ({
          deliveryItemId: item.deliveryItemId,
          productId: item.productId,
          warehouseId: item.warehouseId, // Mỗi item có kho riêng - có thể khác nhau
          returnedQty: Number(item.returnedQty || 0),
          reason: item.reason || null,
          note: item.note || null,
        })),
    };
  };

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
        await returnOrderService.updateReturnOrder(id, payload);
        toast.success("Đã cập nhật đơn trả hàng");
      } else {
        await returnOrderService.createReturnOrder(payload);
        toast.success("Đã tạo đơn trả hàng");
      }
      navigate("/sales/return-orders");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể lưu đơn trả hàng");
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

  const getDeliveryItemInfo = (deliveryItemId) => {
    if (!selectedDelivery || !deliveryItemId) return null;
    return selectedDelivery.items?.find((item) => (item.deliveryItemId || item.diId) === deliveryItemId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Cập nhật đơn trả hàng" : "Tạo đơn trả hàng mới"}
            </h1>
            <p className="text-gray-500">
              {isEdit ? "Cập nhật thông tin đơn trả hàng" : "Nhập thông tin đơn trả hàng"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/sales/return-orders")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phiếu giao hàng * <span className="text-red-500">*</span>
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    value={selectedDelivery?.deliveryNo || ""}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedDelivery?.deliveryNo || ""}
                      readOnly
                      placeholder="Chọn phiếu giao hàng"
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
                          handleInputChange("deliveryId", "");
                        }}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-red-600"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                )}
                {errors.deliveryId && (
                  <p className="text-red-500 text-xs mt-1">{errors.deliveryId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày trả hàng
                </label>
                <DatePicker
                  selected={formData.returnDate}
                  onChange={(date) => handleDateChange("returnDate", date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do trả hàng
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nhập lý do trả hàng"
                />
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
                <h2 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm trả lại</h2>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Thêm dòng
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Sản phẩm</th>
                      <th className="px-4 py-3 text-left">Kho</th>
                      <th className="px-4 py-3 text-right">Đã giao</th>
                      <th className="px-4 py-3 text-right">Số lượng trả lại</th>
                      <th className="px-4 py-3 text-left">Lý do</th>
                      <th className="px-4 py-3 text-left">Ghi chú</th>
                      {!isEdit && <th className="px-4 py-3 text-center">#</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formData.items.map((item, index) => {
                      const deliveryItem = getDeliveryItemInfo(item.deliveryItemId);
                      const deliveredQty = deliveryItem ? Number(deliveryItem.deliveredQty || 0) : 0;
                      // Ensure deliveryItemId is compared correctly (handle both string and number)
                      const diIdKey = item.deliveryItemId;
                      const alreadyReturned = alreadyReturnedMap[diIdKey] || alreadyReturnedMap[String(diIdKey)] || alreadyReturnedMap[Number(diIdKey)] || 0;
                      const maxReturnable = Math.max(0, deliveredQty - alreadyReturned);
                      const itemError = errors.itemDetails?.[index] || {};
                      
                      // Debug log for first item
                      if (index === 0) {
                        console.log(`=== Item ${index} calculation ===`, {
                          deliveryItemId: item.deliveryItemId,
                          diIdKey,
                          deliveredQty,
                          alreadyReturned,
                          maxReturnable,
                          alreadyReturnedMapKeys: Object.keys(alreadyReturnedMap),
                          alreadyReturnedMap
                        });
                      }

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {isEdit ? (
                              <div>
                                <div className="font-semibold">
                                  {products.find((p) => p.value === item.productId)?.label || "—"}
                                </div>
                              </div>
                            ) : (
                              <Select
                                value={
                                  deliveryItem
                                    ? {
                                        value: item.productId,
                                        label: `${deliveryItem.productSku || ""} - ${deliveryItem.productName || ""}`,
                                      }
                                    : null
                                }
                                isDisabled
                                className="w-64"
                              />
                            )}
                            {itemError.productId && (
                              <p className="text-red-500 text-xs mt-1">{itemError.productId}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={warehouses.find((w) => w.value === item.warehouseId) || null}
                              onChange={(opt) =>
                                handleItemChange(index, "warehouseId", opt ? opt.value : null)
                              }
                              options={warehouses}
                              placeholder="Chọn kho"
                              isClearable
                            />
                            {itemError.warehouseId && (
                              <p className="text-red-500 text-xs mt-1">{itemError.warehouseId}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            <div>{formatNumberDisplay(deliveredQty)}</div>
                            {alreadyReturned > 0 && (
                              <div className="text-xs text-gray-400">
                                Đã trả: {formatNumberDisplay(alreadyReturned)}
                              </div>
                            )}
                            <div className="text-xs text-blue-600 font-medium">
                              Có thể trả: {formatNumberDisplay(maxReturnable)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumberDisplay(item.returnedQty)}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "returnedQty",
                                  normalizeNumberInput(e.target.value)
                                )
                              }
                              className="w-32 border rounded px-3 py-1 text-right"
                              max={maxReturnable}
                            />
                            {itemError.returnedQty && (
                              <p className="text-red-500 text-xs mt-1">{itemError.returnedQty}</p>
                            )}
                            {item.returnedQty > maxReturnable && (
                              <p className="text-red-500 text-xs mt-1">
                                Vượt quá số lượng có thể trả ({formatNumberDisplay(maxReturnable)})
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.reason}
                              onChange={(e) => handleItemChange(index, "reason", e.target.value)}
                              className="w-48 border rounded px-2 py-1"
                              placeholder="Lý do"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) => handleItemChange(index, "note", e.target.value)}
                              className="w-48 border rounded px-2 py-1"
                              placeholder="Ghi chú"
                            />
                          </td>
                          {!isEdit && (
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
                          )}
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
                onClick={() => navigate("/sales/return-orders")}
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
            <h3 className="text-lg font-semibold text-gray-900">Chọn phiếu giao hàng</h3>
            <p className="text-sm text-gray-500">Tìm và chọn phiếu giao hàng đã giao</p>
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
            placeholder="Tìm theo số phiếu giao hàng, khách hàng hoặc đơn bán hàng..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách phiếu giao hàng...</div>
          ) : deliveries.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có phiếu giao hàng nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số phiếu giao hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Đơn bán hàng
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
