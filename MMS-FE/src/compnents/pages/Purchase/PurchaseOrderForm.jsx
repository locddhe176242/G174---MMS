import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { purchaseOrderService } from "../../../api/purchaseOrderService";
import { purchaseRequisitionService } from "../../../api/purchaseRequisitionService";
import apiClient from "../../../api/apiClient";
import { getCurrentUser } from "../../../api/authService";

export default function PurchaseOrderForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const prIdFromQuery = searchParams.get("pr_id");

    const [formData, setFormData] = useState({
        po_no: "",
        vendor_id: null,
        pq_id: null,
        order_date: new Date(),
        status: "Pending",
        approval_status: "Pending",
        payment_terms: "",
        delivery_date: null,
        shipping_address: "",
        header_discount: 0,
        items: [
            {
                product_id: null,
                productCode: "",
                productName: "",
                uom: "",
                quantity: 1,
                unit_price: 0,
                discount_percent: 0,
                tax_rate: 0,
                tax_amount: 0,
                line_total: 0,
                delivery_date: null,
                note: "",
            },
        ],
    });

    const [vendors, setVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [products, setProducts] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [isImportedFromPQ, setIsImportedFromPQ] = useState(false); // Track if imported from PQ

    const currentUserId = useMemo(() => {
        if (currentUser?.userId || currentUser?.user_id || currentUser?.id) {
            return currentUser.userId || currentUser.user_id || currentUser.id;
        }
        const storedUser = getCurrentUser();
        return storedUser?.userId || storedUser?.user_id || storedUser?.id || null;
    }, [currentUser]);

    // Import Quotation state
    const [showImportModal, setShowImportModal] = useState(false);
    const [quotationList, setQuotationList] = useState([]);
    const [selectedQuotation, setSelectedQuotation] = useState(null);

    // Calculate totals
    const calculateItemTotal = useCallback((item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unit_price || 0);
        const discountPercent = Number(item.discount_percent || 0) / 100;
        
        // Bước 1: Tính subtotal
        const subtotal = qty * price;
        
        // Bước 2: Áp dụng chiết khấu dòng
        const discountAmount = subtotal * discountPercent;
        const amountAfterDiscount = subtotal - discountAmount;
        
        return {
            subtotal,
            discountAmount,
            amountAfterDiscount
        };
    }, []);

    const totalBeforeTax = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        return formData.items.reduce((sum, it) => {
            const qty = Number(it.quantity || 0);
            const price = Number(it.unit_price || 0);
            return sum + (qty * price);
        }, 0);
    }, [formData.items]);

    const totalDiscount = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        return formData.items.reduce((sum, it) => {
            const qty = Number(it.quantity || 0);
            const price = Number(it.unit_price || 0);
            const discountPercent = Number(it.discount_percent || 0) / 100;
            const subtotal = qty * price;
            return sum + (subtotal * discountPercent);
        }, 0);
    }, [formData.items]);

    const totalAfterLineDiscount = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        return formData.items.reduce((sum, it) => {
            const qty = Number(it.quantity || 0);
            const price = Number(it.unit_price || 0);
            const discountPercent = Number(it.discount_percent || 0) / 100;
            const subtotal = qty * price;
            const discountAmount = subtotal * discountPercent;
            return sum + (subtotal - discountAmount);
        }, 0);
    }, [formData.items]);

    const headerDiscountAmount = useMemo(() => {
        const discountPercent = Number(formData.header_discount || 0);
        // Header discount áp dụng trên tổng sau khi trừ chiết khấu dòng
        return totalAfterLineDiscount * (discountPercent / 100);
    }, [totalAfterLineDiscount, formData.header_discount]);

    const totalTax = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        // Thuế tính trên tổng sau khi trừ TẤT CẢ chiết khấu (line discount + header discount)
        const baseAmount = totalAfterLineDiscount - headerDiscountAmount;
        // Lấy tax rate trung bình hoặc tax rate của dòng đầu tiên
        const taxRate = formData.items.length > 0 ? (Number(formData.items[0].tax_rate || 0) / 100) : 0;
        return baseAmount * taxRate;
    }, [formData.items, totalAfterLineDiscount, headerDiscountAmount]);

    const totalAfterTax = useMemo(() => {
        // Công thức: Tổng = (Tổng sau CK dòng - CK tổng đơn) + Thuế
        // Thuế đã được tính trên số tiền sau tất cả chiết khấu
        return totalAfterLineDiscount - headerDiscountAmount + totalTax;
    }, [totalAfterLineDiscount, headerDiscountAmount, totalTax]);

    const selectedVendor = useMemo(() => {
        if (!formData.vendor_id || vendors.length === 0) return null;
        
        // Try to find vendor with both strict and loose comparison
        const found = vendors.find((v) => v.value === formData.vendor_id) || 
                      vendors.find((v) => v.value == formData.vendor_id) || // eslint-disable-line eqeqeq
                      vendors.find((v) => Number(v.value) === Number(formData.vendor_id));
        

        return found || null;
    }, [vendors, formData.vendor_id]);

    const formatCurrency = (n) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));

    const getUserDisplayName = (user) => {
        if (!user) return 'Đang tải...';
        if (user.fullName) return user.fullName;
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
        if (user.firstName) return user.firstName;
        if (user.email) return user.email;
        if (user.employeeCode) return user.employeeCode;
        return `User ID: ${user.userId || user.user_id}`;
    };

    useEffect(() => {
        const initializeForm = async () => {
            // Load vendors and products first
            await Promise.all([
                loadVendors(),
                loadProducts(),
                loadCurrentUser()
            ]);

            if (isEdit) {
                loadOrder();
            } else {
                // Generate PO number for new order
                generatePONumber();
                // Check if importing from quotation
                const urlParams = new URLSearchParams(window.location.search);
                const quotationId = urlParams.get('quotation_id');
                if (quotationId) {
                    console.log('Loading quotation data for ID:', quotationId);
                    await loadQuotationData(quotationId);
                }
            }
        };

        initializeForm();
    }, [id]);

    const generatePONumber = async () => {
        try {
            const response = await purchaseOrderService.generatePONo();
            const poNumber =
                typeof response === "string"
                    ? response
                    : response?.poNo || response?.po_no || response;
            if (poNumber) {
                setFormData((prev) => ({ ...prev, po_no: poNumber }));
            }
        } catch (err) {
            console.warn("Could not generate PO number:", err);
        }
    };

    const loadVendors = async () => {
        try {
            setLoadingVendors(true);
            const response = await apiClient.get("/vendors");
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.content || [];
            
            
            const mapped = data.map((v) => {
                // Try multiple possible field names for vendor ID
                const vendorId = v.vendorId || v.vendor_id || v.id;
                console.log("Mapping vendor:", { 
                    name: v.name, 
                    vendorId: v.vendorId,
                    vendor_id: v.vendor_id,
                    id: v.id,
                    final_value: vendorId 
                });
                return {
                    value: vendorId,
                    label: v.name || `Vendor ${vendorId}`,
                    vendor: v,
                };
            });
            setVendors(mapped);
        } catch (err) {
            console.error("Error loading vendors:", err);
            toast.error("Không thể tải danh sách nhà cung cấp");
        } finally {
            setLoadingVendors(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await apiClient.get("/product", {
                params: { page: 0, size: 1000 }
            });
            const data = response.data?.content || response.data || [];
            setProducts(
                data.map((p) => ({
                    value: p.product_id || p.id,
                    label: `${p.sku || p.productCode || ""} - ${p.name || ""}`,
                    product: p,
                }))
            );
        } catch (err) {
            console.error("Error loading products:", err);
            toast.error("Không thể tải danh sách sản phẩm");
        }
    };

    const loadCurrentUser = async () => {
        try {
            const user = getCurrentUser();
            if (user) {
                try {
                    const profileResponse = await fetch('/api/users/profile', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    });
                    if (profileResponse.ok) {
                        const profile = await profileResponse.json();
                        setCurrentUser({
                            ...user,
                            fullName: profile.fullName,
                            firstName: profile.firstName,
                            lastName: profile.lastName
                        });
                    } else {
                        setCurrentUser(user);
                    }
                } catch {
                    setCurrentUser(user);
                }
            }
        } catch (err) {
            console.error("Error loading current user:", err);
        }
    };

    const loadQuotationData = async (quotationId) => {
        try {
            console.log('Fetching quotation ID:', quotationId);
            const res = await apiClient.get(`/purchase-quotations/${quotationId}`);
            const data = res.data || {};
            console.log('Quotation data received:', data);
            
            const pqItems = data.items || [];

            if (!Array.isArray(pqItems) || pqItems.length === 0) {
                toast.info("Báo giá không có dòng sản phẩm");
                return;
            }

            // Set vendor from quotation
            const vendorId = data.vendorId;
            console.log('Setting vendor ID:', vendorId);

            // Load product details for each item to get UOM
            const itemsWithDetails = await Promise.all(
                pqItems.map(async (it) => {
                    try {
                        const productId = it.productId;
                        if (!productId) return null;

                        console.log('🔍 PQ Item from backend:', it);

                        // Fetch product details to get UOM and original price
                        const productRes = await apiClient.get(`/product/${productId}`);
                        const product = productRes.data || {};

                        const quantity = Number(it.quantity || 1);
                        const unitPrice = Number(it.unitPrice || 0);
                        const discountPercent = Number(it.discountPercent || 0);
                        const taxRate = Number(it.taxRate || 0);
                        
                        console.log('💰 PQ Item Data:', {
                            pqUnitPrice: it.unitPrice,
                            pqDiscount: it.discountPercent,
                            parsedValues: { unitPrice, discountPercent, taxRate }
                        });
                        
                        const calc = {
                            quantity,
                            unit_price: unitPrice,
                            tax_rate: taxRate
                        };
                        const totals = calculateItemTotal(calc);

                        const itemData = {
                            pq_item_id: it.pqItemId,
                            product_id: productId,
                            productCode: it.productCode || product.sku || product.productCode || "",
                            productName: it.productName || product.name || "",
                            uom: product.uom || product.unit || "",
                            quantity,
                            unit_price: unitPrice,
                            discount_percent: discountPercent,
                            tax_rate: taxRate,
                            tax_amount: totals.tax,
                            line_total: totals.total,
                            delivery_date: null,
                            note: it.remark || "",
                        };
                        
                        console.log('📦 Imported PQ Item:', itemData);
                        
                        return itemData;
                    } catch (err) {
                        console.warn('Could not load product details:', err);
                        return null;
                    }
                })
            );

            const mapped = itemsWithDetails.filter(m => m !== null);
            console.log('✅ Mapped items:', mapped.length, 'items', mapped);

            if (mapped.length === 0) {
                toast.info("Không có sản phẩm hợp lệ để nhập");
                return;
            }

            setFormData((prev) => ({ 
                ...prev, 
                items: mapped,
                vendor_id: vendorId,
                pq_id: quotationId,
                header_discount: Number(data.headerDiscount || 0)
            }));
            setIsImportedFromPQ(true); // Set readonly mode khi import từ PQ
            toast.success(`Đã tải ${mapped.length} sản phẩm từ báo giá`);
        } catch (err) {
            console.error("Load quotation data error:", err);
            console.error("Error response:", err.response?.data);
            toast.error("Không thể tải dữ liệu từ báo giá");
        }
    };

    const normalizeEnum = (value, fallback = "Pending") => {
        if (!value) return fallback;
        if (typeof value === "string") return value;
        if (typeof value === "object") {
            return value?.name || value?.value || value?.toString() || fallback;
        }
        return String(value);
    };

    const loadOrder = async () => {
        try {
            setLoading(true);
            const order = await purchaseOrderService.getPurchaseOrderById(id);
            const itemsData = Array.isArray(order?.items) ? order.items : [];

            setFormData({
                po_no: order.po_no || order.poNo || "",
                vendor_id: order.vendor_id || order.vendorId || null,
                pq_id: order.pq_id || order.pqId || null,
                order_date: order.order_date || order.orderDate
                    ? new Date(order.order_date || order.orderDate)
                    : new Date(),
                status: normalizeEnum(order.status, "Pending"),
                approval_status: normalizeEnum(order.approval_status || order.approvalStatus, "Pending"),
                payment_terms: order.payment_terms || order.paymentTerms || "",
                delivery_date: order.delivery_date || order.deliveryDate
                    ? new Date(order.delivery_date || order.deliveryDate)
                    : null,
                shipping_address: order.shipping_address || order.shippingAddress || "",
                items: itemsData.length > 0
                    ? itemsData.map((it) => ({
                        pq_item_id: it.pq_item_id || it.pqItemId || null,
                        product_id: it.product_id || it.productId || null,
                        productCode: it.productCode || "",
                        productName: it.productName || it.product_name || "",
                        uom: it.uom || "",
                        quantity: Number(it.quantity || 1),
                        unit_price: Number(it.unit_price || it.unitPrice || 0),
                        tax_rate: Number(it.tax_rate || it.taxRate || 0),
                        tax_amount: Number(it.tax_amount || it.taxAmount || 0),
                        line_total: Number(it.line_total || it.lineTotal || 0),
                        delivery_date: it.delivery_date || it.deliveryDate
                            ? new Date(it.delivery_date || it.deliveryDate)
                            : null,
                        note: it.note || "",
                    }))
                    : [
                        {
                            product_id: null,
                            productCode: "",
                            productName: "",
                            uom: "",
                            quantity: 1,
                            unit_price: 0,
                            tax_rate: 0,
                            tax_amount: 0,
                            line_total: 0,
                            delivery_date: null,
                            note: "",
                        },
                    ],
            });
        } catch (err) {
            console.error("Error loading Purchase Order:", err);
            setError("Không thể tải thông tin Đơn hàng mua");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleVendorChange = (option) => {
        console.log("Vendor changed:", option);
        if (option) {
            handleInputChange("vendor_id", option.value);
        } else {
            handleInputChange("vendor_id", null);
        }
    };

    const handleItemChange = (index, field, value) => {
        setFormData((prev) => {
            const next = [...prev.items];
            next[index] = { ...next[index], [field]: value };

            // Recalculate totals when quantity, price, or discount changes
            if (field === "quantity" || field === "unit_price" || field === "discount_percent") {
                const calc = calculateItemTotal(next[index]);
                next[index].line_total = calc.amountAfterDiscount;
            }

            return { ...prev, items: next };
        });
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    product_id: null,
                    productCode: "",
                    productName: "",
                    uom: "",
                    quantity: 1,
                    unit_price: 0,
                    discount_percent: 0,
                    tax_rate: 0,
                    tax_amount: 0,
                    line_total: 0,
                    delivery_date: null,
                    note: "",
                },
            ],
        }));
    };

    const removeItem = (index) => {
        setFormData((prev) => {
            const next = [...prev.items];
            next.splice(index, 1);
            return {
                ...prev,
                items: next.length ? next : [{
                    product_id: null,
                    productCode: "",
                    productName: "",
                    uom: "",
                    quantity: 1,
                    unit_price: 0,
                    discount_percent: 0,
                    tax_rate: 0,
                    tax_amount: 0,
                    line_total: 0,
                    delivery_date: null,
                    note: "",
                }]
            };
        });
    };

    const handleProductSelect = (index, selectedOption) => {
        if (selectedOption) {
            const product = selectedOption.product;
            const currentItem = formData.items[index];
            
            handleItemChange(index, "product_id", product.product_id || product.id);
            handleItemChange(index, "productCode", product.sku || product.productCode || "");
            handleItemChange(index, "productName", product.name || "");
            handleItemChange(index, "uom", product.uom || product.unit || "");
            
            // Only update price if NOT imported from PQ (to preserve PQ negotiated price)
            if (product.purchase_price && !currentItem.pq_item_id) {
                handleItemChange(index, "unit_price", product.purchase_price);
            }
        }
    };

    const validateAll = () => {
        const errors = {};
        if (!formData.po_no || !formData.po_no.trim()) {
            errors.po_no = "Số đơn hàng là bắt buộc";
        }
        if (!formData.vendor_id) {
            errors.vendor_id = "Nhà cung cấp là bắt buộc";
        }
        if (!formData.order_date) {
            errors.order_date = "Ngày đặt hàng là bắt buộc";
        }
        // Validate items
        if (!formData.items || formData.items.length === 0) {
            errors.items = "Cần ít nhất 1 dòng hàng";
        } else {
            const itemErrs = formData.items.map((it) => {
                const e = {};
                if (!it.product_id && !it.productName?.trim() && !it.productCode?.trim()) {
                    e.productName = "Chọn sản phẩm";
                }
                if (!it.quantity || Number(it.quantity) <= 0) {
                    e.quantity = "Số lượng phải > 0";
                }
                if (!it.unit_price || Number(it.unit_price) <= 0) {
                    e.unit_price = "Đơn giá phải > 0";
                }
                return e;
            });
            if (itemErrs.some((x) => Object.keys(x).length > 0)) {
                errors.itemDetails = itemErrs;
            }
        }
        return errors;
    };

    const openImportModal = async () => {
        setShowImportModal(true);
        try {
            // Use /page endpoint to get paginated results
            const response = await apiClient.get("/purchase-quotations/page", {
                params: { page: 0, size: 100, sort: "createdAt,desc" }
            });

            const data = response.data || {};
            const allList = data?.content || [];

            console.log("Quotation list response:", data);
            console.log("Quotations found:", allList.length);

            if (!Array.isArray(allList) || allList.length === 0) {
                toast.info("Không có báo giá nào");
                setQuotationList([]);
                return;
            }

            // Debug: Log all quotations with their statuses
            console.log("All quotations:", allList.map(pq => ({
                pqNo: pq.pqNo || pq.pq_no,
                status: pq.status,
                statusType: typeof pq.status,
                statusName: pq.status?.name,
                statusValue: pq.status?.value
            })));

            // Filter: Chỉ hiển thị báo giá đã được Approved và chưa được sử dụng để tạo PO
            const approvedQuotations = allList.filter(pq => {
                const status = typeof pq.status === 'string' ? pq.status : pq.status?.name || pq.status?.value;
                // Chỉ lấy các báo giá đã được phê duyệt (case-insensitive)
                const normalizedStatus = status?.toString().toUpperCase();
                return normalizedStatus === 'APPROVED';
            });

            console.log("Approved quotations found:", approvedQuotations.length);

            // Check which quotations already have POs
            const quotationsWithPOStatus = await Promise.all(
                approvedQuotations.map(async (pq) => {
                    try {
                        // Check if this quotation already has a PO
                        const poResponse = await apiClient.get(`/purchase-orders/pq/${pq.pqId}`);
                        const pos = poResponse.data || [];
                        const hasActivePO = Array.isArray(pos) && pos.length > 0;
                        return {
                            ...pq,
                            hasActivePO
                        };
                    } catch (err) {
                        // If error (like 404), assume no PO exists
                        return {
                            ...pq,
                            hasActivePO: false
                        };
                    }
                })
            );

            // Hiển thị tất cả PQ nhưng đánh dấu và disable những PQ đã sử dụng
            const currentPqId = formData.pq_id;

            console.log("Current form PQ ID:", currentPqId);
            console.log("Total approved quotations:", quotationsWithPOStatus.length);
            console.log("Quotations with PO:", quotationsWithPOStatus.filter(pq => pq.hasActivePO).length);

            // Hiển thị tất cả, nhưng đánh dấu và disable những PQ đã dùng hoặc đang dùng
            const quotationOptions = quotationsWithPOStatus.map((pq) => {
                const pqId = pq.pqId || pq.pq_id;
                const isCurrentlyUsed = pqId === currentPqId;
                const isUsedInOtherPO = pq.hasActivePO && !isCurrentlyUsed;
                const isDisabled = isCurrentlyUsed || isUsedInOtherPO;

                let labelSuffix = '';
                if (isCurrentlyUsed) {
                    labelSuffix = ' (Đang sử dụng)';
                } else if (isUsedInOtherPO) {
                    labelSuffix = ' (Đã sử dụng)';
                }

                return {
                    value: pqId,
                    label: `${pq.pqNo || pq.pq_no || "PQ"} - ${pq.vendorName || pq.vendor?.name || "N/A"} - ${formatCurrency(pq.totalAmount || 0)}${labelSuffix}`,
                    quotation: pq,
                    isDisabled: isDisabled
                };
            });

            setQuotationList(quotationOptions);
        } catch (err) {
            console.error("Load quotation list error:", err);
            console.error("Error response:", err.response?.data);
            console.error("Error status:", err.response?.status);
            toast.error("Không thể tải danh sách báo giá: " + (err.response?.data?.message || err.message));
            setQuotationList([]);
        }
    };

    const importFromSelectedQuotation = async () => {
        if (!selectedQuotation?.value) {
            toast.warn("Chọn một báo giá để nhập");
            return;
        }
        try {
            const res = await apiClient.get(`/purchase-quotations/${selectedQuotation.value}`);
            const data = res.data || {};
            const pqItems = data.items || [];

            console.log("📦 PQ Detail Response:", JSON.stringify(data, null, 2));
            console.log("📦 PQ Items:", JSON.stringify(pqItems, null, 2));

            if (!Array.isArray(pqItems) || pqItems.length === 0) {
                toast.info("Báo giá không có dòng sản phẩm");
                return;
            }

            // Get vendor and other info from quotation - try both camelCase and snake_case
            const vendorId = data.vendorId || data.vendor_id || data.vendor?.vendorId || data.vendor?.vendor_id || data.vendor?.id;
            const deliveryTerms = data.deliveryTerms || data.delivery_terms || "";
            const paymentTerms = data.paymentTerms || data.payment_terms || "";
            const leadTimeDays = data.leadTimeDays || data.lead_time_days || 0;
            
            console.log("=== IMPORT FROM QUOTATION DEBUG ===");
            console.log("Full PQ data:", JSON.stringify(data, null, 2));
            console.log("Extracted values:", {
                vendorId,
                deliveryTerms,
                paymentTerms,
                leadTimeDays,
                "raw_deliveryTerms": data.deliveryTerms,
                "raw_delivery_terms": data.delivery_terms,
                "raw_paymentTerms": data.paymentTerms,
                "raw_payment_terms": data.payment_terms,
                "raw_leadTimeDays": data.leadTimeDays,
                "raw_lead_time_days": data.lead_time_days
            });
            console.log("Current vendors list length:", vendors.length);
            console.log("First 3 vendors:", vendors.slice(0, 3));
            
            // Calculate delivery date based on leadTimeDays
            let deliveryDate = null;
            if (leadTimeDays > 0) {
                const today = new Date();
                today.setDate(today.getDate() + leadTimeDays);
                deliveryDate = today;
            }
            
            console.log("Importing from quotation - Vendor ID:", vendorId);
            console.log("Lead time days:", leadTimeDays, "Calculated delivery date:", deliveryDate);

            if (!vendorId) {
                toast.error("Báo giá không có thông tin nhà cung cấp");
                return;
            }

            // Load product details for each item to get UOM
            const itemsWithDetails = await Promise.all(
                pqItems.map(async (it, idx) => {
                    try {
                        console.log(`🔍 Processing PQ item ${idx}:`, JSON.stringify(it, null, 2));
                        
                        const productId = it.productId || it.product_id || it.product?.productId || it.product?.product_id;
                        console.log(`   Product ID extracted: ${productId}`);
                        
                        if (!productId) {
                            console.warn(`   ⚠️ No product ID found for item ${idx}`);
                            return null;
                        }

                        // Fetch product details to get UOM
                        const productRes = await apiClient.get(`/product/${productId}`);
                        const product = productRes.data || {};
                        console.log(`   ✅ Product details loaded:`, product.sku, product.name);

                        const quantity = Number(it.quantity || 1);
                        const unitPrice = Number(it.unitPrice || it.unit_price || 0);
                        const discountPercent = Number(it.discountPercent || it.discount_percent || 0);
                        const taxRate = Number(it.taxRate || it.tax_rate || 0);
                        const calc = {
                            quantity,
                            unit_price: unitPrice,
                            discount_percent: discountPercent,
                            tax_rate: taxRate
                        };
                        const totals = calculateItemTotal(calc);

                        const mappedItem = {
                            pq_item_id: it.pqItemId || it.pq_item_id,
                            product_id: productId,
                            productCode: it.productCode || it.product_code || product.sku || product.productCode || "",
                            productName: it.productName || it.product_name || product.name || "",
                            uom: product.uom || product.unit || "",
                            quantity,
                            unit_price: unitPrice,
                            discount_percent: discountPercent,
                            tax_rate: taxRate,
                            tax_amount: totals.tax,
                            line_total: totals.total,
                            delivery_date: null,
                            note: it.remark || it.note || "",
                        };
                        
                        console.log(`   ✅ Mapped item:`, mappedItem);
                        return mappedItem;
                    } catch (err) {
                        console.error(`   ❌ Error processing item ${idx}:`, err);
                        console.error(`   Error details:`, err.response?.data || err.message);
                        return null;
                    }
                })
            );

            const mapped = itemsWithDetails.filter(m => m !== null);

            console.log("✅ Mapped items count:", mapped.length);
            console.log("✅ Final mapped items:", JSON.stringify(mapped, null, 2));

            if (mapped.length === 0) {
                toast.info("Không có sản phẩm hợp lệ để nhập");
                return;
            }

            // Check if vendor exists - just log warning but continue
            const vendorIdNum = Number(vendorId);
            const vendorExists = vendors.find(v => Number(v.value) === vendorIdNum);
            
            if (!vendorExists) {
                console.warn("⚠️ Vendor not found in current list, but will proceed with import:", {
                    vendorId,
                    vendorIdNum,
                    total_vendors: vendors.length
                });
                // Still continue - form validation will catch if vendor is truly invalid
            } else {
                console.log("✅ Vendor found:", vendorExists.label);
            }

            // Update formData with ALL information from quotation
            const headerDiscount = Number(data.headerDiscount || data.header_discount || 0);
            
            const updatedFormData = { 
                ...formData, 
                vendor_id: vendorId,
                pq_id: selectedQuotation.value,
                payment_terms: paymentTerms || "",
                delivery_date: deliveryDate || "",
                shipping_address: deliveryTerms || "",
                header_discount: headerDiscount,
                items: mapped 
            };
            
            console.log("✅ Setting form data with PQ info:", {
                vendor_id: vendorId,
                payment_terms: paymentTerms,
                delivery_date: deliveryDate,
                shipping_address: deliveryTerms,
                header_discount: headerDiscount,
                items_count: mapped.length,
                items: mapped
            });
            
            // Update state with new data
            setFormData(updatedFormData);
            setIsImportedFromPQ(true);
            
            setShowImportModal(false);
            setSelectedQuotation(null);
            toast.success(`Đã nhập ${mapped.length} sản phẩm từ báo giá`);
        } catch (err) {
            console.error("Import quotation items error:", err);
            toast.error("Không thể nhập từ báo giá");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setValidationErrors({});

        const errors = validateAll();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setIsSubmitting(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        try {
            const payload = {
                poNo: formData.po_no,
                vendorId: formData.vendor_id,
                pqId: formData.pq_id || null,
                orderDate: formData.order_date instanceof Date ? formData.order_date.toISOString() : new Date(formData.order_date).toISOString(),
                status: formData.status || "Pending",
                approvalStatus: formData.approval_status || "Pending",
                paymentTerms: formData.payment_terms || "",
                deliveryDate: formData.delivery_date ? (formData.delivery_date instanceof Date ? formData.delivery_date.toISOString() : new Date(formData.delivery_date).toISOString()) : null,
                shippingAddress: formData.shipping_address || "",
                headerDiscount: Number(formData.header_discount || 0),
                totalBeforeTax,
                taxAmount: totalTax,
                totalAfterTax,
                items: formData.items.map((it) => ({
                    pqItemId: it.pq_item_id || it.pqItemId || null,
                    productId: it.product_id,
                    uom: it.uom || "",
                    quantity: Number(it.quantity || 0),
                    unitPrice: Number(it.unit_price || 0),
                    discountPercent: Number(it.discount_percent || 0),
                    taxRate: Number(it.tax_rate || 0),
                    taxAmount: Number(it.tax_amount || 0),
                    lineTotal: Number(it.line_total || 0),
                    deliveryDate: it.delivery_date ? (it.delivery_date instanceof Date ? it.delivery_date.toISOString().split('T')[0] : new Date(it.delivery_date).toISOString().split('T')[0]) : null,
                    note: it.note || "",
                })),
            };

            console.log("=== Submitting Purchase Order ===");
            console.log("Payload:", JSON.stringify(payload, null, 2));
            console.log("Current User ID:", currentUserId);

            if (isEdit) {
                await purchaseOrderService.updatePurchaseOrder(id, payload, currentUserId);
                toast.success("Cập nhật Đơn hàng mua thành công!");
            } else {
                const response = await purchaseOrderService.createPurchaseOrder(payload, currentUserId);
                console.log("Create response:", response);
                toast.success("Tạo Đơn hàng mua thành công!");
                
                // Close PR after creating PO
                if (prIdFromQuery) {
                    try {
                        await purchaseRequisitionService.closeRequisition(prIdFromQuery);
                        console.log("PR closed after creating PO:", prIdFromQuery);
                    } catch (closeErr) {
                        console.warn("Could not close PR:", closeErr);
                    }
                }
            }
            navigate("/purchase/purchase-orders");
        } catch (err) {
            console.error("=== Error saving Purchase Order ===");
            console.error("Error object:", err);
            console.error("Response data:", err?.response?.data);
            console.error("Response status:", err?.response?.status);
            const msg = err?.response?.data?.message || err?.message || (isEdit ? "Không thể cập nhật Đơn hàng mua" : "Không thể tạo Đơn hàng mua");
            setError(msg);
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/purchase/purchase-orders");
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
                            {isEdit ? "Cập nhật Đơn hàng mua" : "Thêm Đơn hàng mua"}
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
                            <h2 className="text-lg font-semibold text-gray-900">Thông tin Đơn hàng mua</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số đơn hàng <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.po_no}
                                            readOnly
                                            className={
                                                validationErrors.po_no
                                                    ? "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 border-red-500"
                                                    : "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 border-gray-300"
                                            }
                                            placeholder="Số sẽ được tự động tạo"
                                        />
                                        {validationErrors.po_no && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.po_no}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Người làm đơn
                                        </label>
                                        <input
                                            type="text"
                                            value={getUserDisplayName(currentUser)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nhà cung cấp <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            value={selectedVendor}
                                            onChange={handleVendorChange}
                                            options={vendors}
                                            isLoading={loadingVendors}
                                            isClearable
                                            placeholder="Chọn nhà cung cấp"
                                            classNamePrefix="react-select"
                                        />
                                        {validationErrors.vendor_id && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.vendor_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày đặt hàng <span className="text-red-500">*</span>
                                        </label>
                                        <DatePicker
                                            selected={formData.order_date instanceof Date ? formData.order_date : (formData.order_date ? new Date(formData.order_date) : new Date())}
                                            onChange={(date) => handleInputChange("order_date", date)}
                                            dateFormat="dd/MM/yyyy"
                                            className={
                                                validationErrors.order_date
                                                    ? "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-red-500"
                                                    : "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                                            }
                                        />
                                        {validationErrors.order_date && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.order_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày giao hàng
                                        </label>
                                        <DatePicker
                                            selected={formData.delivery_date instanceof Date ? formData.delivery_date : (formData.delivery_date ? new Date(formData.delivery_date) : null)}
                                            onChange={(date) => handleInputChange("delivery_date", date)}
                                            dateFormat="dd/MM/yyyy"
                                            isClearable
                                            placeholderText="Chọn ngày giao hàng"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Điều khoản thanh toán
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.payment_terms}
                                            onChange={(e) => handleInputChange("payment_terms", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="VD: Net 30, COD, ..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Địa chỉ giao hàng
                                    </label>
                                    <textarea
                                        value={formData.shipping_address}
                                        onChange={(e) => handleInputChange("shipping_address", e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nhập địa chỉ giao hàng"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chiết khấu tổng đơn (%) <span className="text-gray-500 text-xs font-normal">- Tùy chọn</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.header_discount}
                                        onChange={(e) => handleInputChange("header_discount", parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="VD: 2 (giảm 2%)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Chiết khấu áp dụng trước khi tính thuế
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Thuế VAT (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.items.length > 0 ? formData.items[0].tax_rate || 10 : 10}
                                        onChange={(e) => {
                                            const newTaxRate = parseFloat(e.target.value) || 0;
                                            setFormData(prev => ({
                                                ...prev,
                                                items: prev.items.map(item => ({ ...item, tax_rate: newTaxRate }))
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="10.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Thuế tính trên tổng sau tất cả chiết khấu
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
                                    <div className="flex gap-2">
                                        {!isImportedFromPQ && (
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                            >
                                                Thêm sản phẩm
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={openImportModal}
                                            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition"
                                        >
                                            Nhập từ báo giá
                                        </button>
                                    </div>
                                </div>
                                
                                {isImportedFromPQ && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="text-sm text-blue-800">
                                            ℹ️ Danh sách sản phẩm đã được nhập từ báo giá. Chỉ có thể import lại từ báo giá khác hoặc chỉnh sửa thông tin hiện tại.
                                        </p>
                                    </div>
                                )}

                                {validationErrors.items && (
                                    <p className="text-red-500 text-sm mb-4">{validationErrors.items}</p>
                                )}

                                {formData.items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">#</th>
                                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Mã SP</th>
                                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">ĐVT</th>
                                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Đơn giá</th>
                                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">CK (%)</th>
                                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thành tiền</th>
                                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thao tác</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {formData.items.map((item, index) => {
                                                const itemErr = validationErrors.itemDetails?.[index] || {};
                                                const selectedProduct = products.find((o) => o.value === item.product_id);
                                                
                                                return (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {item.productCode ? (
                                                                <input
                                                                    type="text"
                                                                    value={item.productCode}
                                                                    readOnly
                                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                                                                />
                                                            ) : (
                                                                <Select
                                                                    value={selectedProduct || null}
                                                                    onChange={(opt) => handleProductSelect(index, opt)}
                                                                    options={products}
                                                                    placeholder="Chọn sản phẩm"
                                                                    menuPortalTarget={document.body}
                                                                    menuPosition="fixed"
                                                                    styles={{
                                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                                                    }}
                                                                />
                                                            )}
                                                            {itemErr.productName && (
                                                                <p className="text-red-500 text-xs mt-1">{itemErr.productName}</p>
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            <input
                                                                type="text"
                                                                value={item.uom}
                                                                readOnly
                                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                                                            />
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {isImportedFromPQ ? (
                                                                <span className="px-2 py-1 text-sm">{item.quantity}</span>
                                                            ) : (
                                                                <input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 1)}
                                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="1"
                                                                    step="1"
                                                                />
                                                            )}
                                                            {itemErr.quantity && (
                                                                <p className="text-red-500 text-xs mt-1">{itemErr.quantity}</p>
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {isImportedFromPQ ? (
                                                                <span className="px-2 py-1 text-sm">{formatCurrency(item.unit_price)}</span>
                                                            ) : (
                                                                <input
                                                                    type="number"
                                                                    value={item.unit_price}
                                                                    onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            )}
                                                            {itemErr.unit_price && (
                                                                <p className="text-red-500 text-xs mt-1">{itemErr.unit_price}</p>
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {isImportedFromPQ ? (
                                                                <span className="px-2 py-1 text-sm">{item.discount_percent}%</span>
                                                            ) : (
                                                                <input
                                                                    type="number"
                                                                    value={item.discount_percent || 0}
                                                                    onChange={(e) => handleItemChange(index, "discount_percent", parseFloat(e.target.value) || 0)}
                                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2 text-sm font-medium">
                                                            {formatCurrency(item.line_total || 0)}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(index)}
                                                                disabled={isImportedFromPQ}
                                                                className={`text-sm ${isImportedFromPQ ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
                                                                title={isImportedFromPQ ? 'Không thể xóa sản phẩm từ báo giá' : 'Xóa sản phẩm'}
                                                            >
                                                                Xóa
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                            <tfoot>
                                            <tr className="bg-gray-50">
                                                <td colSpan={6} className="border border-gray-200 px-4 py-2 text-right font-semibold">
                                                    Tổng giá trị hàng:
                                                </td>
                                                <td className="border border-gray-200 px-4 py-2 font-semibold">
                                                    {formatCurrency(totalBeforeTax)}
                                                </td>
                                                <td className="border border-gray-200"></td>
                                            </tr>
                                            {totalDiscount > 0 && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={6} className="border border-gray-200 px-4 py-2 text-right font-semibold">
                                                        Chiết khấu sản phẩm:
                                                    </td>
                                                    <td className="border border-gray-200 px-4 py-2 font-semibold text-red-600">
                                                        -{formatCurrency(totalDiscount)}
                                                    </td>
                                                    <td className="border border-gray-200"></td>
                                                </tr>
                                            )}
                                            <tr className="bg-gray-50">
                                                <td colSpan={6} className="border border-gray-200 px-4 py-2 text-right font-semibold">
                                                    Tổng sau chiết khấu sản phẩm:
                                                </td>
                                                <td className="border border-gray-200 px-4 py-2 font-semibold">
                                                    {formatCurrency(totalAfterLineDiscount)}
                                                </td>
                                                <td className="border border-gray-200"></td>
                                            </tr>
                                            {formData.header_discount > 0 && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={6} className="border border-gray-200 px-4 py-2 text-right font-semibold">
                                                        Chiết khấu tổng đơn ({formData.header_discount}%):
                                                    </td>
                                                    <td className="border border-gray-200 px-4 py-2 font-semibold text-red-600">
                                                        -{formatCurrency(headerDiscountAmount)}
                                                    </td>
                                                    <td className="border border-gray-200"></td>
                                                </tr>
                                            )}
                                            <tr className="bg-gray-50">
                                                <td colSpan={6} className="border border-gray-200 px-4 py-2 text-right font-semibold">
                                                    Thuế VAT ({formData.items.length > 0 ? formData.items[0].tax_rate || 0 : 0}%):
                                                </td>
                                                <td className="border border-gray-200 px-4 py-2 font-semibold">
                                                    {formatCurrency(totalTax)}
                                                </td>
                                                <td className="border border-gray-200"></td>
                                            </tr>
                                            <tr className="bg-gray-100">
                                                <td colSpan={6} className="border border-gray-200 px-4 py-2 text-right font-bold">
                                                    Tổng cộng:
                                                </td>
                                                <td className="border border-gray-200 px-4 py-2 font-bold">
                                                    {formatCurrency(totalAfterTax)}
                                                </td>
                                                <td className="border border-gray-200"></td>
                                            </tr>
                                            </tfoot>
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
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        isEdit ? "Cập nhật" : "Tạo đơn hàng"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Import Quotation Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
                        <h3 className="text-lg font-semibold mb-4">Nhập từ Báo giá</h3>
                        <div className="mb-4">
                            <Select
                                value={selectedQuotation}
                                onChange={setSelectedQuotation}
                                options={quotationList}
                                placeholder="Chọn báo giá"
                                classNamePrefix="react-select"
                                isOptionDisabled={(option) => option.isDisabled}
                                styles={{
                                    option: (provided, state) => ({
                                        ...provided,
                                        color: state.isDisabled ? '#9ca3af' : provided.color,
                                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                                        fontStyle: state.isDisabled ? 'italic' : 'normal'
                                    })
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setSelectedQuotation(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={importFromSelectedQuotation}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Nhập
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

