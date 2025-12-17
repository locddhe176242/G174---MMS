import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import apiClient from "../../../api/apiClient";
import { getCurrentUser } from "../../../api/authService";
import { inboundDeliveryService } from "../../../api/inboundDeliveryService";

export default function InboundDeliveryForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const poIdFromQuery = searchParams.get("po_id");

    const [formData, setFormData] = useState({
        inbound_delivery_no: "",
        order_id: null,
        vendor_id: null,
        warehouse_id: null,
        planned_date: new Date(),
        status: "Draft",
        notes: "",
        items: [],
    });

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [poReferenceItems, setPoReferenceItems] = useState([]);
    const [vendorsMap, setVendorsMap] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const plannedDateValue = useMemo(() => {
        if (!formData.planned_date) return null;
        return formData.planned_date instanceof Date
            ? formData.planned_date
            : new Date(formData.planned_date);
    }, [formData.planned_date]);

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                await Promise.all([
                    loadCurrentUser(),
                    loadWarehouses(),
                    loadVendors(),
                    loadPurchaseOrders(),
                ]);

                if (isEdit) {
                    await loadInboundDelivery();
                } else {
                    // Generate unique document number for new form
                    await generateDocumentNumber();
                    
                    if (poIdFromQuery) {
                        await loadPurchaseOrderItems(poIdFromQuery);
                        setFormData((prev) => ({
                            ...prev,
                            order_id: parseInt(poIdFromQuery, 10),
                        }));
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, poIdFromQuery]);

    const generateDocumentNumber = async () => {
        try {
            const generatedNo = await inboundDeliveryService.generateInboundDeliveryNo();
            setFormData((prev) => ({
                ...prev,
                inbound_delivery_no: generatedNo,
            }));
        } catch (err) {
            console.error("Error generating document number:", err);
            toast.error("Không thể tạo mã chứng từ tự động");
        }
    };

    const loadCurrentUser = async () => {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user || null);
        } catch (err) {
            console.warn("Could not load current user:", err);
        }
    };

    const loadWarehouses = async () => {
        try {
            const response = await apiClient.get("/warehouses/page", {
                params: { page: 0, size: 100 },
            });
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.content || [];
            setWarehouses(
                data.map((warehouse) => ({
                    value:
                        warehouse.warehouseId ||
                        warehouse.warehouse_id ||
                        warehouse.id,
                    label: warehouse.name,
                    warehouse,
                }))
            );
        } catch (err) {
            console.error("Error loading warehouses:", err);
            toast.error("Không thể tải danh sách kho");
        }
    };

    const loadVendors = async () => {
        try {
            const response = await apiClient.get("/vendors");
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.content || [];

            const map = {};
            data.forEach((v) => {
                const vendorId = v.vendorId || v.vendor_id || v.id;
                if (!vendorId) return;
                map[vendorId] = v;
            });
            setVendorsMap(map);
        } catch (err) {
            console.error("Error loading vendors:", err);
        }
    };

    const loadPurchaseOrders = async () => {
        try {
            const response = await apiClient.get("/purchase-orders/page", {
                params: { page: 0, size: 100, sort: "createdAt,desc" },
            });
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.content || [];

            const eligibleOrders = data.filter((order) => {
                const status = (order.status || "").toString();
                const approvalStatus =
                    order.approvalStatus?.toString() ||
                    order.approval_status?.toString() ||
                    order.approvalStatus ||
                    order.approval_status ||
                    "";
                const isApproved = approvalStatus.toUpperCase() === "APPROVED";
                const isValidStatus = ["APPROVED", "SENT"].includes(
                    status.toUpperCase()
                );
                return isApproved && isValidStatus;
            });

            setPurchaseOrders(
                eligibleOrders.map((order) => {
                    const poNo = order.poNo || order.po_no;
                    const vendorName =
                        order.vendorName || order.vendor?.name || "N/A";
                    return {
                        value:
                            order.orderId || order.order_id || order.id,
                        label: `${poNo} - ${vendorName}`,
                        order,
                    };
                })
            );
        } catch (err) {
            console.error("Error loading purchase orders:", err);
            toast.error("Không thể tải danh sách đơn hàng");
        }
    };

    const loadPurchaseOrderItems = async (orderId) => {
        if (!orderId) return;
        try {
            const response = await apiClient.get(
                `/purchase-orders/${orderId}/items`
            );
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.content || [];
            setPoReferenceItems(data);

            const mapped = data.map((poItem) => {
                const orderedQty =
                    Number(poItem.quantity || poItem.order_qty || 0);
                return {
                    poi_id: poItem.poiId || poItem.poi_id || poItem.id,
                    product_id:
                        poItem.productId ||
                        poItem.product_id ||
                        poItem.product?.id,
                    productName:
                        poItem.productName ||
                        poItem.product_name ||
                        poItem.product?.name ||
                        "-",
                    productCode:
                        poItem.productCode || poItem.product?.sku || "",
                    ordered_qty: orderedQty,
                    expected_qty: orderedQty,
                    uom:
                        poItem.uom ||
                        poItem.product?.uom ||
                        poItem.product?.unit ||
                        "",
                    notes: "",
                };
            });

            setFormData((prev) => ({
                ...prev,
                items: mapped,
                vendor_id:
                    data[0]?.vendorId ||
                    data[0]?.vendor_id ||
                    data[0]?.vendor?.vendorId ||
                    prev.vendor_id,
            }));
        } catch (err) {
            console.error("Error loading purchase order items:", err);
            toast.error("Không thể tải danh sách sản phẩm của đơn hàng");
        }
    };

    const loadInboundDelivery = async () => {
        try {
            setLoading(true);
            const inbound = await inboundDeliveryService.getInboundDeliveryById(id);

            const items = Array.isArray(inbound.items)
                ? inbound.items
                : inbound.items?.content || [];

            setFormData({
                inbound_delivery_no:
                    inbound.inboundDeliveryNo ||
                    inbound.inbound_delivery_no ||
                    "",
                order_id: inbound.orderId || inbound.order_id || null,
                vendor_id: inbound.vendorId || inbound.vendor_id || null,
                warehouse_id:
                    inbound.warehouseId || inbound.warehouse_id || null,
                planned_date: inbound.plannedDate || inbound.planned_date
                    ? new Date(
                          inbound.plannedDate || inbound.planned_date
                      )
                    : new Date(),
                status: inbound.status || "Draft",
                notes: inbound.notes || "",
                items: items.map((it) => ({
                    idi_id: it.idiId || it.idi_id || it.id,
                    poi_id: it.poiId || it.poi_id,
                    product_id: it.productId || it.product_id,
                    productName: it.productName || "-",
                    productCode: it.productCode || "",
                    ordered_qty: it.orderedQty || it.ordered_qty || null,
                    expected_qty:
                        Number(it.expectedQty || it.expected_qty || 0),
                    uom: it.uom || "",
                    notes: it.notes || "",
                })),
            });

            if (inbound.orderId || inbound.order_id) {
                await loadPurchaseOrderItems(
                    inbound.orderId || inbound.order_id
                );
            }
        } catch (err) {
             console.error("Error loading Inbound Delivery:", err);
             setError("Không thể tải Phiếu nhập kho dự kiến");
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
            const order = option.order;
            const vendorId =
                order.vendorId ||
                order.vendor_id ||
                order.vendor?.vendorId ||
                order.vendor?.vendor_id;
            if (vendorId) {
                handleInputChange("vendor_id", vendorId);
            }
        } else {
            handleInputChange("order_id", null);
            handleInputChange("vendor_id", null);
            setFormData((prev) => ({ ...prev, items: [] }));
            setPoReferenceItems([]);
        }
    };

    const handleWarehouseChange = (option) => {
        handleInputChange("warehouse_id", option ? option.value : null);
    };

    const handleStatusChange = (e) => {
        handleInputChange("status", e.target.value);
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
        if (!formData.inbound_delivery_no || !formData.inbound_delivery_no.trim()) {
            errors.inbound_delivery_no = "Số chứng từ là bắt buộc";
        }
        if (!formData.order_id) {
            errors.order_id = "Chọn Đơn hàng mua";
        }
        if (!formData.vendor_id) {
            errors.vendor_id = "Không tìm thấy nhà cung cấp, vui lòng chọn lại đơn hàng";
        }
        if (!formData.warehouse_id) {
            errors.warehouse_id = "Chọn kho nhận hàng";
        }
        if (!formData.items || formData.items.length === 0) {
            errors.items = "Cần ít nhất 1 dòng sản phẩm";
        } else {
            const itemErrors = formData.items.map((item) => {
                const err = {};
                const expectedQty = Number(item.expected_qty || 0);
                if (!item.product_id) {
                    err.product_id = "Thiếu sản phẩm";
                }
                if (!item.poi_id) {
                    err.poi_id = "Thiếu dòng đơn hàng (PO Item)";
                }
                if (!expectedQty || expectedQty <= 0) {
                    err.expected_qty = "SL dự kiến > 0";
                }
                return err;
            });
            if (itemErrors.some((e) => Object.keys(e).length > 0)) {
                errors.itemDetails = itemErrors;
            }
        }
        return errors;
    };

    const formatDateTimeForBackend = (value) => {
        if (!value) return null;
        const d = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");
        // Format for Java LocalDateTime (no timezone)
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setValidationErrors({});

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setIsSubmitting(false);
            toast.error("Vui lòng kiểm tra lại thông tin form!");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        try {
            const userId =
                currentUser?.userId ||
                currentUser?.user_id ||
                currentUser?.id ||
                null;

            const payload = {
                inboundDeliveryNo: formData.inbound_delivery_no,
                orderId: formData.order_id,
                warehouseId: formData.warehouse_id,
                plannedDate: formatDateTimeForBackend(formData.planned_date),
                vendorId: formData.vendor_id,
                status: formData.status || "Draft",
                notes: formData.notes || "",
                items: formData.items.map((item) => ({
                    poiId: item.poi_id,
                    productId: item.product_id,
                    expectedQty: Number(item.expected_qty || 0),
                    uom: item.uom || "",
                    notes: item.notes || "",
                })),
            };

            if (isEdit) {
                 await inboundDeliveryService.updateInboundDelivery(id, payload);
                 toast.success("Cập nhật Phiếu nhập kho dự kiến thành công!");
            } else {
                 await inboundDeliveryService.createInboundDelivery(payload);
                 toast.success("Tạo Phiếu nhập kho dự kiến thành công!");
            }

            navigate("/purchase/inbound-deliveries");
        } catch (err) {
            console.error("Error saving Inbound Delivery:", err);
            console.error("Error response:", err.response?.data);
            const backendErrors = err.response?.data?.errors;
            const errorMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message;

            if (backendErrors && typeof backendErrors === "object") {
                const errorMessages = Object.entries(backendErrors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(", ");
                setError(`Lỗi validate: ${errorMessages}`);
                toast.error(`Lỗi validate: ${errorMessages}`);
             } else if (errorMessage) {
                 setError(errorMessage);
                 toast.error(errorMessage);
             } else {
                 const defaultMsg = isEdit
                     ? "Không thể cập nhật Phiếu nhập kho dự kiến"
                     : "Không thể tạo Phiếu nhập kho dự kiến";
                 setError(defaultMsg);
                 toast.error(defaultMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/purchase/inbound-deliveries");
    };

    const selectedOrder = purchaseOrders.find(
        (opt) => opt.value === formData.order_id
    );

    const selectedWarehouse = warehouses.find(
        (opt) => opt.value === formData.warehouse_id
    );

    const vendorInfo =
        formData.vendor_id && vendorsMap[formData.vendor_id]
            ? vendorsMap[formData.vendor_id]
            : null;

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
                             {isEdit
                                 ? "Cập nhật Phiếu nhập kho dự kiến"
                                 : "Tạo Phiếu nhập kho dự kiến"}
                         </h1>
                        <button
                            onClick={handleCancel}
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
                             <h2 className="text-lg font-semibold text-gray-900">
                                 Thông tin Phiếu nhập kho dự kiến
                             </h2>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-6 space-y-8"
                        >
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-800">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số chứng từ{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                formData.inbound_delivery_no
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "inbound_delivery_no",
                                                    e.target.value
                                                )
                                            }
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                validationErrors.inbound_delivery_no
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                            }`}
                                            placeholder="Nhập số chứng từ hoặc để trống để tự động tạo"
                                        />
                                        {validationErrors.inbound_delivery_no && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {
                                                    validationErrors.inbound_delivery_no
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {isEdit && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Trạng thái
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={handleStatusChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value="Draft">
                                                    Nháp (Đang soạn)
                                                </option>
                                                <option value="Pending">
                                                    Chờ nhập kho
                                                </option>
                                                <option value="Completed">
                                                    Đã nhập kho
                                                </option>
                                                <option value="Cancelled">
                                                    Đã hủy
                                                </option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{!isEdit && (
                                        <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-800">
                                                <span className="font-medium">💡 Lưu ý:</span> Sau khi lưu, trạng thái sẽ là "Nháp". Bạn cần vào chi tiết và click "Gửi đi" để thông báo.
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Đơn hàng mua{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                       </label>
                                        <Select
                                            value={selectedOrder || null}
                                            onChange={handleOrderChange}
                                            options={purchaseOrders}
                                            placeholder="Chọn Đơn hàng mua (chỉ hiển thị PO đã duyệt)"
                                            isClearable
                                            classNamePrefix="react-select"
                                        />
                                        {validationErrors.order_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.order_id}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kho nhận hàng{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <Select
                                            value={selectedWarehouse || null}
                                            onChange={handleWarehouseChange}
                                            options={warehouses}
                                            placeholder="Chọn kho"
                                            isClearable
                                            classNamePrefix="react-select"
                                        />
                                        {validationErrors.warehouse_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.warehouse_id}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nhà cung cấp
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                vendorInfo
                                                    ? vendorInfo.name ||
                                                      vendorInfo.vendorName ||
                                                      ""
                                                    : ""
                                            }
                                            readOnly
                                            className={`w-full px-3 py-2 border rounded-lg bg-gray-100 ${
                                                validationErrors.vendor_id
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                            }`}
                                            placeholder="Tự động từ Đơn hàng mua"
                                        />
                                        {validationErrors.vendor_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.vendor_id}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày dự kiến nhận hàng
                                        </label>
                                        <DatePicker
                                            selected={plannedDateValue}
                                            onChange={(date) =>
                                                handleInputChange(
                                                    "planned_date",
                                                    date
                                                )
                                            }
                                            minDate={new Date()}
                                            dateFormat="dd/MM/yyyy"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholderText="Chọn ngày dự kiến nhận"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "notes",
                                                e.target.value
                                            )
                                        }
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Ghi chú thêm về lô hàng / yêu cầu đặc biệt..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Danh sách sản phẩm
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Hệ thống tự động lấy sản phẩm từ Đơn
                                        hàng mua đã chọn
                                    </p>
                                </div>

                                {validationErrors.items && (
                                    <p className="text-red-500 text-sm">
                                        {validationErrors.items}
                                    </p>
                                )}

                                {formData.items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                                        Vui lòng chọn Đơn hàng mua để hiển thị
                                        danh sách sản phẩm
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-200 px-2 py-1 text-center text-xs font-medium text-gray-700 w-12">
                                                        #
                                                    </th>
                                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">
                                                        Sản phẩm
                                                    </th>
                                                    <th className="border border-gray-200 px-2 py-1 text-right text-xs font-medium text-gray-700 w-24">
                                                        SL PO
                                                    </th>
                                                    <th className="border border-gray-200 px-2 py-1 text-right text-xs font-medium text-gray-700 w-28">
                                                        SL dự kiến
                                                    </th>
                                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700 w-20">
                                                        ĐVT
                                                    </th>
                                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700 w-48">
                                                        Ghi chú
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.items.map(
                                                    (item, index) => {
                                                        const itemErr =
                                                            validationErrors
                                                                .itemDetails?.[
                                                                index
                                                            ] || {};
                                                        return (
                                                            <tr
                                                                key={
                                                                    item.poi_id ||
                                                                    index
                                                                }
                                                                className="hover:bg-gray-50"
                                                            >
                                                                <td className="border border-gray-200 px-2 py-1 text-xs text-gray-700 text-center">
                                                                    {index + 1}
                                                                </td>
                                                                <td className="border border-gray-200 px-2 py-1">
                                                                    <div className="text-sm font-medium">
                                                                        {item.productName ||
                                                                            "-"}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        SKU:{" "}
                                                                        {item.productCode ||
                                                                            "-"}
                                                                    </div>
                                                                </td>
                                                                <td className="border border-gray-200 px-2 py-1 text-right text-sm text-gray-700">
                                                                    {Number(
                                                                        item.ordered_qty ||
                                                                            0
                                                                    ).toLocaleString()}
                                                                </td>
                                                                <td className="border border-gray-200 px-2 py-1">
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            item.expected_qty
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleItemChange(
                                                                                index,
                                                                                "expected_qty",
                                                                                parseFloat(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ) ||
                                                                                    0
                                                                            )
                                                                        }
                                                                        className={`w-24 px-2 py-1 border rounded text-sm text-right ${
                                                                            itemErr.expected_qty
                                                                                ? "border-red-500"
                                                                                : "border-gray-300"
                                                                        }`}
                                                                        min="0"
                                                                        step="0.01"
                                                                    />
                                                                    {itemErr.expected_qty && (
                                                                        <p className="text-red-500 text-xs mt-0.5">
                                                                            {
                                                                                itemErr.expected_qty
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="border border-gray-200 px-2 py-1 text-sm text-gray-700">
                                                                    {item.uom ||
                                                                        "-"}
                                                                </td>
                                                                <td className="border border-gray-200 px-2 py-1">
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.notes
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleItemChange(
                                                                                index,
                                                                                "notes",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                                        placeholder="Ghi chú"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCancel}
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
                                             <svg
                                                 className="animate-spin h-4 w-4"
                                                 fill="none"
                                                 viewBox="0 0 24 24"
                                             >
                                                 <circle
                                                     className="opacity-25"
                                                     cx="12"
                                                     cy="12"
                                                     r="10"
                                                     stroke="currentColor"
                                                     strokeWidth="4"
                                                 ></circle>
                                                 <path
                                                     className="opacity-75"
                                                     fill="currentColor"
                                                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                 ></path>
                                             </svg>
                                             Đang lưu...
                                         </>
                                     ) : (
                                         "Lưu"
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


