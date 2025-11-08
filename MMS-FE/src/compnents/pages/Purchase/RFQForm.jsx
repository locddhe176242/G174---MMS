import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { rfqService } from "../../../api/rfqService";
import apiClient from "../../../api/apiClient";
import { getCurrentUser } from "../../../api/authService";

export default function RFQForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        rfqNo: "",
        issueDate: "",
        dueDate: "",
        status: "Draft",
        selectedVendorIds: [],
        notes: "",
        items: [
            {
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
            if (typeof rfqService.generateRFQNo === "function") {
                const res = await rfqService.generateRFQNo();
                const rfqNo = res?.rfqNo || res?.number || res?.code || "";
                if (rfqNo) {
                    setFormData((prev) => ({ ...prev, rfqNo }));
                    return;
                }
            }
            // Fallback
            const ts = Date.now().toString().slice(-6);
            setFormData((prev) => ({ ...prev, rfqNo: `RFQ-${ts}` }));
        } catch (err) {
            console.error("Error generating RFQ number:", err);
            const ts = Date.now().toString().slice(-6);
            setFormData((prev) => ({ ...prev, rfqNo: `RFQ-${ts}` }));
        }
    };

    const loadProducts = async () => {
        try {
            const res = await apiClient.get("/product", {
                params: { page: 0, size: 100, sortBy: "createdAt", sortOrder: "desc" },
            });
            const list = Array.isArray(res.data) ? res.data : (res.data.content || []);
            console.log("Products loaded:", list.length); // expect 10
            setProducts(
                list.map((p) => ({
                    value: p.id ?? p.product_id,
                    label: `${p.sku || p.productCode} - ${p.name}`,
                    product: p,
                }))
            );
        } catch (err) {
            console.error("Error loading products:", err);
            toast.error("Không thể tải danh sách sản phẩm");
        }
    };

    const loadRFQ = async () => {
        try {
            setLoading(true);
            const rfq = await rfqService.getRFQById(id);
            setFormData({
                rfqNo: rfq.rfqNo || "",
                issueDate: rfq.issueDate ? rfq.issueDate.slice(0, 10) : "",
                dueDate: rfq.dueDate ? rfq.dueDate.slice(0, 10) : "",
                status: rfq.status || "Draft",
                selectedVendorIds: rfq.selectedVendorIds || (Array.isArray(rfq.selectedVendors) ? rfq.selectedVendors.map((v) => v.vendorId || v.id) : (rfq.selectedVendorId ? [rfq.selectedVendorId] : [])),
                notes: rfq.notes || rfq.note || "",
                items: (rfq.items || []).map((it) => ({
                    productId: it.productId || null,
                    productCode: it.productCode || "",
                    productName: it.productName || "",
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
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                { productId: null, productCode: "", productName: "", uom: "", quantity: 1, deliveryDate: null, targetPrice: 0, priceUnit: 1, note: "" },
            ],
        }));
    };

    const removeItem = (index) => {
        setFormData((prev) => {
            const next = [...prev.items];
            next.splice(index, 1);
            return { ...prev, items: next.length ? next : [{ productId: null, productCode: "", productName: "", uom: "", quantity: 1, deliveryDate: null, targetPrice: 0, priceUnit: 1, note: "" }] };
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
        setShowImportModal(true);
        try {
            // Sử dụng apiClient để đảm bảo có interceptors và error handling
            const url = `/api/purchase-requisitions?page=0&size=50&sort=createdAt,desc`;
            const response = await apiClient.get(url);
            
            const data = response.data || {};
            const list = Array.isArray(data) ? data : (data?.content || []);
            
            if (list.length === 0) {
                toast.info("Không có phiếu yêu cầu nào");
                setPrList([]);
                return;
            }
            
            setPrList(
                list.map((pr) => ({
                    value: pr.id ?? pr.requisition_id ?? pr.requisitionId,
                    label: `${pr.requisition_no || pr.requisitionNo || pr.prNo || "PR"}${pr.purpose ? ` - ${pr.purpose}` : ""}`,
                    pr,
                }))
            );
        } catch (err) {
            console.error("Load PR list error:", err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
            
            // Kiểm tra nếu là lỗi 404 hoặc 500 do endpoint không tồn tại
            if (err?.response?.status === 404 || err?.response?.status === 500) {
                toast.error("Backend chưa có endpoint cho danh sách phiếu yêu cầu. Vui lòng liên hệ admin.");
            } else {
                toast.error(`Không thể tải danh sách phiếu yêu cầu: ${errorMessage}`);
            }
            setPrList([]);
        }
    };

    // Import dòng sản phẩm từ PR đã chọn
    const importFromSelectedPr = async () => {
        if (!selectedPr?.value) {
            toast.warn("Chọn một phiếu yêu cầu để nhập");
            return;
        }
        try {
            const res = await apiClient.get(`/purchase-requisitions/${selectedPr.value}`);
            const data = res.data || {};
            const prItems = data.items || data.prItems || [];

            if (!Array.isArray(prItems) || prItems.length === 0) {
                toast.info("Phiếu yêu cầu không có dòng sản phẩm");
                return;
            }

            // Map về đúng shape item của form hiện tại
            const mapped = prItems.map((it) => {
                const productId = it.productId || it.product_id || it.product?.id || it.product?.product_id || null;
                return {
                    productId,
                    productCode: it.productCode || it.product?.sku || "",
                    productName: it.productName || it.product?.name || "",
                    uom: it.uom || it.product?.uom || "",
                    quantity: it.quantity ?? it.requestedQty ?? 1,
                    deliveryDate: it.deliveryDate ? new Date(it.deliveryDate) : null,
                    targetPrice: it.targetPrice ?? it.valuation_price ?? 0,
                    priceUnit: it.priceUnit ?? 1,
                    note: it.note || it.remark || "",
                };
            }).filter(m => m.productId);

            if (mapped.length === 0) {
                toast.info("Không có sản phẩm hợp lệ để nhập");
                return;
            }

            setFormData((prev) => ({ ...prev, items: [...prev.items, ...mapped] }));
            setShowImportModal(false);
            setSelectedPr(null);
            toast.success("Đã nhập sản phẩm từ phiếu yêu cầu");
        } catch (err) {
            console.error("Import PR items error:", err);
            toast.error("Không thể nhập từ phiếu yêu cầu");
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
                rfqNo: formData.rfqNo,
                issueDate: formData.issueDate,
                dueDate: formData.dueDate,
                status: formData.status,
                selectedVendorIds: formData.selectedVendorIds,
                notes: formData.notes,
                items: formData.items.map((it) => ({
                    productId: it.productId,
                    productCode: it.productCode,
                    productName: it.productName,
                    uom: it.uom,
                    quantity: Number(it.quantity),
                    deliveryDate: it.deliveryDate ? new Date(it.deliveryDate).toISOString() : null,
                    targetPrice: Number(it.targetPrice || 0),
                    priceUnit: Number(it.priceUnit || 1),
                    note: it.note,
                })),
            };

            if (isEdit) {
                await rfqService.updateRFQ(id, payload);
                toast.success("Cập nhật Yêu cầu báo giá thành công!");
            } else {
                await rfqService.createRFQ(payload);
                toast.success("Tạo Yêu cầu báo giá thành công!");
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
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEdit ? "Cập nhật Yêu cầu báo giá" : "Thêm Yêu cầu báo giá"}
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
                                        <p className="text-xs text-gray-500 mt-1">Tự động lấy từ tài khoản đang đăng nhập</p>
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
                                            value={formData.status || "Draft"}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày phát hành <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.issueDate}
                                            onChange={(e) => handleInputChange("issueDate", e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.issueDate ? "border-red-500" : "border-gray-300"}`}
                                        />
                                        {validationErrors.issueDate && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.issueDate}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Hạn phản hồi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => handleInputChange("dueDate", e.target.value)}
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
                                            Nhập từ PR
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
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Ngày cần</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Giá mục tiêu</th>
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
                                                                    value={products.find((o) => o.value === item.productId) || null}
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
                                                                {itemErr.productName && (
                                                                    <p className="text-red-500 text-xs mt-1">{itemErr.productName}</p>
                                                                )}
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
                                                                <DatePicker
                                                                    selected={item.deliveryDate}
                                                                    onChange={(date) => handleItemChange(index, "deliveryDate", date)}
                                                                    dateFormat="dd/MM/yyyy"
                                                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    placeholderText="Chọn ngày"
                                                                />
                                                                {itemErr.deliveryDate && (
                                                                    <p className="text-red-500 text-xs mt-1">{itemErr.deliveryDate}</p>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    value={item.targetPrice}
                                                                    onChange={(e) => handleItemChange(index, "targetPrice", parseFloat(e.target.value) || 0)}
                                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2 text-sm">
                                                                {formatCurrency((Number(item.quantity || 0) * Number(item.targetPrice || 0)))}
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
                                        <div className="flex justify-end mt-3">
                                            <div className="text-right">
                                                <div className="text-sm text-gray-600">Tổng giá trị</div>
                                                <div className="text-lg font-semibold">{formatCurrency(totalValue)}</div>
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
                                placeholder="Chọn PR..."
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                menuShouldScrollIntoView={false}
                                styles={{
                                    menuPortal: (b) => ({ ...b, zIndex: 10001 }),
                                    menu: (b) => ({ ...b, zIndex: 10001 }),
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