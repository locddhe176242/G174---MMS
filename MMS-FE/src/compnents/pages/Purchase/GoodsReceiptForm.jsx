import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { goodsReceiptService } from "../../../api/goodsReceiptService";
import { getCurrentUser } from "../../../api/authService";
import { salesReturnInboundOrderService } from "../../../api/salesReturnInboundOrderService";
import apiClient from "../../../api/apiClient";

export default function GoodsReceiptForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const poIdFromQuery = searchParams.get("po_id");
    const sriIdFromQuery = searchParams.get("sriId");
    
    // Source type selection: 'purchase' or 'salesReturn'
    const [sourceType, setSourceType] = useState(sriIdFromQuery ? 'salesReturn' : 'purchase');
    
    // Determine if in Sales Return mode (from URL or user selection)
    const isSalesReturnMode = sourceType === 'salesReturn' || Boolean(sriIdFromQuery);

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
    const [salesReturnInboundOrder, setSalesReturnInboundOrder] = useState(null);
    
    // Picker modal states
    const [showSriPicker, setShowSriPicker] = useState(false);
    const [sriList, setSriList] = useState([]);
    const [sriSearchTerm, setSriSearchTerm] = useState("");
    const [loadingSriList, setLoadingSriList] = useState(false);

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Function to translate status to Vietnamese
    const getStatusInVietnamese = (status) => {
        const statusMap = {
            'Pending': 'Chờ xử lý',
            'Approved': 'Đã duyệt',
            'Rejected': 'Từ chối',
            'Draft': 'Nháp',
            'Completed': 'Hoàn thành'
        };
        return statusMap[status] || status;
    };

    const formattedDate = useMemo(() => {
        if (!formData.received_date) return "";
        if (formData.received_date instanceof Date) {
            return formData.received_date;
        }
        return new Date(formData.received_date);
    }, [formData.received_date]);

    // Debug: Log search params changes
    useEffect(() => {
        console.log("=== GoodsReceiptForm - Search Params Changed ===", {
            id,
            isEdit,
            poIdFromQuery,
            sriIdFromQuery,
            isSalesReturnMode,
            allSearchParams: Object.fromEntries(searchParams.entries()),
            currentURL: window.location.href
        });
    }, [searchParams, id, isEdit, poIdFromQuery, sriIdFromQuery, isSalesReturnMode]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.warn("Không thể tải thông tin người dùng:", error);
            }
        };
        
        loadUser();
        loadWarehouses();
        if (!isSalesReturnMode) {
        loadPurchaseOrders();
        }
        if (isEdit) {
            loadReceipt();
        } else {
            generateReceiptNumber();
            if (isSalesReturnMode && sriIdFromQuery) {
                console.log("=== Đã phát hiện chế độ Đơn nhập hàng lại ===", { sriIdFromQuery, isSalesReturnMode });
                loadSalesReturnInboundOrder(sriIdFromQuery);
            } else if (poIdFromQuery) {
                console.log("Tự động tải PO từ query:", poIdFromQuery);
                loadPOItems(poIdFromQuery);
            }
        }
    }, [isEdit, id, poIdFromQuery, sriIdFromQuery]);

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
            console.warn("Không thể tạo số phiếu:", err);
        }
    };

    const loadWarehouses = async () => {
        try {
            const response = await apiClient.get("/warehouses/page", {
                params: { page: 0, size: 100 },
            });
            const data = Array.isArray(response.data) ? response.data : response.data?.content || [];
            console.log("Đã tải danh sách kho:", data);
            setWarehouses(
                data.map((warehouse) => ({
                    value: warehouse.warehouseId || warehouse.warehouse_id || warehouse.id,
                    label: warehouse.name,
                    warehouse,
                }))
            );
        } catch (err) {
            console.error("Lỗi khi tải danh sách kho:", err);
            toast.error("Không thể tải danh sách kho");
        }
    };

    const loadPurchaseOrders = async () => {
        try {
            const response = await apiClient.get("/purchase-orders/page", {
                params: { page: 0, size: 100, sort: "createdAt,desc" },
            });
            const data = Array.isArray(response.data) ? response.data : response.data?.content || [];
            
            // Filter: Chỉ lấy PO đã Approved và chưa nhập kho hoàn tất
            const eligiblePOs = data.filter((po) => {
                const approvalStatus = po.approvalStatus || po.approval_status || "";
                const hasGoodsReceipt = po.hasGoodsReceipt || false;
                return approvalStatus.toUpperCase() === "APPROVED" && !hasGoodsReceipt;
            });

            setPurchaseOrders(
                eligiblePOs.map((po) => {
                    const poNo = po.poNo || po.po_no;
                    const poId = po.orderId || po.order_id || po.id;
                    const vendorName = po.vendorName || po.vendor?.name || "N/A";
                    
                        return {
                        value: poId,
                        label: `${poNo} - ${vendorName}`,
                        po,
                        isDisabled: false
                    };
                })
            );
                    } catch (err) {
            console.error("Lỗi khi tải danh sách đơn hàng:", err);
            toast.error("Đông thể tải danh sách đơn hàng");
        }
    };

    const loadSalesReturnInboundOrderList = async () => {
        try {
            setLoadingSriList(true);
            const response = await salesReturnInboundOrderService.getAll();
            console.log("=== Phản hồi danh sách Đơn nhập hàng lại ===", response);
            
            // Handle different response formats (same as SalesReturnInboundOrderList)
            let list = [];
            if (Array.isArray(response)) {
                list = response;
            } else if (response?.content && Array.isArray(response.content)) {
                list = response.content;
            } else if (response?.data && Array.isArray(response.data)) {
                list = response.data;
            }
            
            console.log("=== Danh sách đã parse ===", list);
            console.log("=== Độ dài danh sách ===", list.length);
            
            // Filter: Cho phép Draft, SentToWarehouse, hoặc Completed nhưng vẫn còn items chưa nhập đủ
            // (hỗ trợ partial receipt - nhập kho nhiều lần)
            const filtered = list.filter(sri => {
                const status = sri.status || sri.Status;
                // Cho phép Draft, SentToWarehouse, hoặc Completed (vì có thể vẫn còn items chưa nhập đủ)
                const isMatch = status === 'Draft' || status === 'SentToWarehouse' || status === 'Completed';
                console.log(`SRI ${sri.sriId || sri.sri_id}: status=${status}, match=${isMatch}`);
                return isMatch;
            });
            
            console.log("=== Danh sách đã lọc ===", filtered);
            console.log("=== Độ dài danh sách đã lọc ===", filtered.length);
            
            setSriList(filtered);
            
            if (filtered.length === 0 && list.length > 0) {
                toast.warning(`Có ${list.length} đơn nhập hàng lại nhưng không có đơn nào ở trạng thái "Approved" hoặc "SentToWarehouse"`);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách Đơn nhập hàng lại:", err);
            console.error("Chi tiết lỗi:", err.response?.data);
            toast.error("Không thể tải danh sách Đơn nhập hàng lại: " + (err.message || "Lỗi không xác định"));
        } finally {
            setLoadingSriList(false);
        }
    };

    const handleSourceTypeChange = (type) => {
        setSourceType(type);
        if (type === 'purchase') {
            setSalesReturnInboundOrder(null);
            setFormData(prev => ({ ...prev, items: [], order_id: null }));
        } else {
            setFormData(prev => ({ ...prev, items: [], order_id: null }));
            loadSalesReturnInboundOrderList();
        }
    };

    const handleSelectSri = (sri) => {
        setSalesReturnInboundOrder(sri);
        setShowSriPicker(false);
        loadSalesReturnInboundOrder(sri.sriId);
    };

    const loadSalesReturnInboundOrder = async (sriId) => {
        try {
            setLoading(true);
            console.log("=== Đang tải Đơn nhập hàng lại ===", sriId);
            const sriIdParsed = parseInt(sriId);
            if (isNaN(sriIdParsed)) {
                throw new Error("ID Đơn nhập hàng lại không hợp lệ: " + sriId);
            }
            
            const sri = await salesReturnInboundOrderService.getById(sriIdParsed);
            console.log("=== Đã tải Đơn nhập hàng lại ===", sri);
            setSalesReturnInboundOrder(sri);
            
            // Set warehouse from Sales Return Inbound Order
            if (sri.warehouseId) {
                console.log("Đang đặt kho:", sri.warehouseId);
                setFormData((prev) => ({ ...prev, warehouse_id: sri.warehouseId }));
            }
            
            // Load alreadyReceivedQty từ các Goods Receipt đã approve cho SRI này
            let alreadyReceivedMap = {}; // Map<roiId, alreadyReceivedQty>
            try {
                if (sri.roId) {
                    // Load tất cả Goods Receipts cho Return Order này
                    const allReceipts = await goodsReceiptService.getGoodsReceiptsWithPagination(0, 1000);
                    const receipts = Array.isArray(allReceipts?.content)
                        ? allReceipts.content
                        : Array.isArray(allReceipts)
                        ? allReceipts
                        : [];
                    
                    // Filter các Goods Receipts liên quan đến Return Order này và không bị từ chối
                    // (tính cả Pending và Approved để lần nhập sau thấy đúng phần còn lại)
                    const relevantReceipts = receipts.filter((gr) =>
                        (gr.status === "Approved" || gr.status === "Pending") &&
                        gr.sourceType === "SalesReturn" &&
                        // Với GoodsReceiptResponseDTO, roId nằm trực tiếp trên DTO
                        (gr.roId === sri.roId || gr.returnOrder?.roId === sri.roId)
                    );
                    
                    console.log("=== Loading alreadyReceivedQty (including Pending & Approved) ===", {
                        sriId: sriIdParsed,
                        roId: sri.roId,
                        relevantReceiptsCount: relevantReceipts.length,
                    });
                    
                    // Tính alreadyReceivedQty cho mỗi roiId
                    relevantReceipts.forEach((gr) => {
                        (gr.items || []).forEach(grItem => {
                            const roiId = grItem.roiId || grItem.returnOrderItem?.roiId;
                            if (roiId) {
                                const receivedQty = Number(grItem.receivedQty || grItem.received_qty || 0);
                                alreadyReceivedMap[roiId] = (alreadyReceivedMap[roiId] || 0) + receivedQty;
                            }
                        });
                    });
                    
                    console.log("=== Bản đồ đã nhận ===", alreadyReceivedMap);
                }
            } catch (error) {
                console.warn("Không thể load Goods Receipts để tính alreadyReceivedQty:", error);
            }
            
            // Map items from Sales Return Inbound Order
            console.log("=== Đang map sản phẩm ===", sri.items);
            if (sri.items && sri.items.length > 0) {
                // Validate: Tất cả items phải cùng warehouse
                const itemWarehouseIds = sri.items
                    .map(item => item.warehouseId || item.warehouse_id)
                    .filter(id => id != null);
                
                const uniqueWarehouseIds = [...new Set(itemWarehouseIds)];
                
                if (uniqueWarehouseIds.length > 1) {
                    const warehouseNames = sri.items
                        .map(item => item.warehouseName || item.warehouse_name || `Kho ID ${item.warehouseId || item.warehouse_id}`)
                        .filter(name => name);
                    const uniqueWarehouseNames = [...new Set(warehouseNames)];
                    
                    const errorMsg = `Đơn nhập hàng lại có sản phẩm từ nhiều kho khác nhau (${uniqueWarehouseNames.join(", ")}). Vui lòng tách thành nhiều phiếu nhập kho riêng hoặc chỉ chọn các sản phẩm từ cùng một kho.`;
                    console.error("=== VALIDATION ERROR: Multiple warehouses ===", {
                        uniqueWarehouseIds,
                        uniqueWarehouseNames,
                        items: sri.items.map(item => ({
                            product: item.productName,
                            warehouseId: item.warehouseId || item.warehouse_id,
                            warehouseName: item.warehouseName || item.warehouse_name
                        }))
                    });
                    toast.error(errorMsg);
                    setError(errorMsg);
                    setFormData((prev) => ({ ...prev, items: [] }));
                    return;
                }
                
                // Tất cả items cùng warehouse, tiếp tục map
                const mapped = sri.items.map((item, index) => {
                    const planned = Number(item.plannedQty || item.planned_qty || 0);
                    const roiId = item.roiId || item.roi_id;
                    const alreadyReceived = alreadyReceivedMap[roiId] || 0;
                    const remainingQty = Math.max(0, planned - alreadyReceived);
                    
                    const mappedItem = {
                        roi_id: roiId,
                        product_id: item.productId || item.product_id,
                        productName: item.productName || item.product_name || "-",
                        productCode: item.productCode || item.product_code || "",
                        warehouse_id: item.warehouseId || item.warehouse_id, // Lưu warehouseId của item
                        planned_qty: planned,
                        // Đặt ordered_qty = planned_qty để validation "vượt quá SL còn lại" dùng đúng số
                        ordered_qty: planned,
                        previously_received_qty: alreadyReceived, // Đã nhập từ các Goods Receipt đã approve
                        received_qty: 0, // User nhập số lượng còn lại
                        accepted_qty: 0, // User nhập số lượng còn lại
                        remark: item.note || "",
                    };
                    console.log(`Mapped item ${index}:`, {
                        ...mappedItem,
                        alreadyReceived,
                        remainingQty
                    });
                    return mappedItem;
                });
                console.log("=== Sản phẩm đã map cuối cùng ===", mapped);
                setFormData((prev) => ({ ...prev, items: mapped }));
                setError(null); // Clear error nếu validation pass
            } else {
                console.warn("Không tìm thấy sản phẩm trong Đơn nhập hàng lại");
                toast.warning("Đơn nhập hàng lại không có sản phẩm nào");
            }
                    } catch (err) {
            console.error("Lỗi khi tải Đơn nhập hàng lại:", err);
            console.error("Chi tiết lỗi:", err.response?.data);
            toast.error("Không thể tải Đơn nhập hàng lại: " + (err.message || "Lỗi không xác định"));
        } finally {
            setLoading(false);
        }
    };

    const loadPOItems = async (poId) => {
        if (!poId) return;
        try {
            setLoading(true);
            const response = await apiClient.get(`/purchase-orders/${poId}`);
            console.log("=== PO RESPONSE ===", response.data);
            const po = response.data;
            const items = Array.isArray(po.items) ? po.items : po.items?.content || [];
            
            const warehouseId = po.warehouseId || po.warehouse_id;
            const orderId = po.orderId || po.order_id || po.id;
            
            console.log("Đang đặt warehouse_id:", warehouseId);
            console.log("Đang đặt order_id:", orderId);
            
            // Map items from PO
            const mapped = items.map((item, index) => {
                console.log(`Đang map sản phẩm PO ${index}:`, item);
                const orderedQty = Number(item.quantity || item.qty || 0);
                    
                    return {
                    poi_id: item.poiId || item.poi_id || item.id,
                    product_id: item.productId || item.product_id,
                    productName: item.productName || item.product_name || "-",
                    productCode: item.productCode || item.productSku || "",
                    ordered_qty: orderedQty,
                    received_qty: orderedQty,
                    accepted_qty: orderedQty,
                    remark: "",
                };
            });
            console.log("=== Sản phẩm PO đã map cuối cùng ===", mapped);
            
            // Update form data with warehouse, order, and items
            setFormData((prev) => ({
                ...prev,
                warehouse_id: warehouseId,
                order_id: orderId,
                items: mapped
            }));
            
            setPoReferenceItems(mapped);
            toast.success("Đã tải thông tin đơn hàng");
        } catch (err) {
            console.error("Lỗi khi tải sản phẩm đơn hàng:", err);
            toast.error("Không thể tải thông tin đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const loadPurchaseOrderItems = async (orderId, receiptItems = null) => {
        if (!orderId) return;
        try {
            const response = await apiClient.get(`/purchase-orders/${orderId}/items`);
            console.log("=== Phản hồi thô sản phẩm PO ===", response.data);
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
                    console.log(`Đang map sản phẩm ${index}:`, poItem);
                    const orderedQty = Number(poItem.quantity || poItem.order_qty || 0);
                    const previouslyReceived = Number(poItem.receivedQty || poItem.received_qty || 0);
                    const remainingQty = Math.max(0, orderedQty - previouslyReceived);
                    
                    const mapped = {
                        poi_id: poItem.poiId || poItem.poi_id || poItem.id,
                        product_id: poItem.productId || poItem.product_id || poItem.product?.id,
                        productName: poItem.productName || poItem.product_name || poItem.product?.name || "-",
                        productCode: poItem.productCode || poItem.product?.sku || "",
                        ordered_qty: orderedQty,
                        previously_received_qty: previouslyReceived,
                        received_qty: remainingQty, // Default to remaining quantity
                        accepted_qty: remainingQty, // Will be auto-set to received_qty
                        remark: "",
                    };
                    console.log(`Kết quả map ${index}:`, mapped);
                    console.log(`  -> poi_id: ${mapped.poi_id}, product_id: ${mapped.product_id}, đã đặt: ${orderedQty}, đã nhận trước: ${previouslyReceived}, còn lại: ${remainingQty}`);
                    return mapped;
                });
                console.log("=== Sản phẩm đã map cuối cùng ===", mapped);
                setFormData((prev) => ({ ...prev, items: mapped }));
            }
        } catch (err) {
            console.error("Lỗi khi tải sản phẩm đơn hàng:", err);
            toast.error("Không thể tải danh sách sản phẩm của đơn hàng");
        }
    };

    const loadReceipt = async () => {
        try {
            setLoading(true);
            const receipt = await goodsReceiptService.getGoodsReceiptById(id);
            console.log("Đang tải phiếu nhập kho để chỉnh sửa:", receipt);
            
            // Get items from receipt detail response
            const receiptItems = Array.isArray(receipt.items) ? receipt.items : receipt.items?.content || [];
            console.log("Sản phẩm phiếu nhập kho để chỉnh sửa:", receiptItems);

            setFormData({
                receipt_no: receipt.receipt_no || receipt.receiptNo || "",
                order_id: receipt.order_id || receipt.orderId || null,
                warehouse_id: receipt.warehouse_id || receipt.warehouseId || null,
                inbound_delivery_id: receipt.inboundDeliveryId || receipt.inbound_delivery_id || null,
                received_date: receipt.received_date || receipt.receivedDate ? new Date(receipt.received_date || receipt.receivedDate) : new Date(),
                status: receipt.status || "Pending",
                items: receiptItems.map((item) => ({
                    gri_id: item.griId || item.gri_id || item.id,
                    idi_id: item.idiId || item.idi_id,
                    poi_id: item.poiId || item.poi_id,
                    product_id: item.productId || item.product_id,
                    productName: item.productName || item.product_name || "-",
                    productCode: item.productCode || item.product_code || "",
                    ordered_qty: item.orderedQty || item.ordered_qty || 0,
                    expected_qty: item.expectedQty || item.expected_qty || 0,
                    received_qty: Number(item.receivedQty || item.received_qty || 0),
                    accepted_qty: Number(item.receivedQty || item.received_qty || 0), // Auto-accept received qty
                    remark: item.remark || "",
                })),
            });

            // Load reference data based on source to enrich items with expected_qty and previously_received_qty
            const inboundDeliveryId = receipt.inboundDeliveryId || receipt.inbound_delivery_id;
            if (inboundDeliveryId) {
                // Load inbound delivery to get expected_qty and previously_received_qty
                try {
                    const response = await apiClient.get(`/inbound-deliveries/${inboundDeliveryId}`);
                    const inboundDelivery = response.data;
                    const idiItems = Array.isArray(inboundDelivery.items) ? inboundDelivery.items : inboundDelivery.items?.content || [];
                    
                    // Merge receipt items with inbound delivery items to get full info
                    const enrichedItems = receiptItems.map((receiptItem) => {
                        const idiItem = idiItems.find(idi => 
                            (idi.idiId || idi.idi_id || idi.id) === (receiptItem.idiId || receiptItem.idi_id)
                        );
                        
                        const expectedQty = idiItem ? Number(idiItem.expectedQty || idiItem.expected_qty || 0) : 0;
                        const previouslyReceivedQty = idiItem ? Number(idiItem.receivedQty || idiItem.received_qty || 0) : 0;
                        
                        return {
                            gri_id: receiptItem.griId || receiptItem.gri_id || receiptItem.id,
                            idi_id: receiptItem.idiId || receiptItem.idi_id,
                            poi_id: receiptItem.poiId || receiptItem.poi_id,
                            product_id: receiptItem.productId || receiptItem.product_id,
                            productName: receiptItem.productName || receiptItem.product_name || "-",
                            productCode: receiptItem.productCode || receiptItem.product_code || "",
                            ordered_qty: receiptItem.orderedQty || receiptItem.ordered_qty || 0,
                            expected_qty: expectedQty,
                            previously_received_qty: previouslyReceivedQty,
                            received_qty: Number(receiptItem.receivedQty || receiptItem.received_qty || 0),
                            accepted_qty: Number(receiptItem.receivedQty || receiptItem.received_qty || 0),
                            remark: receiptItem.remark || "",
                        };
                    });
                    
                    setFormData((prev) => ({
                        ...prev,
                        items: enrichedItems
                    }));
                } catch (err) {
                    console.error("Lỗi khi tải inbound delivery để làm giàu dữ liệu:", err);
                }
            } else if (receipt.order_id || receipt.orderId) {
                // Legacy: Load from PO directly
                await loadPurchaseOrderItems(receipt.order_id || receipt.orderId, receiptItems);
            }
        } catch (err) {
            console.error("Lỗi khi tải Phiếu nhập kho:", err);
            console.error("Chi tiết lỗi:", err.response?.data);
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
            loadPOItems(option.value);
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
            
            // For Sales Return mode: Auto-sync accepted_qty with received_qty when received_qty changes
            if (isSalesReturnMode && field === "received_qty") {
                const receivedQty = parseFloat(value) || 0;
                // Auto-sync accepted_qty with received_qty for Sales Return to ensure consistency
                next[index] = { ...next[index], accepted_qty: receivedQty };
            }
            
            return { ...prev, items: next };
        });
    };

    const validate = () => {
        const errors = {};
        if (!formData.receipt_no) {
            errors.receipt_no = "Số phiếu là bắt buộc";
        }
        if (!isSalesReturnMode && !formData.order_id) {
            errors.order_id = "Chọn Kế hoạch nhận hàng";
        }
        if (isSalesReturnMode && !sriIdFromQuery && !salesReturnInboundOrder) {
            errors.sriId = "Chọn Đơn nhập hàng lại";
        }
        if (!formData.warehouse_id) {
            errors.warehouse_id = "Chọn kho nhận";
        }
        if (!formData.items || formData.items.length === 0) {
            errors.items = "Cần ít nhất 1 dòng sản phẩm";
        } else {
            // Validate: Tất cả items phải cùng warehouse (cho Sales Return mode)
            if (isSalesReturnMode) {
                const itemWarehouseIds = formData.items
                    .map(item => item.warehouse_id)
                    .filter(id => id != null);
                const uniqueWarehouseIds = [...new Set(itemWarehouseIds)];
                
                if (uniqueWarehouseIds.length > 1) {
                    errors.items = "Tất cả sản phẩm phải từ cùng một kho. Vui lòng tách thành nhiều phiếu nhập kho riêng.";
                } else if (uniqueWarehouseIds.length === 1 && formData.warehouse_id) {
                    // Validate warehouse header phải match với warehouse của items
                    if (uniqueWarehouseIds[0] !== formData.warehouse_id) {
                        errors.warehouse_id = "Kho nhận phải khớp với kho của các sản phẩm";
                    }
                }
            }
            const itemErrors = formData.items.map((item) => {
                const err = {};
                const receivedQty = Number(item.received_qty || 0);
                const expectedQty = Number(item.expected_qty || item.ordered_qty || 0);
                const previouslyReceived = Number(item.previously_received_qty || 0);
                const remainingQty = Math.max(0, expectedQty - previouslyReceived);
                
                // Skip validation if item is completed
                if (item.is_completed) {
                    return err;
                }
                
                if (!item.received_qty || receivedQty <= 0) {
                    err.received_qty = "SL nhận > 0";
                } else if (receivedQty > remainingQty) {
                    err.received_qty = `Vượt quá SL còn lại (${remainingQty})`;
                }
                return err;
            });
            if (itemErrors.some((e) => Object.keys(e).length > 0)) {
                errors.itemDetails = itemErrors;
            }
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        console.log("=== ĐÃ GỌI HANDLE SUBMIT ===");
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setValidationErrors({});

        console.log("=== ĐANG VALIDATE FORM ===");
        console.log("Dữ liệu form:", formData);
        console.log("Sản phẩm form:", formData.items);
        
        const errors = validate();
        console.log("Lỗi validate:", errors);
    
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setIsSubmitting(false);
            toast.error("Vui lòng kiểm tra lại thông tin form!");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        console.log("=== VALIDATE THÀNH CÔNG, ĐANG TẠO PAYLOAD ===");

        try {
            const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id || 1; // Fallback to 1 for testing
            console.log("Người dùng hiện tại:", currentUser);
            console.log("ID người dùng:", userId);
            console.log("sourceType:", sourceType);
            console.log("isSalesReturnMode:", isSalesReturnMode);
            console.log("sriIdFromQuery:", sriIdFromQuery);

            if (isSalesReturnMode) {
                // Sales Return mode
                const sriId = sriIdFromQuery || salesReturnInboundOrder?.sriId;
                if (!sriId) {
                    toast.error("Không tìm thấy ID của Đơn nhập hàng lại");
                    return;
                }

                // Format date properly for Spring Boot OffsetDateTime
                // Backend expects: yyyy-MM-dd'T'HH:mm:ss[.SSS][XXX] (with timezone)
                let formattedDate = null;
                if (formData.received_date) {
                    if (formData.received_date instanceof Date) {
                        // Format as yyyy-MM-ddTHH:mm:ss with timezone offset
                        const year = formData.received_date.getFullYear();
                        const month = String(formData.received_date.getMonth() + 1).padStart(2, '0');
                        const day = String(formData.received_date.getDate()).padStart(2, '0');
                        const hours = String(formData.received_date.getHours()).padStart(2, '0');
                        const minutes = String(formData.received_date.getMinutes()).padStart(2, '0');
                        const seconds = String(formData.received_date.getSeconds()).padStart(2, '0');
                        // Get timezone offset (e.g., +07:00)
                        const tzOffset = -formData.received_date.getTimezoneOffset();
                        const offsetHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
                        const offsetMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
                        const offsetSign = tzOffset >= 0 ? '+' : '-';
                        formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
                    } else {
                        formattedDate = formData.received_date;
                    }
                }

                // Validate items before mapping
                if (!formData.items || formData.items.length === 0) {
                    toast.error("Danh sách sản phẩm không được để trống");
                    setIsSubmitting(false);
                    return;
                }
                
                // Validate: Tất cả items phải cùng warehouse
                const itemWarehouseIds = formData.items
                    .map(item => item.warehouse_id)
                    .filter(id => id != null);
                const uniqueWarehouseIds = [...new Set(itemWarehouseIds)];
                
                if (uniqueWarehouseIds.length > 1) {
                    toast.error("Tất cả sản phẩm phải từ cùng một kho. Vui lòng tách thành nhiều phiếu nhập kho riêng.");
                    setIsSubmitting(false);
                    return;
                }
                
                // Validate warehouse header phải match với warehouse của items
                if (uniqueWarehouseIds.length === 1 && formData.warehouse_id) {
                    if (uniqueWarehouseIds[0] !== formData.warehouse_id) {
                        toast.error("Kho nhận phải khớp với kho của các sản phẩm");
                        setIsSubmitting(false);
                        return;
                    }
                }

            const payload = {
                receiptNo: formData.receipt_no,
                warehouseId: formData.warehouse_id,
                    receivedDate: formattedDate,
                    sourceType: "SalesReturn",
                    items: formData.items.map((item, index) => {
                        console.log(`Sản phẩm ${index}:`, item);
                        
                        // Validate required fields
                        if (!item.roi_id) {
                            throw new Error(`Item ${index + 1}: Thiếu roi_id`);
                        }
                        if (!item.product_id) {
                            throw new Error(`Item ${index + 1}: Thiếu product_id`);
                        }
                        if (!item.received_qty || Number(item.received_qty) <= 0) {
                            throw new Error(`Item ${index + 1}: Số lượng nhận phải > 0`);
                        }
                        
                        // Ensure receivedQty is a valid number > 0
                        const receivedQty = Number(item.received_qty);
                        if (isNaN(receivedQty) || receivedQty <= 0) {
                            throw new Error(`Item ${index + 1}: Số lượng nhận phải > 0 (hiện tại: ${item.received_qty})`);
                        }
                        
                        // Ensure acceptedQty is valid, default to receivedQty if not set or 0
                        const acceptedQty = item.accepted_qty && Number(item.accepted_qty) > 0 
                            ? Number(item.accepted_qty) 
                            : receivedQty; // Default to receivedQty if not set or 0
                        
                        const mappedItem = {
                            roiId: item.roi_id,
                            productId: item.product_id,
                            receivedQty: receivedQty, // Send as number, Spring Boot will convert to BigDecimal
                            acceptedQty: acceptedQty, // Use receivedQty as default if not set
                            remark: item.remark || null,
                        };
                        console.log(`Sản phẩm đã map ${index}:`, mappedItem);
                        return mappedItem;
                    }),
                };

                console.log("=== GỬI DỮ LIỆU (Đơn nhập hàng lại) ===", JSON.stringify(payload, null, 2));
                console.log("Chi tiết sản phẩm:", payload.items);
                console.log("sriId:", sriId, "đã parse:", parseInt(sriId));
                console.log("userId:", userId);
                
                // Validate payload before sending
                if (!payload.warehouseId) {
                    throw new Error("ID kho là bắt buộc");
                }
                if (!payload.items || payload.items.length === 0) {
                    throw new Error("Danh sách sản phẩm là bắt buộc");
                }
                payload.items.forEach((item, idx) => {
                    if (!item.roiId) {
                        throw new Error(`Sản phẩm ${idx + 1}: ID đơn trả hàng là bắt buộc`);
                    }
                    if (!item.productId) {
                        throw new Error(`Sản phẩm ${idx + 1}: ID sản phẩm là bắt buộc`);
                    }
                    if (!item.receivedQty || item.receivedQty <= 0) {
                        throw new Error(`Sản phẩm ${idx + 1}: Số lượng nhận phải > 0`);
                    }
                });
                
                try {
                    await goodsReceiptService.createGoodsReceiptFromSalesReturnInboundOrder(
                        parseInt(sriId),
                        payload,
                        userId
                    );
                    toast.success("Tạo Phiếu nhập kho từ Đơn nhập hàng lại thành công!");
                } catch (apiError) {
            console.error("=== CHI TIẾT LỖI API ===", apiError);
            console.error("Dữ liệu phản hồi:", apiError.response?.data);
            console.error("Trạng thái phản hồi:", apiError.response?.status);
            console.error("Headers phản hồi:", apiError.response?.headers);
            console.error("Lỗi đầy đủ:", JSON.stringify(apiError.response?.data, null, 2));
                    throw apiError; // Re-throw để xử lý ở catch block bên ngoài
                }
            } else {
                // Purchase mode
                // Format date properly for Spring Boot OffsetDateTime
                let formattedDate = null;
                if (formData.received_date) {
                    if (formData.received_date instanceof Date) {
                        // Format as yyyy-MM-ddTHH:mm:ss with timezone offset
                        const year = formData.received_date.getFullYear();
                        const month = String(formData.received_date.getMonth() + 1).padStart(2, '0');
                        const day = String(formData.received_date.getDate()).padStart(2, '0');
                        const hours = String(formData.received_date.getHours()).padStart(2, '0');
                        const minutes = String(formData.received_date.getMinutes()).padStart(2, '0');
                        const seconds = String(formData.received_date.getSeconds()).padStart(2, '0');
                        // Get timezone offset (e.g., +07:00)
                        const tzOffset = -formData.received_date.getTimezoneOffset();
                        const offsetHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
                        const offsetMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
                        const offsetSign = tzOffset >= 0 ? '+' : '-';
                        formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
                    } else {
                        formattedDate = formData.received_date;
                    }
                }
                
                // Validate required fields before building payload
                if (!formData.warehouse_id) {
                    toast.error("Vui lòng chọn Kho nhận");
                    return;
                }
                
                const payload = {
                    receiptNo: formData.receipt_no,
                    orderId: formData.order_id, // PO ID
                    warehouseId: formData.warehouse_id,
                    receivedDate: formattedDate,
                status: formData.status,
                items: formData.items.map((item, index) => {
                    console.log(`Sản phẩm ${index}:`, item);
                        
                        // Skip items that are already completed
                        if (item.is_completed) {
                            return null;
                        }
                        
                    return {
                            poiId: item.poi_id || item.poiId,
                        productId: item.product_id,
                        receivedQty: Number(item.received_qty || 0),
                        acceptedQty: Number(item.received_qty || 0), // Auto-accept all received qty
                        remark: item.remark || "",
                    };
                    }).filter(item => item !== null), // Remove null items (completed ones)
            };

                console.log("=== GỬI DỮ LIỆU (Mua hàng) ===", payload);
            console.log("Chi tiết sản phẩm:", payload.items);
            
            if (isEdit) {
                console.log("Cập nhật với userId:", userId);
                await goodsReceiptService.updateGoodsReceipt(id, payload, userId);
                toast.success("Cập nhật Phiếu nhập kho thành công!");
            } else {
                console.log("Tạo mới với userId:", userId);
                await goodsReceiptService.createGoodsReceipt(payload, userId);
                toast.success("Tạo Phiếu nhập kho thành công!");
                }
            }
            navigate("/purchase/goods-receipts");
        } catch (err) {
            console.error("Lỗi khi lưu Phiếu nhập kho:", err);
            console.error("Phản hồi lỗi:", err.response?.data);
            console.error("Phản hồi lỗi (JSON):", JSON.stringify(err.response?.data, null, 2));
            console.error("Lỗi validate từ backend:", err.response?.data?.errors);
            console.error("Thông báo lỗi:", err.response?.data?.message);
            
            const backendErrors = err.response?.data?.errors;
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
            
            console.error("=== THÔNG BÁO LỖI CUỐI CÙNG ===", errorMessage);
            
            if (backendErrors && typeof backendErrors === 'object') {
                const errorMessages = Object.entries(backendErrors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(', ');
                setError(`Lỗi validate: ${errorMessages}`);
                toast.error(`Lỗi validate: ${errorMessages}`);
            } else if (errorMessage) {
                setError(errorMessage);
                toast.error(errorMessage);
            } else {
                const defaultMsg = isEdit ? "Không thể cập nhật Phiếu nhập kho" : "Không thể tạo Phiếu nhập kho";
                setError(defaultMsg);
                toast.error(defaultMsg);
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/purchase/goods-receipts")}
                            className="px-3 py-1.5 rounded border hover:bg-gray-50"
                            title="Quay lại trang trước"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <h1 className="text-2xl font-semibold">
                            {isEdit ? "Cập nhật Phiếu nhập kho" : "Tạo Phiếu nhập kho"}
                        </h1>
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
                                {/* Source Type Selection */}
                                {!isEdit && !sriIdFromQuery && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Loại phiếu nhập kho <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="sourceType"
                                                    value="purchase"
                                                    checked={sourceType === 'purchase'}
                                                    onChange={(e) => handleSourceTypeChange('purchase')}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm text-gray-700">Từ đơn đặt hàng</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="sourceType"
                                                    value="salesReturn"
                                                    checked={sourceType === 'salesReturn'}
                                                    onChange={(e) => handleSourceTypeChange('salesReturn')}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm text-gray-700">Từ Đơn nhập hàng lại</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

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
                                            value={getStatusInVietnamese(formData.status)}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isSalesReturnMode ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Đơn nhập hàng lại <span className="text-red-500">*</span>
                                            </label>
                                            {sriIdFromQuery ? (
                                                // Auto-loaded from URL
                                                <>
                                                    {loading ? (
                                                        <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 border-gray-300 flex items-center gap-2">
                                                            <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            <span className="text-sm text-gray-600">Đang tải...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={salesReturnInboundOrder ? `${salesReturnInboundOrder.sriNo || `SRI-${salesReturnInboundOrder.sriId}`} - ${salesReturnInboundOrder.returnNo || ""}` : `Đang tải Đơn nhập hàng lại #${sriIdFromQuery}...`}
                                                                readOnly
                                                                className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300"
                                                            />
                                                            {salesReturnInboundOrder && (
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Từ Đơn trả hàng: {salesReturnInboundOrder.returnNo || "—"}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                // Manual selection via picker
                                                <>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={salesReturnInboundOrder ? `${salesReturnInboundOrder.sriNo || `SRI-${salesReturnInboundOrder.sriId}`} - ${salesReturnInboundOrder.returnNo || ""}` : ""}
                                                            readOnly
                                                            placeholder="Chọn Đơn nhập hàng lại"
                                                            className="flex-1 px-3 py-2 border rounded-lg bg-gray-100 border-gray-300"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                loadSalesReturnInboundOrderList();
                                                                setShowSriPicker(true);
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                        >
                                                            Chọn
                                                        </button>
                                                    </div>
                                                    {salesReturnInboundOrder && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Từ Đơn trả hàng: {salesReturnInboundOrder.returnNo || "—"}
                                                        </p>
                                                    )}
                                                    {validationErrors.sriId && (
                                                        <p className="mt-1 text-sm text-red-600">{validationErrors.sriId}</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Nếu có order_id từ URL (tạo mới), hiển thị info box thay vì dropdown */}
                                            {!isEdit && formData.order_id && poIdFromQuery ? (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-800">Đơn nhập kho từ Đơn hàng</p>
                                                            <p className="text-sm text-blue-700 mt-1">
                                                                Danh sách sản phẩm được lấy tự động từ Đơn hàng ID: {formData.order_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Đơn hàng <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            value={purchaseOrders.find((opt) => opt.value === formData.order_id) || null}
                                            onChange={handleOrderChange}
                                            options={purchaseOrders}
                                                        placeholder="Chọn đơn hàng"
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
                                            )}
                                        </>
                                    )}

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

                                {formData.items.some(item => Number(item.previously_received_qty || 0) > 0) && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">Nhập hàng bổ sung (Partial Delivery)</p>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    Đơn hàng này đã có lần nhập kho trước đó. Vui lòng kiểm tra cột "Đã nhận" và nhập số lượng nhận thêm vào cột "SL nhận lần này".
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
                                        {isSalesReturnMode 
                                            ? "Hệ thống tự động lấy sản phẩm từ Đơn nhập hàng lại"
                                            : "Hệ thống tự động lấy sản phẩm từ Kế hoạch nhận hàng đã chọn"}
                                    </p>
                                </div>

                                {validationErrors.items && (
                                    <p className="text-red-500 text-sm">{validationErrors.items}</p>
                                )}

                                {loading ? (
                                    <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang tải dữ liệu...
                                        </div>
                                    </div>
                                ) : formData.items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                                        {isSalesReturnMode 
                                            ? "Đơn nhập hàng lại không có sản phẩm nào hoặc đang tải dữ liệu..."
                                            : "Vui lòng chọn Kế hoạch nhận hàng để hiển thị danh sách sản phẩm"}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-200 px-2 py-1 text-center text-xs font-medium text-gray-700 w-12">#</th>
                                                <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">Sản phẩm</th>
                                                <th className="border border-gray-200 px-2 py-1 text-right text-xs font-medium text-gray-700 w-24">
                                                    {isSalesReturnMode ? "SL kế hoạch" : "SL dự kiến"}
                                                </th>
                                                {isSalesReturnMode && (
                                                    <th className="border border-gray-200 px-2 py-1 text-right text-xs font-medium text-gray-700 w-24">Đã nhận</th>
                                                )}
                                                {!isSalesReturnMode && (
                                                    <th className="border border-gray-200 px-2 py-1 text-right text-xs font-medium text-gray-700 w-24">Đã nhận</th>
                                                )}
                                                <th className="border border-gray-200 px-2 py-1 text-right text-xs font-medium text-gray-700 w-32">
                                                    {isSalesReturnMode ? "SL nhận" : "SL nhận"}
                                                </th>
                                                <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700 w-48">Ghi chú</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {formData.items.map((item, index) => {
                                                const itemErr = validationErrors.itemDetails?.[index] || {};
                                                const isCompleted = item.is_completed || false;
                                                const previouslyReceived = Number(item.previously_received_qty || 0);
                                                const remainingQty = Number(item.remaining_qty || 0);
                                                
                                                return (
                                                    <tr key={item.poi_id || item.roi_id || index} className={`hover:bg-gray-50 ${isCompleted ? 'bg-gray-100' : ''}`}>
                                                        <td className="border border-gray-200 px-2 py-1 text-xs text-gray-700 text-center">
                                                            {index + 1}
                                                        </td>
                                                        <td className="border border-gray-200 px-2 py-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1">
                                                            <div className="text-sm font-medium">{item.productName || "-"}</div>
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {item.productCode || "-"}
                                                                    </div>
                                                                </div>
                                                                {isCompleted && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                        ✓ Đã hoàn tất
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-200 px-2 py-1 text-right text-sm text-gray-700">
                                                            {Number(item.expected_qty || item.ordered_qty || item.planned_qty || 0).toLocaleString()}
                                                        </td>
                                                        {isSalesReturnMode ? (
                                                            <td className="border border-gray-200 px-2 py-1 text-right text-sm">
                                                                <span className={Number(item.previously_received_qty || 0) > 0 ? "text-blue-600 font-medium" : "text-gray-400"}>
                                                                    {Number(item.previously_received_qty || 0).toLocaleString()}
                                                                </span>
                                                                {item.planned_qty && Number(item.previously_received_qty || 0) < Number(item.planned_qty) && (
                                                                    <div className="text-xs text-blue-600 mt-0.5">
                                                                        Còn lại: {(Number(item.planned_qty) - Number(item.previously_received_qty || 0)).toLocaleString()}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        ) : (
                                                            <td className="border border-gray-200 px-2 py-1 text-right text-sm">
                                                                <span className={previouslyReceived > 0 ? "text-blue-600 font-medium" : "text-gray-400"}>
                                                                    {previouslyReceived.toLocaleString()}
                                                                </span>
                                                                {remainingQty > 0 && (
                                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                                        Còn lại: {remainingQty.toLocaleString()}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td className="border border-gray-200 px-2 py-1">
                                                            <input
                                                                type="number"
                                                                value={item.received_qty}
                                                                onChange={(e) => handleItemChange(index, "received_qty", parseFloat(e.target.value) || 0)}
                                                                className={`w-24 px-2 py-1 border rounded text-sm text-right ${
                                                                    isCompleted ? "bg-gray-100 cursor-not-allowed" : 
                                                                    itemErr.received_qty ? "border-red-500" : "border-gray-300"
                                                                }`}
                                                                min="0"
                                                                step="0.01"
                                                                disabled={isCompleted}
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
                                                                className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${
                                                                    isCompleted ? "bg-gray-100 cursor-not-allowed" : ""
                                                                }`}
                                                                placeholder="Ghi chú"
                                                                disabled={isCompleted}
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

            {/* Sales Return Inbound Order Picker Modal */}
            <SalesReturnInboundOrderPickerModal
                isOpen={showSriPicker}
                onClose={() => setShowSriPicker(false)}
                salesReturnInboundOrders={sriList.filter(sri => 
                    !sriSearchTerm || 
                    (sri.sriNo && sri.sriNo.toLowerCase().includes(sriSearchTerm.toLowerCase())) ||
                    (sri.returnNo && sri.returnNo.toLowerCase().includes(sriSearchTerm.toLowerCase()))
                )}
                loading={loadingSriList}
                onSelect={handleSelectSri}
                searchTerm={sriSearchTerm}
                onSearchChange={setSriSearchTerm}
            />
        </div>
    );
}

// Sales Return Inbound Order Picker Modal Component
const SalesReturnInboundOrderPickerModal = ({
    isOpen,
    onClose,
    salesReturnInboundOrders,
    loading,
    onSelect,
    searchTerm,
    onSearchChange,
}) => {
    if (!isOpen) return null;

    const formatDate = (value) =>
        value ? new Date(value).toLocaleDateString("vi-VN") : "—";

    const getStatusLabel = (status) => {
        const statusMap = {
            Draft: "Nháp",
            Approved: "Đã duyệt",
            SentToWarehouse: "Đã gửi kho",
            Completed: "Hoàn thành",
            Cancelled: "Đã hủy",
        };
        return statusMap[status] || status;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Chọn Đơn nhập hàng lại
                        </h3>
                        <p className="text-sm text-gray-500">
                            Hiển thị đơn ở trạng thái &quot;Nháp&quot; hoặc &quot;Đã gửi kho&quot;
                        </p>
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
                        placeholder="Tìm theo số Đơn nhập lại, Đơn trả hàng..."
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500">
                            Đang tải danh sách Đơn nhập hàng lại...
                        </div>
                    ) : salesReturnInboundOrders.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            Không có Đơn nhập hàng lại phù hợp
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Đơn nhập lại
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Đơn trả hàng
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Kho
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Ngày dự kiến
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {salesReturnInboundOrders.map((sri) => (
                                    <tr
                                        key={sri.sriId}
                                        className="hover:bg-gray-100 cursor-pointer"
                                        onClick={() => onSelect(sri)}
                                    >
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {sri.sriNo || `SRI-${sri.sriId}`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {sri.returnNo || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {sri.warehouseName || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {getStatusLabel(sri.status)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatDate(sri.expectedReceiptDate)}
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

