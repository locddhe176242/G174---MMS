import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { rfqService } from "../../../api/rfqService";
import { purchaseRequisitionService } from "../../../api/purchaseRequisitionService";
import apiClient from "../../../api/apiClient";
import { getCurrentUser } from "../../../api/authService";

export default function RFQForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        rfqNo: "",
        issueDate: new Date(),
        dueDate: null,
        status: "Draft",
        selectedVendorIds: [],
        notes: "",
        items: [
            {
                rfqItemId: null,
                productId: null,
                productCode: "",
                productName: "",
                uom: "",
                quantity: 1,
                deliveryDate: null,
                targetPrice: 0,
                priceUnit: 1,
                note: "",
            },
        ],
    });

    const [vendors, setVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [products, setProducts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [importedPrId, setImportedPrId] = useState(null); // Track single PR ID (1 RFQ = 1 PR)

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Import PR state
    const [showImportModal, setShowImportModal] = useState(false);
    const [prList, setPrList] = useState([]);           // [{ value,label, pr }]
    const [selectedPr, setSelectedPr] = useState(null); // option được chọn

    // Calculate total value
    const totalValue = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        return formData.items.reduce((sum, it) => {
            const qty = Number(it.quantity || 0);
            const price = Number(it.targetPrice || 0);
            return sum + qty * price;
        }, 0);
    }, [formData.items]);

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
        loadVendors();
        loadProducts();
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const user = getCurrentUser();
            if (user) {
                // Load user profile to get name
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
                } catch (error) {
                    console.error('Error loading user profile:', error);
                    setCurrentUser(user);
                }
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    };

    useEffect(() => {
        if (isEdit) {
            loadRFQ();
        } else {
            generateRFQNo();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEdit]);

    const loadVendors = async () => {
        try {
            setLoadingVendors(true);
            // Tùy backend, sửa path nếu khác (giả định baseURL /api)
            const res = await apiClient.get("/vendors");
            const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
            setVendors(
                data.map((v) => ({
                    value: v.vendorId || v.id,
                    label: v.name,
                }))
            );
        } catch (err) {
            console.error("Error loading vendors:", err);
            toast.error("Không thể tải danh sách nhà cung cấp");
        } finally {
            setLoadingVendors(false);
        }
    };

    const generateRFQNo = async () => {
        try {
            const rfqNo = await rfqService.generateRFQNo();
            if (rfqNo) {
                setFormData((prev) => ({ ...prev, rfqNo, issueDate: new Date() }));
                return;
            }
            // Fallback
            const ts = Date.now().toString().slice(-6);
            setFormData((prev) => ({ ...prev, rfqNo: `RFQ-${ts}`, issueDate: new Date() }));
        } catch (err) {
            console.error("Error generating RFQ number:", err);
            const ts = Date.now().toString().slice(-6);
            setFormData((prev) => ({ ...prev, rfqNo: `RFQ-${ts}`, issueDate: new Date() }));
        }
    };

    const loadProducts = async () => {
        try {
            const res = await apiClient.get("/product", {
                params: { page: 0, size: 1000, sortBy: "createdAt", sortOrder: "desc" },
            });
            const list = Array.isArray(res.data) ? res.data : (res.data.content || []);
            console.log("Products loaded:", list.length);
            console.log("RAW product sample:", list.length > 0 ? list[0] : 'EMPTY');
            const mapped = list.map((p) => {
                // Try all possible field names for product ID
                const productId = p.product_id || p.productId || p.id || p.ID;
                console.log("Mapping product:", { 
                    raw: { product_id: p.product_id, productId: p.productId, id: p.id, sku: p.sku, name: p.name },
                    final_productId: productId 
                });
                return {
                    value: productId,
                    label: `${p.sku || p.productCode || ''} - ${p.name || ''}`.trim(),
                    product: p,
                    normalizedCode: (p.sku || p.productCode || "").trim().toLowerCase(),
                    normalizedName: (p.name || "").trim().toLowerCase(),
                };
            });
            console.log("Products mapped sample:", mapped.slice(0, 3).map(p => ({ value: p.value, label: p.label })));
            setProducts(mapped);
        } catch (err) {
            console.error("Error loading products:", err);
            toast.error("Không thể tải danh sách sản phẩm");
        }
    };

    const loadRFQ = async () => {
        try {
            setLoading(true);
            const rfq = await rfqService.getRFQById(id);
            
            // Handle status enum (can be string or object)
            const statusValue = typeof rfq.status === 'string' 
                ? rfq.status 
                : (rfq.status?.name || rfq.status?.toString() || 'Draft');
            
            // Load imported PR ID from RFQ
            const prId = rfq.requisitionId || rfq.requisition?.requisitionId || rfq.requisition?.id || null;
            if (prId) {
                setImportedPrId(Number(prId));
                console.log("Loaded RFQ from PR ID:", prId);
            }
            
            setFormData({
                rfqNo: rfq.rfqNo || "",
                issueDate: rfq.issueDate ? (typeof rfq.issueDate === 'string' ? new Date(rfq.issueDate) : (rfq.issueDate instanceof Date ? rfq.issueDate : new Date(rfq.issueDate))) : new Date(),
                dueDate: rfq.dueDate ? (typeof rfq.dueDate === 'string' ? rfq.dueDate.slice(0, 10) : rfq.dueDate) : "",
                status: statusValue,
                selectedVendorIds: rfq.selectedVendorIds || 
                    (Array.isArray(rfq.selectedVendors) 
                        ? rfq.selectedVendors.map((v) => v.vendorId || v.id) 
                        : (rfq.selectedVendorId ? [rfq.selectedVendorId] : [])),
                notes: rfq.notes || rfq.note || "",
                items: (rfq.items || []).map((it) => ({
                    rfqItemId: it.rfqItemId || it.itemId || null, // Keep existing item ID for update
                    priId: it.priId || null,
                    productId: it.productId || null,
                    productCode: it.productCode || "",
                    productName: it.productName || "",
                    spec: it.spec || "",
                    uom: it.uom || "",
                    quantity: it.quantity ?? it.requestedQty ?? 0,
                    deliveryDate: it.deliveryDate ? new Date(it.deliveryDate) : null,
                    targetPrice: it.targetPrice ?? it.valuation_price ?? 0,
                    priceUnit: it.priceUnit ?? it.price_unit ?? 1,
                    note: it.note || "",
                })),
            });
        } catch (err) {
            console.error("Error loading RFQ:", err);
            setError("Không thể tải thông tin Yêu cầu báo giá");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleVendorChange = (opts) => {
        const ids = Array.isArray(opts) ? opts.map((o) => o.value) : [];
        handleInputChange("selectedVendorIds", ids);
    };

    const handleItemChange = (index, field, value) => {
        setFormData((prev) => {
            const next = [...prev.items];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, items: next };
        });
    };

    const addItem = () => {
        const currentStatus = formData.status || 'Draft';
        if (['Completed', 'Rejected', 'Cancelled'].includes(currentStatus)) {
            toast.warning(`Không thể thêm sản phẩm khi RFQ đã ${currentStatus}`);
            return;
        }
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                { rfqItemId: null, productId: null, productCode: "", productName: "", uom: "", quantity: 1, deliveryDate: null, targetPrice: 0, priceUnit: 1, note: "" },
            ],
        }));
    };

    const removeItem = (index) => {
        const currentStatus = formData.status || 'Draft';
        if (['Completed', 'Rejected', 'Cancelled'].includes(currentStatus)) {
            toast.warning(`Không thể xóa sản phẩm khi RFQ đã ${currentStatus}`);
            return;
        }
        setFormData((prev) => {
            const next = [...prev.items];
            next.splice(index, 1);
            return { ...prev, items: next.length ? next : [{ rfqItemId: null, productId: null, productCode: "", productName: "", uom: "", quantity: 1, deliveryDate: null, targetPrice: 0, priceUnit: 1, note: "" }] };
        });
    };

    const handleProductSelect = (index, selectedOption) => {
        if (selectedOption) {
            const product = selectedOption.product;
            handleItemChange(index, "productId", product.product_id || product.id);
            handleItemChange(index, "productCode", product.sku || product.productCode || "");
            handleItemChange(index, "productName", product.name || "");
            handleItemChange(index, "uom", product.uom || product.unit || "");
            if (product.purchase_price) {
                handleItemChange(index, "targetPrice", product.purchase_price);
            }
        }
    };

    const validateAll = () => {
        const errors = {};
        if (!formData.rfqNo || !formData.rfqNo.trim()) {
            errors.rfqNo = "Số Yêu cầu báo giá là bắt buộc";
        }
        if (!formData.issueDate) {
            errors.issueDate = "Ngày phát hành là bắt buộc";
        }
        if (!formData.dueDate) {
            errors.dueDate = "Hạn phản hồi là bắt buộc";
        }
        if (formData.issueDate && formData.dueDate) {
            const i = new Date(formData.issueDate);
            const d = new Date(formData.dueDate);
            if (d < i) {
                errors.dueDate = "Hạn phản hồi phải sau Ngày phát hành";
            }
        }
        // Validate items (ít nhất 1 dòng có quantity > 0)
        if (!formData.items || formData.items.length === 0) {
            errors.items = "Cần ít nhất 1 dòng hàng";
        } else {
            const itemErrs = formData.items.map((it) => {
                const e = {};
                if (!it.productId && !it.productName?.trim() && !it.productCode?.trim()) {
                    e.productName = "Chọn sản phẩm hoặc nhập mã/tên";
                }
                if (!it.quantity || Number(it.quantity) <= 0) {
                    e.quantity = "Số lượng phải > 0";
                }
                if (!it.deliveryDate) {
                    e.deliveryDate = "Chọn ngày";
                }
                return e;
            });
            // Nếu tất cả đều rỗng thì không set
            if (itemErrs.some((x) => Object.keys(x).length > 0)) {
                errors.itemDetails = itemErrs;
            }
        }
        return errors;
    };

    // Mở modal và tải danh sách PR
    const openImportModal = async () => {
        // Validate status
        const currentStatus = formData.status || 'Draft';
        if (['Completed', 'Rejected', 'Cancelled'].includes(currentStatus)) {
            toast.warning(`Không thể nhập từ PR khi RFQ đã ${currentStatus}`);
            return;
        }
        setShowImportModal(true);
        try {
            // Chỉ lấy PR đã Approved để import vào RFQ
            const response = await apiClient.get("/purchase-requisitions/page", {
                params: { 
                    page: 0, 
                    size: 100, 
                    sort: "createdAt,desc",
                    status: "Approved" // Chỉ lấy PR đã approved
                }
            });
            
            // Backend trả về Page object
            const pageData = response.data || {};
            const list = pageData.content || [];
            
            if (list.length === 0) {
                toast.info("Không có phiếu yêu cầu nào");
                setPrList([]);
                return;
            }

            // Load all RFQs to check which PRs are already used
            const rfqResponse = await apiClient.get("/rfqs/page", {
                params: { page: 0, size: 1000, sort: "createdAt,desc" }
            });
            
            // Backend may wrap response in {success, message, data}
            const rfqData = rfqResponse.data?.data || rfqResponse.data;
            const allRfqs = rfqData?.content || [];
            
            console.log("All RFQs loaded:", allRfqs.length);
            
            // Get set of PR IDs that are already converted to RFQ
            // Now we can check directly using requisitionId in RFQ (proper relationship)
            const usedPrIds = new Set();
            
            // Method 1: Check PR status (if backend updates it)
            list.forEach(pr => {
                const prId = pr.id ?? pr.requisition_id ?? pr.requisitionId;
                const prStatus = pr.status?.toString?.() || pr.status;
                
                // If PR status is "Converted", mark as used
                if (['Converted', 'Closed', 'Completed'].includes(prStatus)) {
                    usedPrIds.add(Number(prId));
                }
            });
            
            // Method 2: Check if any RFQ has requisitionId matching this PR
            // This is the most accurate method now that we have proper relationship
            for (const rfq of allRfqs) {
                const rfqPrId = rfq.requisitionId || rfq.requisition?.requisitionId || rfq.requisition?.id;
                if (rfqPrId) {
                    usedPrIds.add(Number(rfqPrId));
                    console.log(`PR ${rfqPrId} is linked to RFQ ${rfq.rfqNo || rfq.rfqId}`);
                }
            }

            console.log("Used PR IDs:", Array.from(usedPrIds));
            console.log("Total PRs:", list.length, "Used PRs:", usedPrIds.size);
            
            // Mark PRs that are already used
            const mappedPrList = list.map((pr) => {
                const prId = pr.id ?? pr.requisition_id ?? pr.requisitionId;
                const isUsed = usedPrIds.has(Number(prId));
                return {
                    value: prId,
                    label: `${pr.requisition_no || pr.requisitionNo || pr.prNo || "PR"}${pr.purpose ? ` - ${pr.purpose}` : ""}${isUsed ? " ✓ Đã sử dụng" : ""}`,
                    pr,
                    isUsed,
                    isDisabled: isUsed, // Disable selection for used PRs
                };
            });

            setPrList(mappedPrList);
            
        } catch (err) {
            console.error("Load PR list error:", err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
            toast.error(`Không thể tải danh sách phiếu yêu cầu: ${errorMessage}`);
            setPrList([]);
        }
    };

    // Import dòng sản phẩm từ PR đã chọn
    const findMatchingProduct = (prItem) => {
        if (!products || products.length === 0) {
            console.warn("Products not loaded yet");
            return null;
        }

        const rawId =
            prItem.productId ||
            prItem.product_id ||
            prItem.product?.id ||
            prItem.product?.product_id ||
            null;
        if (rawId) {
            // So sánh với type coercion để tránh lỗi string vs number
            const matchById = products.find((p) => String(p.value) === String(rawId) || Number(p.value) === Number(rawId));
            if (matchById) {
                console.log("Matched product by ID:", rawId, matchById);
                return matchById;
            }
        }

        const normalizedCode = (prItem.productCode || prItem.product?.sku || prItem.product?.productCode || "").trim().toLowerCase();
        if (normalizedCode) {
            const matchByCode = products.find((p) => p.normalizedCode === normalizedCode);
            if (matchByCode) {
                console.log("Matched product by code:", normalizedCode, matchByCode);
                return matchByCode;
            }
        }

        const normalizedName = (prItem.productName || prItem.product?.name || "").trim().toLowerCase();
        if (normalizedName) {
            const matchByName = products.find((p) => p.normalizedName === normalizedName);
            if (matchByName) {
                console.log("Matched product by name:", normalizedName, matchByName);
                return matchByName;
            }
        }

        console.warn("No product match found for:", prItem);
        return null;
    };

    const importFromSelectedPr = async () => {
        if (!selectedPr?.value) {
            toast.warn("Chọn một phiếu yêu cầu để nhập");
            return;
        }

        // Đảm bảo products đã được load
        if (!products || products.length === 0) {
            toast.warn("Đang tải danh sách sản phẩm, vui lòng đợi...");
            await loadProducts();
            // Đợi một chút để state được cập nhật
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        try {
            const prId = selectedPr.value; // Store PR document ID
            const res = await apiClient.get(`/purchase-requisitions/${prId}`);
            const data = res.data || {};
            const prItems = data.items || data.prItems || [];

            if (!Array.isArray(prItems) || prItems.length === 0) {
                toast.info("Phiếu yêu cầu không có dòng sản phẩm");
                return;
            }

            console.log("Importing PR items:", prItems);
            console.log("Available products:", products.length);

            // Map về đúng shape item của form hiện tại
            const mapped = prItems
                .map((it) => {
                    const matchedProduct = findMatchingProduct(it);
                    const fallbackId =
                        it.productId ||
                        it.product_id ||
                        it.product?.id ||
                        it.product?.product_id ||
                        null;

                    // CRITICAL FIX: Ưu tiên productId từ PR item, sau đó mới dùng matched product
                    // Đảm bảo convert sang Number để so sánh đúng
                    const productId = fallbackId ? Number(fallbackId) : (matchedProduct?.value ? Number(matchedProduct.value) : null);

                    // Tìm product object để lấy thông tin đầy đủ
                    const productObj = productId
                        ? products.find(p => Number(p.value) === productId)?.product
                        : matchedProduct?.product;

                    console.log("Mapping PR item:", {
                        prItem: it,
                        matchedProduct: matchedProduct ? { value: matchedProduct.value, label: matchedProduct.label } : null,
                        fallbackId,
                        finalProductId: productId,
                        foundProduct: productObj ? productObj.name : 'NOT FOUND'
                    });

                    return {
                        rfqItemId: null, // New item from PR import
                        priId: it.priId || it.pri_id || it.id || null, // Purchase Requisition Item ID
                        productId,
                        productCode:
                            productObj?.sku ||
                            productObj?.productCode ||
                            it.productCode ||
                            it.product?.sku ||
                            "",
                        productName: productObj?.name || it.productName || it.product?.name || "",
                        spec: it.spec || "",
                        uom: productObj?.uom || productObj?.unit || it.uom || it.product?.uom || "",
                        quantity: it.quantity ?? it.requestedQty ?? 1,
                        deliveryDate: it.deliveryDate ? new Date(it.deliveryDate) : null,
                        targetPrice: it.targetPrice ?? it.valuation_price ?? it.estimatedUnitPrice ?? productObj?.purchase_price ?? 0,
                        priceUnit: it.priceUnit ?? 1,
                        note: it.note || it.remark || "",
                    };
                })
                .filter((item) => {
                    const hasProductId = !!item.productId && !isNaN(item.productId);
                    if (!hasProductId) {
                        console.warn("Filtered out item without valid productId:", item);
                    }
                    return hasProductId;
                });

            console.log("Mapped items after filtering:", mapped);

            if (mapped.length === 0) {
                toast.warn("Không có sản phẩm hợp lệ để nhập. Các sản phẩm trong PR có thể đã bị xóa hoặc không tồn tại trong danh sách sản phẩm.");
                return;
            }

            // Check if already imported from different PR
            if (importedPrId && importedPrId !== prId) {
                toast.error("RFQ chỉ có thể import từ 1 PR duy nhất. Vui lòng xóa items hiện tại trước khi import PR khác.");
                return;
            }
            
            setFormData((prev) => {
                // Replace existing items instead of appending
                // Remove empty default item if exists
                const hasOnlyEmptyItem = prev.items.length === 1 && 
                    !prev.items[0].productId && 
                    !prev.items[0].productName;
                
                const newItems = hasOnlyEmptyItem ? mapped : [...prev.items, ...mapped];
                console.log("Setting formData items:", newItems);
                return { ...prev, items: newItems };
            });
            
            // Track PR ID for status update after RFQ creation
            setImportedPrId(prId);
            
            setShowImportModal(false);
            setSelectedPr(null);
            toast.success(`Đã nhập ${mapped.length} sản phẩm từ phiếu yêu cầu`);
        } catch (err) {
            console.error("Import PR items error:", err);
            toast.error("Không thể nhập từ phiếu yêu cầu: " + (err.message || "Lỗi không xác định"));
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
            // Format dates to YYYY-MM-DD for LocalDate
            const formatDateForBackend = (date) => {
                if (!date) return null;
                if (typeof date === 'string') {
                    // If already in YYYY-MM-DD format, return as is
                    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
                    // Otherwise parse and format
                    const d = new Date(date);
                    return d.toISOString().split('T')[0];
                }
                if (date instanceof Date) {
                    return date.toISOString().split('T')[0];
                }
                return null;
            };

            const payload = {
                rfqNo: formData.rfqNo,
                requisitionId: importedPrId || null, // Link to source PR
                issueDate: formatDateForBackend(formData.issueDate),
                dueDate: formatDateForBackend(formData.dueDate),
                status: formData.status || "Draft",
                selectedVendorIds: formData.selectedVendorIds || [],
                notes: formData.notes || "",
                items: formData.items
                    .filter(it => it.productId || it.productName || it.productCode) // Filter out empty items
                    .map((it) => ({
                        rfqItemId: it.rfqItemId || null, // Keep existing item ID for update
                        priId: it.priId || null, // Purchase Requisition Item ID if imported from PR
                        productId: it.productId || null,
                        productCode: it.productCode || "",
                        productName: it.productName || "",
                        spec: it.spec || "",
                        uom: it.uom || "",
                        quantity: Number(it.quantity) || 1,
                        deliveryDate: formatDateForBackend(it.deliveryDate),
                        targetPrice: Number(it.targetPrice || 0),
                        priceUnit: Number(it.priceUnit || 1),
                        note: it.note || "",
                    })),
            };

            if (isEdit) {
                await rfqService.updateRFQ(id, payload);
                toast.success("Cập nhật Yêu cầu báo giá thành công!");
            } else {
                const createdRfq = await rfqService.createRFQ(payload);
                const vendorCount = payload.selectedVendorIds?.length || 0;
                if (vendorCount > 0) {
                    toast.success(`Tạo RFQ thành công và đã gửi email đến ${vendorCount} nhà cung cấp!`);
                } else {
                    toast.success("Tạo Yêu cầu báo giá thành công!");
                }
                
                // Update PR status to "Converted" after creating RFQ
                if (importedPrId) {
                    console.log("Converting PR that was imported into this RFQ:", importedPrId);
                    
                    try {
                        await apiClient.put(`/purchase-requisitions/${importedPrId}/convert`);
                        console.log(`Converted PR ${importedPrId} to RFQ`);
                    } catch (convertErr) {
                        console.error(`Failed to convert PR ${importedPrId}:`, convertErr);
                        toast.warning("RFQ đã tạo thành công nhưng không thể cập nhật trạng thái PR");
                    }
                }
            }
            navigate("/purchase/rfqs");
        } catch (err) {
            console.error("Error saving RFQ:", err);
            const msg = err?.response?.data?.message || (isEdit ? "Không thể cập nhật Yêu cầu báo giá" : "Không thể tạo Yêu cầu báo giá");
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/purchase/rfqs");
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
                            onClick={handleCancel}
                            className="px-3 py-1.5 rounded border hover:bg-gray-50"
                            title="Quay lại trang trước"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <h1 className="text-2xl font-semibold">
                            {isEdit ? "Cập nhật Yêu cầu báo giá" : "Thêm Yêu cầu báo giá"}
                        </h1>
                        <div className="flex-1"></div>
                        <button
                            type="button"
                            onClick={openImportModal}
                            disabled={['Completed', 'Rejected', 'Cancelled'].includes(formData.status)}
                            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Nhập từ <strong>Phiếu yêu cầu</strong>
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Thông tin Yêu cầu báo giá</h2>
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
                                            Số Yêu cầu báo giá <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.rfqNo}
                                            readOnly
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 ${validationErrors.rfqNo ? "border-red-500" : "border-gray-300"}`}
                                            placeholder="Số sẽ được tự động tạo"
                                        />
                                        {validationErrors.rfqNo && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.rfqNo}</p>
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
                                            Nhà cung cấp
                                        </label>
                                        <Select
                                            isMulti
                                            value={vendors.filter((v) => (formData.selectedVendorIds || []).includes(v.value))}
                                            onChange={handleVendorChange}
                                            options={vendors}
                                            isLoading={loadingVendors}
                                            isClearable
                                            placeholder="Chọn nhà cung cấp"
                                            classNamePrefix="react-select"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trạng thái
                                        </label>
                                        <input
                                            type="text"
                                            value={(() => {
                                                const statusMap = {
                                                    'Draft': 'Nháp',
                                                    'Pending': 'Chờ phản hồi',
                                                    'Sent': 'Đã gửi',
                                                    'Closed': 'Đã đóng',
                                                    'Cancelled': 'Đã hủy'
                                                };
                                                const status = formData.status || "Draft";
                                                return statusMap[status] || status;
                                            })()}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày phát hành đơn <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={(() => {
                                                if (!formData.issueDate) return new Date().toLocaleDateString('vi-VN');
                                                const date = formData.issueDate instanceof Date 
                                                    ? formData.issueDate 
                                                    : new Date(formData.issueDate);
                                                return date.toLocaleDateString('vi-VN');
                                            })()}
                                            readOnly
                                            className={`w-full px-3 py-2 border rounded-lg bg-gray-50 ${validationErrors.issueDate ? "border-red-500" : "border-gray-300"}`}
                                        />
                                        {validationErrors.issueDate && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.issueDate}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Hạn phản hồi <span className="text-red-500">*</span>
                                        </label>
                                        <DatePicker
                                            selected={formData.dueDate instanceof Date ? formData.dueDate : (formData.dueDate ? new Date(formData.dueDate) : null)}
                                            onChange={(date) => handleInputChange("dueDate", date)}
                                            dateFormat="dd/MM/yyyy"
                                            minDate={new Date()}
                                            placeholderText="Chọn hạn phản hồi"
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.dueDate ? "border-red-500" : "border-gray-300"}`}
                                        />
                                        
                                        {validationErrors.dueDate && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        disabled={['Completed', 'Rejected', 'Cancelled'].includes(formData.status)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Thêm sản phẩm
                                    </button>
                                </div>

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
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Sản phẩm</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Ngày cần</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.items.map((item, index) => {
                                                    const itemErr = validationErrors.itemDetails?.[index] || {};
                                                    return (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <Select
                                                                    value={(() => {
                                                                        if (!item.productId) return null;
                                                                        const found = products.find((o) => 
                                                                            String(o.value) === String(item.productId) || 
                                                                            Number(o.value) === Number(item.productId)
                                                                        );
                                                                        console.log(`Row ${index + 1} - productId:`, item.productId, 'found:', found ? found.label : 'NULL', 'products count:', products.length);
                                                                        return found || null;
                                                                    })()}
                                                                    onChange={(opt) => handleProductSelect(index, opt)}
                                                                    options={products}
                                                                    isDisabled={['Completed', 'Rejected', 'Cancelled'].includes(formData.status)}
                                                                    placeholder="Chọn sản phẩm"
                                                                    menuPortalTarget={document.body}
                                                                    menuPosition="fixed"
                                                                    menuShouldScrollIntoView={false}
                                                                    styles={{
                                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                                                    }}
                                                                />
                                                                {itemErr.productName && (
                                                                    <p className="text-red-500 text-xs mt-1">{itemErr.productName}</p>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 1)}
                                                                    disabled={['Completed', 'Rejected', 'Cancelled'].includes(formData.status)}
                                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                    min="1"
                                                                    step="1"
                                                                />
                                                                {itemErr.quantity && (
                                                                    <p className="text-red-500 text-xs mt-1">{itemErr.quantity}</p>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <DatePicker
                                                                    selected={item.deliveryDate}
                                                                    onChange={(date) => handleItemChange(index, "deliveryDate", date)}
                                                                    disabled={['Completed', 'Rejected', 'Cancelled'].includes(formData.status)}
                                                                    dateFormat="dd/MM/yyyy"
                                                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                    placeholderText="Chọn ngày"
                                                                />
                                                                {itemErr.deliveryDate && (
                                                                    <p className="text-red-500 text-xs mt-1">{itemErr.deliveryDate}</p>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(index)}
                                                                    disabled={['Completed', 'Rejected', 'Cancelled'].includes(formData.status)}
                                                                    className="text-red-600 hover:text-red-800 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        <div className="flex justify-end mt-3">
                                            <div className="text-right">
                                                <div className="text-sm text-gray-600">Tổng số lượng</div>
                                                <div className="text-lg font-semibold">{formData.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange("notes", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nhập ghi chú"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                >
                                    {isSubmitting ? "Đang lưu..." : (isEdit ? "Cập nhật" : "Tạo mới")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {showImportModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">Nhập sản phẩm từ phiếu yêu cầu</h3>
                            <button className="btn btn-ghost" onClick={() => setShowImportModal(false)}>Đóng</button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Chọn phiếu yêu cầu</label>
                            <Select
                                value={selectedPr}
                                onChange={setSelectedPr}
                                options={prList}
                                isOptionDisabled={(option) => option.isDisabled}
                                placeholder="Chọn PR..."
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                menuShouldScrollIntoView={false}
                                styles={{
                                    menuPortal: (b) => ({ ...b, zIndex: 10001 }),
                                    menu: (b) => ({ ...b, zIndex: 10001 }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isDisabled 
                                            ? '#f3f4f6' 
                                            : state.isSelected 
                                            ? '#3b82f6' 
                                            : state.isFocused 
                                            ? '#dbeafe' 
                                            : 'white',
                                        color: state.isDisabled ? '#9ca3af' : base.color,
                                        textDecoration: state.isDisabled ? 'line-through' : 'none',
                                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                                    }),
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button className="btn btn-outline" onClick={() => setShowImportModal(false)}>Huỷ</button>
                            <button className="btn btn-primary" onClick={importFromSelectedPr}>Nhập</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}