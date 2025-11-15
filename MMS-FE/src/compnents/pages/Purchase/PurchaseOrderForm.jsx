import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { purchaseOrderService } from "../../../api/purchaseOrderService";
import apiClient from "../../../api/apiClient";
import { getCurrentUser } from "../../../api/authService";

export default function PurchaseOrderForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        po_no: "",
        vendor_id: null,
        pq_id: null,
        order_date: new Date().toISOString().split('T')[0],
        status: "Pending",
        approval_status: "Pending",
        payment_terms: "",
        delivery_date: null,
        shipping_address: "",
        items: [
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

    const [vendors, setVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [products, setProducts] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Import Quotation state
    const [showImportModal, setShowImportModal] = useState(false);
    const [quotationList, setQuotationList] = useState([]);
    const [selectedQuotation, setSelectedQuotation] = useState(null);

    // Calculate totals
    const calculateItemTotal = (item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unit_price || 0);
        const taxRate = Number(item.tax_rate || 0) / 100;
        const subtotal = qty * price;
        const tax = subtotal * taxRate;
        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    };

    const totalBeforeTax = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        return formData.items.reduce((sum, it) => {
            const calc = calculateItemTotal(it);
            return sum + calc.subtotal;
        }, 0);
    }, [formData.items]);

    const totalTax = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        return formData.items.reduce((sum, it) => {
            const calc = calculateItemTotal(it);
            return sum + calc.tax;
        }, 0);
    }, [formData.items]);

    const totalAfterTax = useMemo(() => {
        return totalBeforeTax + totalTax;
    }, [totalBeforeTax, totalTax]);

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
        if (isEdit) {
            loadOrder();
        } else {
            // Generate PO number for new order
            generatePONumber();
        }
    }, [id]);

    const generatePONumber = async () => {
        try {
            const response = await purchaseOrderService.generatePONo();
            if (response?.po_no || response?.poNo) {
                setFormData(prev => ({ ...prev, po_no: response.po_no || response.poNo }));
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
            setVendors(
                data.map((v) => ({
                    value: v.vendor_id || v.id,
                    label: v.name || `Vendor ${v.vendor_id || v.id}`,
                    vendor: v,
                }))
            );
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

    const loadOrder = async () => {
        try {
            setLoading(true);
            const order = await purchaseOrderService.getPurchaseOrderById(id);
            
            // Load items
            const itemsResponse = await apiClient.get(`/purchase-orders/${id}/items`);
            const itemsData = Array.isArray(itemsResponse.data) 
                ? itemsResponse.data 
                : itemsResponse.data?.content || [];

            setFormData({
                po_no: order.po_no || order.poNo || "",
                vendor_id: order.vendor_id || order.vendorId || null,
                pq_id: order.pq_id || order.pqId || null,
                order_date: order.order_date || order.orderDate 
                    ? new Date(order.order_date || order.orderDate).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                status: order.status || "Pending",
                approval_status: order.approval_status || order.approvalStatus || "Pending",
                payment_terms: order.payment_terms || order.paymentTerms || "",
                delivery_date: order.delivery_date || order.deliveryDate 
                    ? new Date(order.delivery_date || order.deliveryDate).toISOString().split('T')[0]
                    : null,
                shipping_address: order.shipping_address || order.shippingAddress || "",
                items: itemsData.length > 0 ? itemsData.map((it) => ({
                    product_id: it.product_id || it.productId || null,
                    productCode: it.productCode || "",
                    productName: it.productName || it.product_name || "",
                    uom: it.uom || "",
                    quantity: it.quantity || 1,
                    unit_price: it.unit_price || it.unitPrice || 0,
                    tax_rate: it.tax_rate || it.taxRate || 0,
                    tax_amount: it.tax_amount || it.taxAmount || 0,
                    line_total: it.line_total || it.lineTotal || 0,
                    delivery_date: it.delivery_date || it.deliveryDate 
                        ? new Date(it.delivery_date || it.deliveryDate).toISOString().split('T')[0]
                        : null,
                    note: it.note || "",
                })) : [{
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
                }],
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
            
            // Recalculate totals when quantity, price, or tax rate changes
            if (field === "quantity" || field === "unit_price" || field === "tax_rate") {
                const calc = calculateItemTotal(next[index]);
                next[index].tax_amount = calc.tax;
                next[index].line_total = calc.total;
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
            handleItemChange(index, "product_id", product.product_id || product.id);
            handleItemChange(index, "productCode", product.sku || product.productCode || "");
            handleItemChange(index, "productName", product.name || "");
            handleItemChange(index, "uom", product.uom || product.unit || "");
            if (product.purchase_price) {
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
            const response = await apiClient.get("/purchase-quotations", {
                params: { page: 0, size: 50, sort: "createdAt,desc" }
            });
            
            const data = response.data || {};
            const list = Array.isArray(data) ? data : (data?.content || []);
            
            if (list.length === 0) {
                toast.info("Không có báo giá nào");
                setQuotationList([]);
                return;
            }
            
            setQuotationList(
                list.map((pq) => ({
                    value: pq.pq_id || pq.id,
                    label: `${pq.pq_no || pq.pqNo || "PQ"} - ${pq.vendorName || pq.vendor?.name || ""} - ${formatCurrency(pq.totalAmount || pq.total_amount || 0)}`,
                    quotation: pq,
                }))
            );
        } catch (err) {
            console.error("Load quotation list error:", err);
            toast.error("Không thể tải danh sách báo giá");
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
            const pqItems = data.items || data.pqItems || [];

            if (!Array.isArray(pqItems) || pqItems.length === 0) {
                toast.info("Báo giá không có dòng sản phẩm");
                return;
            }

            // Set vendor from quotation
            if (data.vendor_id || data.vendorId) {
                const vendorOption = vendors.find(v => v.value === (data.vendor_id || data.vendorId));
                if (vendorOption) {
                    handleInputChange("vendor_id", data.vendor_id || data.vendorId);
                    handleInputChange("pq_id", selectedQuotation.value);
                }
            }

            // Map items
            const mapped = pqItems.map((it) => {
                const productId = it.product_id || it.productId || it.product?.id || it.product?.product_id || null;
                const quantity = it.quantity || it.quoted_quantity || 1;
                const unitPrice = it.unit_price || it.unitPrice || it.quoted_price || 0;
                const taxRate = it.tax_rate || it.taxRate || 0;
                const calc = {
                    quantity,
                    unit_price: unitPrice,
                    tax_rate: taxRate
                };
                const totals = calculateItemTotal(calc);
                
                return {
                    product_id: productId,
                    productCode: it.productCode || it.product?.sku || "",
                    productName: it.productName || it.product_name || it.product?.name || "",
                    uom: it.uom || it.product?.uom || "",
                    quantity,
                    unit_price: unitPrice,
                    tax_rate: taxRate,
                    tax_amount: totals.tax,
                    line_total: totals.total,
                    delivery_date: it.delivery_date || it.deliveryDate 
                        ? new Date(it.delivery_date || it.deliveryDate).toISOString().split('T')[0]
                        : null,
                    note: it.note || "",
                };
            }).filter(m => m.product_id);

            if (mapped.length === 0) {
                toast.info("Không có sản phẩm hợp lệ để nhập");
                return;
            }

            setFormData((prev) => ({ ...prev, items: mapped }));
            setShowImportModal(false);
            setSelectedQuotation(null);
            toast.success("Đã nhập sản phẩm từ báo giá");
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
                po_no: formData.po_no,
                vendor_id: formData.vendor_id,
                pq_id: formData.pq_id,
                order_date: formData.order_date,
                status: formData.status,
                approval_status: formData.approval_status,
                payment_terms: formData.payment_terms,
                delivery_date: formData.delivery_date,
                shipping_address: formData.shipping_address,
                total_before_tax: totalBeforeTax,
                tax_amount: totalTax,
                total_after_tax: totalAfterTax,
                items: formData.items.map((it) => ({
                    product_id: it.product_id,
                    uom: it.uom,
                    quantity: Number(it.quantity),
                    unit_price: Number(it.unit_price || 0),
                    tax_rate: Number(it.tax_rate || 0),
                    tax_amount: Number(it.tax_amount || 0),
                    line_total: Number(it.line_total || 0),
                    delivery_date: it.delivery_date || null,
                    note: it.note || "",
                })),
            };

            if (isEdit) {
                await purchaseOrderService.updatePurchaseOrder(id, payload);
                toast.success("Cập nhật Đơn hàng mua thành công!");
            } else {
                await purchaseOrderService.createPurchaseOrder(payload);
                toast.success("Tạo Đơn hàng mua thành công!");
            }
            navigate("/purchase/orders");
        } catch (err) {
            console.error("Error saving Purchase Order:", err);
            const msg = err?.response?.data?.message || (isEdit ? "Không thể cập nhật Đơn hàng mua" : "Không thể tạo Đơn hàng mua");
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/purchase/orders");
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
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 ${validationErrors.po_no ? "border-red-500" : "border-gray-300"}`}
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
                                            value={vendors.find((v) => v.value === formData.vendor_id) || null}
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
                                        <input
                                            type="date"
                                            value={formData.order_date}
                                            onChange={(e) => handleInputChange("order_date", e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.order_date ? "border-red-500" : "border-gray-300"}`}
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
                                        <input
                                            type="date"
                                            value={formData.delivery_date || ""}
                                            onChange={(e) => handleInputChange("delivery_date", e.target.value || null)}
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
                            </div>

                            <div className="bg-white rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                        >
                                            Thêm sản phẩm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openImportModal}
                                            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition"
                                        >
                                            Nhập từ báo giá
                                        </button>
                                    </div>
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
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">ĐVT</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Đơn giá</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thuế (%)</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thành tiền</th>
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
                                                                    value={products.find((o) => o.value === item.product_id) || null}
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
                                                                <input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 1)}
                                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="1"
                                                                    step="1"
                                                                />
                                                                {itemErr.quantity && (
                                                                    <p className="text-red-500 text-xs mt-1">{itemErr.quantity}</p>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    value={item.unit_price}
                                                                    onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                                {itemErr.unit_price && (
                                                                    <p className="text-red-500 text-xs mt-1">{itemErr.unit_price}</p>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    value={item.tax_rate}
                                                                    onChange={(e) => handleItemChange(index, "tax_rate", parseFloat(e.target.value) || 0)}
                                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                />
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2 text-sm font-medium">
                                                                {formatCurrency(item.line_total || 0)}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(index)}
                                                                    className="text-red-600 hover:text-red-800 text-sm"
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
                                                        Tổng trước thuế:
                                                    </td>
                                                    <td className="border border-gray-200 px-4 py-2 font-semibold">
                                                        {formatCurrency(totalBeforeTax)}
                                                    </td>
                                                    <td className="border border-gray-200"></td>
                                                </tr>
                                                <tr className="bg-gray-50">
                                                    <td colSpan={6} className="border border-gray-200 px-4 py-2 text-right font-semibold">
                                                        Tổng thuế:
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

