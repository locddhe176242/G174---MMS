import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { rfqService } from "../../../api/rfqService";
import apiClient from "../../../api/apiClient";

export default function VendorQuotationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        pqNo: "",
        rfqId: null,
        vendorId: null,
        pqDate: new Date(),
        validUntil: null,
        isTaxIncluded: false,
        deliveryTerms: "",
        paymentTerms: "",
        leadTimeDays: null,
        warrantyMonths: null,
        headerDiscount: 0,
        shippingCost: 0,
        totalAmount: 0,
        status: "Pending",
        notes: "",
        items: []
    });

    const [rfqs, setRfqs] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Calculate total amount
    const totalAmount = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        const itemsTotal = formData.items.reduce((sum, it) => {
            return sum + Number(it.lineTotal || 0);
        }, 0);
        const discount = Number(formData.headerDiscount || 0);
        const shipping = Number(formData.shippingCost || 0);
        return itemsTotal - discount + shipping;
    }, [formData.items, formData.headerDiscount, formData.shippingCost]);

    const formatCurrency = (n) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));

    useEffect(() => {
        loadRFQs();
        loadVendors();
        loadProducts();
        if (isEdit) {
            loadQuotation();
        } else {
            generatePQNo();
        }
    }, [id, isEdit]);

    const loadRFQs = async () => {
        try {
            const res = await rfqService.getRFQsWithPagination(0, 100, "createdAt,desc");
            const list = Array.isArray(res) ? res : (res?.content || []);
            setRfqs(
                list.map((rfq) => ({
                    value: rfq.rfqId || rfq.id || rfq.rfq_id,
                    label: `${rfq.rfqNo || rfq.rfq_no || "RFQ"} - ${rfq.status || ""}`,
                    rfq
                }))
            );
        } catch (err) {
            console.error("Error loading RFQs:", err);
            toast.error("Không thể tải danh sách RFQ");
        }
    };

    const loadVendors = async () => {
        try {
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
        }
    };

    const loadProducts = async () => {
        try {
            const res = await apiClient.get("/product", {
                params: { page: 0, size: 100 }
            });
            const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            setProducts(
                list.map((p) => ({
                    value: p.id ?? p.product_id,
                    label: `${p.sku || p.productCode || ""} - ${p.name || ""}`,
                    product: p
                }))
            );
        } catch (err) {
            console.error("Error loading products:", err);
            toast.error("Không thể tải danh sách sản phẩm");
        }
    };

    const generatePQNo = async () => {
        try {
            // Giả định có API generate number, nếu không thì fallback
            const currentYear = new Date().getFullYear();
            const ts = Date.now().toString().slice(-6);
            setFormData((prev) => ({ ...prev, pqNo: `PQ-${currentYear}-${ts}` }));
        } catch (err) {
            console.error("Error generating PQ number:", err);
            const currentYear = new Date().getFullYear();
            const ts = Date.now().toString().slice(-6);
            setFormData((prev) => ({ ...prev, pqNo: `PQ-${currentYear}-${ts}` }));
        }
    };

    const loadQuotation = async () => {
        try {
            setLoading(true);
            // Giả định có API get quotation by id
            const response = await apiClient.get(`/purchase-quotations/${id}`);
            const data = response.data;
            
            setFormData({
                pqNo: data.pqNo || data.pq_no || "",
                rfqId: data.rfqId || data.rfq_id || null,
                vendorId: data.vendorId || data.vendor_id || null,
                pqDate: data.pqDate || data.pq_date ? new Date(data.pqDate || data.pq_date) : new Date(),
                validUntil: data.validUntil || data.valid_until ? new Date(data.validUntil || data.valid_until) : null,
                isTaxIncluded: data.isTaxIncluded || data.is_tax_included || false,
                deliveryTerms: data.deliveryTerms || data.delivery_terms || "",
                paymentTerms: data.paymentTerms || data.payment_terms || "",
                leadTimeDays: data.leadTimeDays || data.lead_time_days || null,
                warrantyMonths: data.warrantyMonths || data.warranty_months || null,
                headerDiscount: data.headerDiscount || data.header_discount || 0,
                shippingCost: data.shippingCost || data.shipping_cost || 0,
                totalAmount: data.totalAmount || data.total_amount || 0,
                status: data.status || "Pending",
                notes: data.notes || "",
                items: (data.items || []).map((it) => ({
                    rfqItemId: it.rfqItemId || it.rfq_item_id,
                    productId: it.productId || it.product_id,
                    quantity: it.quantity || 0,
                    unitPrice: it.unitPrice || it.unit_price || 0,
                    taxRate: it.taxRate || it.tax_rate || 0,
                    taxAmount: it.taxAmount || it.tax_amount || 0,
                    lineTotal: it.lineTotal || it.line_total || 0,
                    remark: it.remark || ""
                }))
            });
        } catch (err) {
            console.error("Error loading quotation:", err);
            setError("Không thể tải thông tin báo giá");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleRFQSelect = async (selectedOption) => {
        if (selectedOption) {
            handleInputChange("rfqId", selectedOption.value);
            // Load RFQ items
            try {
                const rfq = await rfqService.getRFQById(selectedOption.value);
                if (rfq.items && rfq.items.length > 0) {
                    const mappedItems = rfq.items.map((item) => ({
                        rfqItemId: item.rfqItemId || item.rfq_item_id || item.id,
                        productId: item.productId || item.product_id || null,
                        quantity: item.quantity || 0,
                        unitPrice: item.targetPrice || item.target_price || 0,
                        taxRate: 0,
                        taxAmount: 0,
                        lineTotal: 0,
                        remark: item.note || item.remark || ""
                    }));
                    setFormData((prev) => ({ ...prev, items: mappedItems }));
                    toast.success("Đã tải sản phẩm từ RFQ");
                }
            } catch (err) {
                console.error("Error loading RFQ items:", err);
                toast.error("Không thể tải sản phẩm từ RFQ");
            }
        } else {
            handleInputChange("rfqId", null);
            setFormData((prev) => ({ ...prev, items: [] }));
        }
    };

    const handleItemChange = (index, field, value) => {
        setFormData((prev) => {
            const next = [...prev.items];
            const item = { ...next[index] };
            item[field] = value;
            
            // Auto calculate tax and line total
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.unitPrice || 0);
            const taxRate = Number(item.taxRate || 0);
            
            const subtotal = quantity * unitPrice;
            item.taxAmount = subtotal * (taxRate / 100);
            item.lineTotal = subtotal + item.taxAmount;
            
            next[index] = item;
            return { ...prev, items: next };
        });
    };

    const handleProductSelect = (index, selectedOption) => {
        if (selectedOption) {
            const product = selectedOption.product;
            handleItemChange(index, "productId", product.id || product.product_id);
            // Tự động set đơn giá từ purchase price nếu có
            if (product.purchasePrice || product.purchase_price) {
                handleItemChange(index, "unitPrice", product.purchasePrice || product.purchase_price);
            }
        } else {
            handleItemChange(index, "productId", null);
            handleItemChange(index, "unitPrice", 0);
        }
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    rfqItemId: null,
                    productId: null,
                    quantity: 1,
                    unitPrice: 0,
                    taxRate: 0,
                    taxAmount: 0,
                    lineTotal: 0,
                    remark: ""
                }
            ]
        }));
    };

    const removeItem = (index) => {
        setFormData((prev) => {
            const next = [...prev.items];
            next.splice(index, 1);
            return { ...prev, items: next };
        });
    };

    const validateAll = () => {
        const errors = {};
        if (!formData.pqNo || !formData.pqNo.trim()) {
            errors.pqNo = "Số báo giá là bắt buộc";
        }
        if (!formData.rfqId) {
            errors.rfqId = "Chọn RFQ là bắt buộc";
        }
        if (!formData.vendorId) {
            errors.vendorId = "Chọn nhà cung cấp là bắt buộc";
        }
        if (!formData.pqDate) {
            errors.pqDate = "Ngày báo giá là bắt buộc";
        }
        if (!formData.items || formData.items.length === 0) {
            errors.items = "Cần ít nhất 1 dòng hàng";
        } else {
            const itemErrs = formData.items.map((it) => {
                const e = {};
                if (!it.quantity || Number(it.quantity) <= 0) {
                    e.quantity = "Số lượng phải > 0";
                }
                if (!it.unitPrice || Number(it.unitPrice) <= 0) {
                    e.unitPrice = "Đơn giá phải > 0";
                }
                return e;
            });
            if (itemErrs.some((x) => Object.keys(x).length > 0)) {
                errors.itemDetails = itemErrs;
            }
        }
        return errors;
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
                pqNo: formData.pqNo,
                rfqId: formData.rfqId,
                vendorId: formData.vendorId,
                pqDate: formData.pqDate ? new Date(formData.pqDate).toISOString() : new Date().toISOString(),
                validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString().split('T')[0] : null,
                isTaxIncluded: formData.isTaxIncluded,
                deliveryTerms: formData.deliveryTerms,
                paymentTerms: formData.paymentTerms,
                leadTimeDays: formData.leadTimeDays ? Number(formData.leadTimeDays) : null,
                warrantyMonths: formData.warrantyMonths ? Number(formData.warrantyMonths) : null,
                headerDiscount: Number(formData.headerDiscount || 0),
                shippingCost: Number(formData.shippingCost || 0),
                totalAmount: totalAmount,
                status: formData.status,
                notes: formData.notes,
                items: formData.items.map((it) => ({
                    rfqItemId: it.rfqItemId,
                    productId: it.productId,
                    quantity: Number(it.quantity),
                    unitPrice: Number(it.unitPrice || 0),
                    taxRate: Number(it.taxRate || 0),
                    taxAmount: Number(it.taxAmount || 0),
                    lineTotal: Number(it.lineTotal || 0),
                    remark: it.remark
                }))
            };

            if (isEdit) {
                await apiClient.put(`/purchase-quotations/${id}`, payload);
                toast.success("Cập nhật báo giá thành công!");
            } else {
                await apiClient.post("/purchase-quotations", payload);
                toast.success("Tạo báo giá thành công!");
            }
            navigate("/purchase/quotations");
        } catch (err) {
            console.error("Error saving quotation:", err);
            const msg = err?.response?.data?.message || (isEdit ? "Không thể cập nhật báo giá" : "Không thể tạo báo giá");
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/purchase/quotations");
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
                            {isEdit ? "Cập nhật Báo giá" : "Báo giá từ nhà cung cấp"}
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
                            <h2 className="text-lg font-semibold text-gray-900">Thông tin Báo giá</h2>
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
                                            Số báo giá <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.pqNo}
                                            readOnly
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 ${validationErrors.pqNo ? "border-red-500" : "border-gray-300"}`}
                                            placeholder="Số sẽ được tự động tạo"
                                        />
                                        {validationErrors.pqNo && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.pqNo}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            RFQ <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            value={rfqs.find((r) => r.value === formData.rfqId) || null}
                                            onChange={handleRFQSelect}
                                            options={rfqs}
                                            isClearable
                                            placeholder="Chọn RFQ"
                                            classNamePrefix="react-select"
                                        />
                                        {validationErrors.rfqId && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.rfqId}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nhà cung cấp <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            value={vendors.find((v) => v.value === formData.vendorId) || null}
                                            onChange={(opt) => handleInputChange("vendorId", opt?.value || null)}
                                            options={vendors}
                                            isClearable
                                            placeholder="Chọn nhà cung cấp"
                                            classNamePrefix="react-select"
                                        />
                                        {validationErrors.vendorId && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.vendorId}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trạng thái
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.status || "Pending"}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày báo giá <span className="text-red-500">*</span>
                                        </label>
                                        <DatePicker
                                            selected={formData.pqDate}
                                            onChange={(date) => handleInputChange("pqDate", date)}
                                            dateFormat="dd/MM/yyyy"
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.pqDate ? "border-red-500" : "border-gray-300"}`}
                                        />
                                        {validationErrors.pqDate && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.pqDate}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Có hiệu lực đến
                                        </label>
                                        <DatePicker
                                            selected={formData.validUntil}
                                            onChange={(date) => handleInputChange("validUntil", date)}
                                            dateFormat="dd/MM/yyyy"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                                            isClearable
                                            placeholderText="Chọn ngày"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Điều khoản giao hàng
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.deliveryTerms}
                                            onChange={(e) => handleInputChange("deliveryTerms", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Nhập điều khoản giao hàng"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Điều khoản thanh toán
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.paymentTerms}
                                            onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Nhập điều khoản thanh toán"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Thời gian giao hàng (ngày)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.leadTimeDays || ""}
                                            onChange={(e) => handleInputChange("leadTimeDays", e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            min="0"
                                            placeholder="Số ngày"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bảo hành (tháng)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.warrantyMonths || ""}
                                            onChange={(e) => handleInputChange("warrantyMonths", e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            min="0"
                                            placeholder="Số tháng"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isTaxIncluded}
                                                onChange={(e) => handleInputChange("isTaxIncluded", e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Đã bao gồm thuế</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                    >
                                        Thêm sản phẩm
                                    </button>
                                </div>

                                {validationErrors.items && (
                                    <p className="text-red-500 text-sm mb-4">{validationErrors.items}</p>
                                )}

                                {formData.items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Chưa có sản phẩm nào. Chọn RFQ để tự động tải sản phẩm hoặc nhấn "Thêm sản phẩm".</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">#</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Sản phẩm</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Đơn giá</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thuế (%)</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Tiền thuế</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Thành tiền</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Ghi chú</th>
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
                                                                    value={products.find((option) => {
                                                                        const optionValue = Number(option.value);
                                                                        const itemValue = Number(item.productId);
                                                                        return optionValue === itemValue && !isNaN(optionValue) && !isNaN(itemValue);
                                                                    }) || null}
                                                                    onChange={(opt) => handleProductSelect(index, opt)}
                                                                    options={products}
                                                                    placeholder="Chọn sản phẩm"
                                                                    menuPortalTarget={document.body}
                                                                    menuPosition="fixed"
                                                                    menuShouldScrollIntoView={false}
                                                                    styles={{
                                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
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
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                                {itemErr.unitPrice && (
                                                                    <p className="text-red-500 text-xs mt-1">{itemErr.unitPrice}</p>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    value={item.taxRate}
                                                                    onChange={(e) => handleItemChange(index, "taxRate", parseFloat(e.target.value) || 0)}
                                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2 text-sm">
                                                                {formatCurrency(item.taxAmount || 0)}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2 text-sm font-medium">
                                                                {formatCurrency(item.lineTotal || 0)}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <input
                                                                    type="text"
                                                                    value={item.remark}
                                                                    onChange={(e) => handleItemChange(index, "remark", e.target.value)}
                                                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    placeholder="Ghi chú"
                                                                />
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
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phí vận chuyển
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.shippingCost}
                                        onChange={(e) => handleInputChange("shippingCost", parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Tổng giá trị</div>
                                    <div className="text-lg font-semibold">{formatCurrency(totalAmount)}</div>
                                </div>
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
        </div>
    );
}

