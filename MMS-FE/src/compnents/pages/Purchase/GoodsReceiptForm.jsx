import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { goodsReceiptService } from "../../../api/goodsReceiptService";
import { getCurrentUser } from "../../../api/authService";
import apiClient from "../../../api/apiClient";

export default function GoodsReceiptForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const poIdFromQuery = searchParams.get("po_id");

    const [formData, setFormData] = useState({
        receipt_no: "",
        order_id: null,
        warehouse_id: null,
        received_date: new Date(),
        status: "Pending",
        items: [],
    });

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [poReferenceItems, setPoReferenceItems] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const formattedDate = useMemo(() => {
        if (!formData.received_date) return "";
        if (formData.received_date instanceof Date) {
            return formData.received_date;
        }
        return new Date(formData.received_date);
    }, [formData.received_date]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.warn("Could not load current user:", error);
            }
        };
        
        loadUser();
        loadWarehouses();
        loadPurchaseOrders();
        if (isEdit) {
            loadReceipt();
        } else {
            generateReceiptNumber();
            if (poIdFromQuery) {
                console.log("Auto-loading PO from query:", poIdFromQuery);
                loadPurchaseOrderItems(poIdFromQuery);
                setFormData((prev) => ({ ...prev, order_id: parseInt(poIdFromQuery) }));
            }
        }
    }, [isEdit, id, poIdFromQuery]);

    const generateReceiptNumber = async () => {
        try {
            const response = await goodsReceiptService.generateReceiptNo();
            if (response?.receipt_no || response?.receiptNo) {
                setFormData((prev) => ({
                    ...prev,
                    receipt_no: response.receipt_no || response.receiptNo,
                }));
            }
        } catch (err) {
            console.warn("Could not generate receipt number:", err);
        }
    };

    const loadWarehouses = async () => {
        try {
            const response = await apiClient.get("/warehouses/page", {
                params: { page: 0, size: 100 },
            });
            const data = Array.isArray(response.data) ? response.data : response.data?.content || [];
            console.log("Warehouses loaded:", data);
            setWarehouses(
                data.map((warehouse) => ({
                    value: warehouse.warehouseId || warehouse.warehouse_id || warehouse.id,
                    label: warehouse.name,
                    warehouse,
                }))
            );
        } catch (err) {
            console.error("Error loading warehouses:", err);
            toast.error("Không thể tải danh sách kho");
        }
    };

    const loadPurchaseOrders = async () => {
        try {
            const response = await apiClient.get("/purchase-orders/page", {
                params: { page: 0, size: 100, sort: "createdAt,desc" },
            });
            const data = Array.isArray(response.data) ? response.data : response.data?.content || [];
            
            // Filter: Chỉ lấy PO đã Approved và chưa Completed
            const eligibleOrders = data.filter((order) => {
                const status = order.status?.toString() || order.status || "";
                const approvalStatus = order.approvalStatus?.toString() || order.approval_status?.toString() || order.approvalStatus || order.approval_status || "";
                
                // Chỉ lấy PO đã Approved và status là Approved/Sent (không lấy Rejected, Pending, Completed, Cancelled)
                const isApproved = approvalStatus.toUpperCase() === "APPROVED";
                const isValidStatus = ["APPROVED", "SENT"].includes(status.toUpperCase());
                
                return isApproved && isValidStatus;
            });

            // Check xem PO nào đã có Goods Receipt
            const ordersWithGRStatus = await Promise.all(
                eligibleOrders.map(async (order) => {
                    try {
                        const orderId = order.orderId || order.order_id || order.id;
                        const grResponse = await apiClient.get(`/goods-receipts/po/${orderId}`);
                        const receipts = grResponse.data || [];
                        const hasReceipt = Array.isArray(receipts) && receipts.length > 0;
                        return {
                            ...order,
                            hasReceipt
                        };
                    } catch (err) {
                        // Nếu 404 = chưa có GR
                        return {
                            ...order,
                            hasReceipt: false
                        };
                    }
                })
            );

            setPurchaseOrders(
                ordersWithGRStatus.map((order) => {
                    const poNo = order.poNo || order.po_no;
                    const vendorName = order.vendorName || order.vendor?.name || "N/A";
                    const suffix = order.hasReceipt ? " (Đã nhập kho)" : "";
                    
                    return {
                        value: order.orderId || order.order_id || order.id,
                        label: `${poNo} - ${vendorName}${suffix}`,
                        order,
                        isDisabled: order.hasReceipt 
                    };
                })
            );
        } catch (err) {
            console.error("Error loading purchase orders:", err);
            toast.error("Không thể tải danh sách đơn hàng");
        }
    };

    const loadPurchaseOrderItems = async (orderId, receiptItems = null) => {
        if (!orderId) return;
        try {
            const response = await apiClient.get(`/purchase-orders/${orderId}/items`);
            console.log("=== PO ITEMS RAW RESPONSE ===", response.data);
            const data = Array.isArray(response.data) ? response.data : response.data?.content || [];
            setPoReferenceItems(data);

            if (receiptItems) {
                const merged = receiptItems.map((item) => {
                    const poItem = data.find((po) => (po.poiId || po.poi_id || po.id) === (item.poi_id || item.poiId));
                    return {
                        ...item,
                        product_id: item.product_id || poItem?.productId || poItem?.product_id || poItem?.product?.id,
                        productName:
                            poItem?.productName ||
                            poItem?.product_name ||
                            poItem?.product?.name ||
                            item.productName ||
                            item.product_name ||
                            "-",
                        productCode: poItem?.productCode || poItem?.product?.sku || item.productCode,
                        ordered_qty: poItem?.quantity || poItem?.ordered_qty || item.ordered_qty,
                    };
                });
                setFormData((prev) => ({ ...prev, items: merged }));
            } else {
                const mapped = data.map((poItem, index) => {
                    console.log(`Mapping item ${index}:`, poItem);
                    const mapped = {
                        poi_id: poItem.poiId || poItem.poi_id || poItem.id,
                        product_id: poItem.productId || poItem.product_id || poItem.product?.id,
                        productName: poItem.productName || poItem.product_name || poItem.product?.name || "-",
                        productCode: poItem.productCode || poItem.product?.sku || "",
                        ordered_qty: Number(poItem.quantity || poItem.order_qty || 0),
                        received_qty: Number(poItem.quantity || poItem.order_qty || 0),
                        accepted_qty: Number(poItem.quantity || poItem.order_qty || 0), // Will be auto-set to received_qty
                        remark: "",
                    };
                    console.log(`Mapped result ${index}:`, mapped);
                    console.log(`  -> poi_id: ${mapped.poi_id}, product_id: ${mapped.product_id}`);
                    return mapped;
                });
                console.log("=== FINAL MAPPED ITEMS ===", mapped);
                setFormData((prev) => ({ ...prev, items: mapped }));
            }
        } catch (err) {
            console.error("Error loading purchase order items:", err);
            toast.error("Không thể tải danh sách sản phẩm của đơn hàng");
        }
    };

    const loadReceipt = async () => {
        try {
            setLoading(true);
            const receipt = await goodsReceiptService.getGoodsReceiptById(id);
            console.log("Loading receipt for edit:", receipt);
            
            // Get items from receipt detail response
            const receiptItems = Array.isArray(receipt.items) ? receipt.items : receipt.items?.content || [];
            console.log("Receipt items for edit:", receiptItems);

            setFormData({
                receipt_no: receipt.receipt_no || receipt.receiptNo || "",
                order_id: receipt.order_id || receipt.orderId || null,
                warehouse_id: receipt.warehouse_id || receipt.warehouseId || null,
                received_date: receipt.received_date || receipt.receivedDate ? new Date(receipt.received_date || receipt.receivedDate) : new Date(),
                status: receipt.status || "Pending",
                items: receiptItems.map((item) => ({
                    gri_id: item.griId || item.gri_id || item.id,
                    poi_id: item.poiId || item.poi_id,
                    product_id: item.productId || item.product_id,
                    productName: item.productName || item.product_name || "-",
                    productCode: item.productCode || item.product_code || "",
                    ordered_qty: item.orderedQty || item.ordered_qty || 0,
                    received_qty: Number(item.receivedQty || item.received_qty || 0),
                    accepted_qty: Number(item.receivedQty || item.received_qty || 0), // Auto-accept received qty
                    remark: item.remark || "",
                })),
            });

            if (receipt.order_id || receipt.orderId) {
                await loadPurchaseOrderItems(receipt.order_id || receipt.orderId, receiptItems);
            }
        } catch (err) {
            console.error("Error loading Goods Receipt:", err);
            console.error("Error details:", err.response?.data);
            setError("Không thể tải Phiếu nhập kho");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const handleOrderChange = (option) => {
        if (option) {
            handleInputChange("order_id", option.value);
            loadPurchaseOrderItems(option.value);
        } else {
            handleInputChange("order_id", null);
            setFormData((prev) => ({ ...prev, items: [] }));
            setPoReferenceItems([]);
        }
    };

    const handleWarehouseChange = (option) => {
        handleInputChange("warehouse_id", option ? option.value : null);
    };

    const handleItemChange = (index, field, value) => {
        setFormData((prev) => {
            const next = [...prev.items];
            next[index] = {
                ...next[index],
                [field]: value,
            };
            return { ...prev, items: next };
        });
    };

    const validate = () => {
        const errors = {};
        if (!formData.receipt_no) {
            errors.receipt_no = "Số phiếu là bắt buộc";
        }
        if (!formData.order_id) {
            errors.order_id = "Chọn đơn hàng";
        }
        if (!formData.warehouse_id) {
            errors.warehouse_id = "Chọn kho nhận";
        }
        if (!formData.items || formData.items.length === 0) {
            errors.items = "Cần ít nhất 1 dòng sản phẩm";
        } else {
            const itemErrors = formData.items.map((item) => {
                const err = {};
                if (!item.received_qty || Number(item.received_qty) <= 0) {
                    err.received_qty = "SL nhận > 0";
                }
                // Accepted qty validation removed - no longer needed
                return err;
            });
            if (itemErrors.some((e) => Object.keys(e).length > 0)) {
                errors.itemDetails = itemErrors;
            }
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        console.log("=== HANDLE SUBMIT CALLED ===");
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setValidationErrors({});

        console.log("=== VALIDATING FORM ===");
        console.log("FormData:", formData);
        console.log("FormData.items:", formData.items);
        
        const errors = validate();
        console.log("Validation errors:", errors);
    
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setIsSubmitting(false);
            toast.error("Vui lòng kiểm tra lại thông tin form!");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        console.log("=== VALIDATION PASSED, BUILDING PAYLOAD ===");

        try {
            const payload = {
                receiptNo: formData.receipt_no,
                orderId: formData.order_id,
                warehouseId: formData.warehouse_id,
                receivedDate: formData.received_date instanceof Date ? formData.received_date.toISOString() : formData.received_date,
                status: formData.status,
                items: formData.items.map((item, index) => {
                    console.log(`Item ${index}:`, item);
                    return {
                        poiId: item.poi_id,
                        productId: item.product_id,
                        receivedQty: Number(item.received_qty || 0),
                        acceptedQty: Number(item.received_qty || 0), // Auto-accept all received qty
                        remark: item.remark || "",
                    };
                }),
            };

            console.log("=== SUBMITTING PAYLOAD ===", payload);
            console.log("Items detail:", payload.items);

            const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id || 1; // Fallback to 1 for testing
            console.log("Current user:", currentUser);
            console.log("User ID:", userId);
            
            if (isEdit) {
                console.log("Updating with userId:", userId);
                await goodsReceiptService.updateGoodsReceipt(id, payload, userId);
                toast.success("Cập nhật Phiếu nhập kho thành công!");
            } else {
                console.log("Creating with userId:", userId);
                await goodsReceiptService.createGoodsReceipt(payload, userId);
                toast.success("Tạo Phiếu nhập kho thành công!");
            }
            navigate("/purchase/goods-receipts");
        } catch (err) {
            console.error("Error saving Goods Receipt:", err);
            console.error("Error response:", err.response?.data);
            console.error("Validation errors from backend:", err.response?.data?.errors);
            
            const backendErrors = err.response?.data?.errors;
            if (backendErrors && typeof backendErrors === 'object') {
                const errorMessages = Object.entries(backendErrors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(', ');
                setError(`Lỗi validate: ${errorMessages}`);
            } else {
                setError(err?.response?.data?.message || (isEdit ? "Không thể cập nhật Phiếu nhập kho" : "Không thể tạo Phiếu nhập kho"));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEdit ? "Cập nhật Phiếu nhập kho" : "Tạo Phiếu nhập kho"}
                        </h1>
                        <button
                            onClick={() => navigate("/purchase/goods-receipts")}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Thông tin Phiếu nhập kho</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số phiếu <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.receipt_no}
                                            readOnly
                                            className={`w-full px-3 py-2 border rounded-lg bg-gray-100 ${validationErrors.receipt_no ? "border-red-500" : "border-gray-300"}`}
                                            placeholder="Số phiếu tự động"
                                        />
                                        {validationErrors.receipt_no && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.receipt_no}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trạng thái
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.status}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Đơn hàng <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            value={purchaseOrders.find((opt) => opt.value === formData.order_id) || null}
                                            onChange={handleOrderChange}
                                            options={purchaseOrders}
                                            placeholder="Chọn đơn hàng (chỉ hiện PO đã duyệt)"
                                            isClearable
                                            classNamePrefix="react-select"
                                            isOptionDisabled={(option) => option.isDisabled}
                                            styles={{
                                                option: (provided, state) => ({
                                                    ...provided,
                                                    color: state.isDisabled ? '#9ca3af' : provided.color,
                                                    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                                                    fontStyle: state.isDisabled ? 'italic' : 'normal',
                                                    backgroundColor: state.isDisabled 
                                                        ? '#f3f4f6' 
                                                        : state.isFocused 
                                                        ? '#e5e7eb' 
                                                        : provided.backgroundColor
                                                })
                                            }}
                                        />
                                        {validationErrors.order_id && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.order_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kho nhận <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            value={warehouses.find((opt) => opt.value === formData.warehouse_id) || null}
                                            onChange={handleWarehouseChange}
                                            options={warehouses}
                                            placeholder="Chọn kho"
                                            isClearable
                                            classNamePrefix="react-select"
                                        />
                                        {validationErrors.warehouse_id && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.warehouse_id}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày nhận
                                        </label>
                                        <DatePicker
                                            selected={formattedDate}
                                            onChange={(date) => handleInputChange("received_date", date)}
                                            dateFormat="dd/MM/yyyy"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
                                    <p className="text-sm text-gray-500">
                                        Hệ thống tự động lấy sản phẩm từ đơn hàng đã chọn
                                    </p>
                                </div>

                                {validationErrors.items && (
                                    <p className="text-red-500 text-sm">{validationErrors.items}</p>
                                )}

                                {formData.items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                                        Vui lòng chọn đơn hàng để hiển thị danh sách sản phẩm
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-200 px-2 py-1 text-center text-xs font-medium text-gray-700 w-12">#</th>
                                                <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">Sản phẩm</th>
                                                <th className="border border-gray-200 px-2 py-1 text-right text-xs font-medium text-gray-700 w-28">SL đặt</th>
                                                <th className="border border-gray-200 px-2 py-1 text-right text-xs font-medium text-gray-700 w-32">SL nhận</th>
                                                <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700 w-48">Ghi chú</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {formData.items.map((item, index) => {
                                                const itemErr = validationErrors.itemDetails?.[index] || {};
                                                return (
                                                    <tr key={item.poi_id || index} className="hover:bg-gray-50">
                                                        <td className="border border-gray-200 px-2 py-1 text-xs text-gray-700 text-center">
                                                            {index + 1}
                                                        </td>
                                                        <td className="border border-gray-200 px-2 py-1">
                                                            <div className="text-sm font-medium">{item.productName || "-"}</div>
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {item.productCode || "-"}
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-200 px-2 py-1 text-right text-sm text-gray-700">
                                                            {Number(item.ordered_qty || 0).toLocaleString()}
                                                        </td>
                                                        <td className="border border-gray-200 px-2 py-1">
                                                            <input
                                                                type="number"
                                                                value={item.received_qty}
                                                                onChange={(e) => handleItemChange(index, "received_qty", parseFloat(e.target.value) || 0)}
                                                                className={`w-24 px-2 py-1 border rounded text-sm text-right ${itemErr.received_qty ? "border-red-500" : "border-gray-300"}`}
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                            {itemErr.received_qty && (
                                                                <p className="text-red-500 text-xs mt-0.5">{itemErr.received_qty}</p>
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-200 px-2 py-1">
                                                            <input
                                                                type="text"
                                                                value={item.remark}
                                                                onChange={(e) => handleItemChange(index, "remark", e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                                placeholder="Ghi chú"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => navigate("/purchase/goods-receipts")}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        isEdit ? "Cập nhật" : "Tạo Phiếu nhập kho"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

