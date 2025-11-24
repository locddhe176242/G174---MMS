import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { rfqService } from '../../../api/rfqService';
import { purchaseQuotationService } from '../../../api/purchaseQuotationService';
import apiClient from '../../../api/apiClient';
import { getCurrentUser } from '../../../api/authService';

const VendorQuotationForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const rfqId = searchParams.get('rfq_id');
    const vendorId = searchParams.get('vendor_id');

    // Form data state - using camelCase to match backend DTO
    const [formData, setFormData] = useState({
        pqNo: '',
        rfqId: rfqId ? parseInt(rfqId) : null,
        vendorId: vendorId ? parseInt(vendorId) : null,
        pqDate: new Date(),
        validUntil: null,
        isTaxIncluded: false,
        deliveryTerms: '',
        paymentTerms: '',
        leadTimeDays: null,
        warrantyMonths: null,
        headerDiscount: 0,
        shippingCost: 0,
        totalAmount: 0,
        status: 'Pending',
        notes: '',
        items: []
    });

    // Additional states
    const [loading, setLoading] = useState(false);
    const [rfqData, setRfqData] = useState(null);
    const [vendorData, setVendorData] = useState(null);
    const [products, setProducts] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    // Common options for delivery and payment terms
    const deliveryTermsOptions = [
        { value: 'FOB - Giao tại kho người bán', label: 'FOB - Giao tại kho người bán' },
        { value: 'CIF - Bao gồm phí vận chuyển và bảo hiểm', label: 'CIF - Bao gồm phí vận chuyển và bảo hiểm' },
        { value: 'EXW - Lấy tại kho nhà máy', label: 'EXW - Lấy tại kho nhà máy' },
        { value: 'DDP - Giao tận nơi, đã bao gồm thuế', label: 'DDP - Giao tận nơi, đã bao gồm thuế' },
        { value: 'Giao hàng miễn phí trong nội thành', label: 'Giao hàng miễn phí trong nội thành' },
        { value: 'Giao hàng trong 7-10 ngày làm việc', label: 'Giao hàng trong 7-10 ngày làm việc' },
    ];

    const paymentTermsOptions = [
        { value: 'COD - Thanh toán khi nhận hàng', label: 'COD - Thanh toán khi nhận hàng' },
        { value: 'Net 30 - Thanh toán trong 30 ngày', label: 'Net 30 - Thanh toán trong 30 ngày' },
        { value: 'Net 60 - Thanh toán trong 60 ngày', label: 'Net 60 - Thanh toán trong 60 ngày' },
        { value: '50% trả trước, 50% trước khi giao', label: '50% trả trước, 50% trước khi giao' },
        { value: '100% trả trước', label: '100% trả trước' },
        { value: 'Chuyển khoản trong 7 ngày', label: 'Chuyển khoản trong 7 ngày' },
        { value: 'LC 90 ngày', label: 'LC 90 ngày (Letter of Credit)' },
    ];

    // Format currency
    const formatCurrency = (n) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));

    // Format number with thousand separator (for input display)
    const formatNumber = (value) => {
        if (!value && value !== 0) return '';
        const num = value.toString().replace(/\./g, ''); // Remove existing dots
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Add dots every 3 digits
    };

    // Parse formatted number back to number
    const parseFormattedNumber = (value) => {
        if (!value) return 0;
        const cleaned = value.toString().replace(/\./g, ''); // Remove dots
        return parseFloat(cleaned) || 0;
    };

    // Calculate totals
    const calculateTotals = useMemo(() => {
        if (!Array.isArray(formData.items)) return { subtotal: 0, tax: 0, total: 0 };

        const subtotal = formData.items.reduce((sum, item) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.unitPrice || 0);
            return sum + qty * price;
        }, 0);

        const tax = formData.items.reduce((sum, item) => {
            return sum + Number(item.taxAmount || 0);
        }, 0);

        const discountPercent = Number(formData.headerDiscount || 0);
        const discountAmount = (subtotal + tax) * (discountPercent / 100);
        const shipping = Number(formData.shippingCost || 0);
        const total = subtotal + tax - discountAmount + shipping;

        return { subtotal, tax, discountAmount, total };
    }, [formData.items, formData.headerDiscount, formData.shippingCost]);

    // Auto-generate quotation number
    const generateQuotationNumber = async () => {
        try {
            const pqNo = await purchaseQuotationService.generateQuotationNo();
            return pqNo || `PQ-${new Date().getFullYear()}-999`;
        } catch (error) {
            console.error('Error generating quotation number:', error);
            const currentYear = new Date().getFullYear();
            return `PQ-${currentYear}-999`;
        }
    };

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);

                // Load RFQ data
                if (rfqId) {
                    const rfq = await rfqService.getRFQById(rfqId);
                    setRfqData(rfq);

                    // Check if this vendor already has a PQ for this RFQ
                    try {
                        const existingPqResponse = await apiClient.get('/purchase-quotations/page', {
                            params: { page: 0, size: 100, sort: 'createdAt,desc' }
                        });
                        const allPqs = existingPqResponse.data?.content || existingPqResponse.data || [];
                        
                        const existingPq = allPqs.find(pq => {
                            const pqRfqId = pq.rfqId || pq.rfq_id || pq.rfq?.id;
                            const pqVendorId = pq.vendorId || pq.vendor_id || pq.vendor?.id;
                            return Number(pqRfqId) === Number(rfqId) && Number(pqVendorId) === Number(vendorId);
                        });

                        if (existingPq) {
                            const pqId = existingPq.id || existingPq.pq_id || existingPq.pqId;
                            const pqNo = existingPq.pqNo || existingPq.pq_no;
                            toast.warning(`Nhà cung cấp này đã có báo giá ${pqNo} cho RFQ này. Chuyển sang chế độ chỉnh sửa...`);
                            
                            // Redirect to edit mode
                            setTimeout(() => {
                                navigate(`/purchase/vendor-quotations/${pqId}`);
                            }, 2000);
                            return;
                        }
                    } catch (error) {
                        console.error('Error checking existing PQ:', error);
                        // Continue if check fails
                    }

                    // Map RFQ items to quotation items - using camelCase to match backend DTO
                    if (rfq.items && Array.isArray(rfq.items)) {
                        const mappedItems = rfq.items.map(item => ({
                            rfqItemId: item.rfqItemId || item.rfq_item_id || item.id,
                            productId: item.productId || item.product_id || null,
                            productCode: item.productCode || item.product_code || '',
                            productName: item.productName || item.product_name || '',
                            quantity: Number(item.quantity || 0),
                            unitPrice: Number(item.targetPrice || item.target_price || 0),
                            taxRate: 0,
                            taxAmount: 0,
                            lineTotal: 0,
                            remark: item.note || item.remark || ''
                        }));

                        setFormData(prev => ({
                            ...prev,
                            items: mappedItems
                        }));
                    }
                }

                // Load vendor data
                if (vendorId) {
                    try {
                        const vendorResponse = await apiClient.get(`/vendors/${vendorId}`);
                        setVendorData(vendorResponse.data);
                    } catch (error) {
                        console.error('Error loading vendor:', error);
                    }
                }

                // Load products
                const productsResponse = await apiClient.get('/product', {
                    params: { page: 0, size: 100 }
                });
                const productsData = productsResponse.data?.content || productsResponse.data || [];
                setProducts(productsData);

                // Get current user
                const user = getCurrentUser();
                if (user) {
                    setCurrentUser(user);
                    setFormData(prev => ({
                        ...prev,
                        createdById: user.userId || user.user_id
                    }));
                }

                // Generate quotation number
                const pqNo = await generateQuotationNumber();
                setFormData(prev => ({
                    ...prev,
                    pqNo: pqNo
                }));
            } catch (error) {
                console.error('Error loading initial data:', error);
                toast.error('Lỗi khi tải dữ liệu ban đầu');
            } finally {
                setLoading(false);
            }
        };

        if (rfqId && vendorId) {
            loadInitialData();
        } else {
            toast.error('Thiếu thông tin RFQ hoặc Vendor');
            navigate('/purchase/rfqs');
        }
    }, [rfqId, vendorId, navigate]);

    // Update line totals when items change
    useEffect(() => {
        const updatedItems = formData.items.map(item => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.unitPrice || 0);
            const taxRate = Number(item.taxRate || 0);
            const subtotal = qty * price;
            const taxAmount = formData.isTaxIncluded ? 0 : (subtotal * taxRate / 100);
            const lineTotal = subtotal + taxAmount;

            return {
                ...item,
                taxAmount: taxAmount,
                lineTotal: lineTotal
            };
        });

        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            totalAmount: calculateTotals.total
        }));
    }, [formData.items.map(i => `${i.quantity}-${i.unitPrice}-${i.taxRate}`).join(','), formData.isTaxIncluded, calculateTotals.total]);

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // Handle item changes
    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            [field]: value
        };

        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    // Validation
    const validateAllFields = () => {
        const errors = {};

        if (!formData.pqNo) {
            errors.pqNo = 'Mã báo giá là bắt buộc';
        }

        if (!formData.rfqId) {
            errors.rfqId = 'RFQ là bắt buộc';
        }

        if (!formData.vendorId) {
            errors.vendorId = 'Nhà cung cấp là bắt buộc';
        }

        if (!formData.validUntil) {
            errors.validUntil = 'Ngày hết hạn là bắt buộc';
        }

        if (formData.items.length === 0) {
            errors.items = 'Phải có ít nhất một sản phẩm';
        }

        // Validate items
        formData.items.forEach((item, index) => {
            if (!item.quantity || item.quantity <= 0) {
                errors[`item_${index}_quantity`] = 'Số lượng phải lớn hơn 0';
            }
            if (!item.unitPrice || item.unitPrice <= 0) {
                errors[`item_${index}_unitPrice`] = 'Đơn giá phải lớn hơn 0';
            }
        });

        return errors;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateAllFields();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            toast.error('Vui lòng kiểm tra lại thông tin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            setLoading(true);

            // Format dates to YYYY-MM-DD or ISO string for backend
            const formatDateForBackend = (date) => {
                if (!date) return null;
                if (typeof date === 'string') {
                    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
                    const d = new Date(date);
                    return d.toISOString().split('T')[0];
                }
                if (date instanceof Date) {
                    return date.toISOString().split('T')[0];
                }
                return null;
            };

            const formatDateTimeForBackend = (date) => {
                if (!date) return null;
                if (date instanceof Date) {
                    return date.toISOString();
                }
                if (typeof date === 'string') {
                    return new Date(date).toISOString();
                }
                return null;
            };

            // Get current user ID
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const createdById = currentUser?.userId || currentUser?.user_id || currentUser?.id || null;

            // Prepare payload matching PurchaseQuotationRequestDTO
            const payload = {
                pqNo: formData.pqNo,
                rfqId: formData.rfqId,
                vendorId: formData.vendorId,
                pqDate: formatDateTimeForBackend(formData.pqDate),
                validUntil: formatDateForBackend(formData.validUntil),
                isTaxIncluded: formData.isTaxIncluded || false,
                deliveryTerms: formData.deliveryTerms || '',
                paymentTerms: formData.paymentTerms || '',
                leadTimeDays: formData.leadTimeDays || null,
                warrantyMonths: formData.warrantyMonths || null,
                headerDiscount: Number(formData.headerDiscount || 0),
                shippingCost: Number(formData.shippingCost || 0),
                totalAmount: Number(calculateTotals.total || 0),
                // status: formData.status || 'Pending', // Temporarily comment out to avoid NoClassDefFoundError
                notes: formData.notes || '',
                items: formData.items.map(item => ({
                    rfqItemId: item.rfqItemId,
                    productId: item.productId || null,
                    quantity: Number(item.quantity || 0),
                    unitPrice: Number(item.unitPrice || 0),
                    taxRate: Number(item.taxRate || 0),
                    taxAmount: Number(item.taxAmount || 0),
                    lineTotal: Number(item.lineTotal || 0),
                    remark: item.remark || ''
                }))
            };

            console.log('Payload being sent:', payload); // Debug log

            await purchaseQuotationService.createQuotation(payload, createdById);
            toast.success('Tạo báo giá thành công!');
            navigate(`/purchase/rfqs/${rfqId}`);
        } catch (error) {
            console.error('Error submitting form:', error);
            console.error('Error response:', error?.response?.data); // Debug log
            const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi gửi dữ liệu';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !rfqData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!rfqData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Không tìm thấy dữ liệu RFQ</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => navigate(`/purchase/rfqs/${rfqId}`)}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Tạo báo giá từ nhà cung cấp
                    </h1>
                </div>
                <p className="text-gray-600">
                    RFQ: {rfqData.rfqNo || rfqData.rfq_no} | Nhà cung cấp: {vendorData?.name || 'Đang tải...'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quotation Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin báo giá</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Quotation Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã báo giá <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.pqNo}
                                onChange={(e) => handleInputChange('pqNo', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    validationErrors.pqNo ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Mã báo giá"
                            />
                            {validationErrors.pqNo && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.pqNo}</p>
                            )}
                        </div>

                        {/* Quotation Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày báo giá
                            </label>
                            <DatePicker
                                selected={formData.pqDate}
                                onChange={(date) => handleInputChange('pqDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        {/* Valid Until */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Có hiệu lực đến <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.validUntil}
                                onChange={(date) => handleInputChange('validUntil', date)}
                                dateFormat="dd/MM/yyyy"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    validationErrors.validUntil ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholderText="Chọn ngày"
                            />
                            {validationErrors.validUntil && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.validUntil}</p>
                            )}
                        </div>

                        {/* Tax Included */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Đã bao gồm thuế
                            </label>
                            <div className="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isTaxIncluded}
                                    onChange={(e) => handleInputChange('isTaxIncluded', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Đã bao gồm thuế VAT</span>
                            </div>
                        </div>

                        {/* Lead Time Days */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thời gian giao hàng (ngày)
                            </label>
                            <input
                                type="number"
                                value={formData.leadTimeDays || ''}
                                onChange={(e) => handleInputChange('leadTimeDays', e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0"
                                placeholder="Số ngày"
                            />
                        </div>

                        {/* Warranty Months */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bảo hành (tháng)
                            </label>
                            <input
                                type="number"
                                value={formData.warrantyMonths || ''}
                                onChange={(e) => handleInputChange('warrantyMonths', e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0"
                                placeholder="Số tháng"
                            />
                        </div>

                        {/* Delivery Terms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Điều khoản giao hàng
                            </label>
                            <CreatableSelect
                                isClearable
                                options={deliveryTermsOptions}
                                value={formData.deliveryTerms ? { value: formData.deliveryTerms, label: formData.deliveryTerms } : null}
                                onChange={(option) => handleInputChange('deliveryTerms', option ? option.value : '')}
                                placeholder="Chọn hoặc nhập điều khoản giao hàng..."
                                formatCreateLabel={(inputValue) => `Nhập: "${inputValue}"`}
                                noOptionsMessage={() => "Không có lựa chọn"}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                            <p className="text-xs text-gray-500 mt-1">VD: FOB, CIF, EXW, DDP, giao trong X ngày</p>
                        </div>

                        {/* Payment Terms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Điều khoản thanh toán
                            </label>
                            <CreatableSelect
                                isClearable
                                options={paymentTermsOptions}
                                value={formData.paymentTerms ? { value: formData.paymentTerms, label: formData.paymentTerms } : null}
                                onChange={(option) => handleInputChange('paymentTerms', option ? option.value : '')}
                                placeholder="Chọn hoặc nhập điều khoản thanh toán..."
                                formatCreateLabel={(inputValue) => `Nhập: "${inputValue}"`}
                                noOptionsMessage={() => "Không có lựa chọn"}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                            <p className="text-xs text-gray-500 mt-1">VD: COD, Net 30, 50% trả trước, LC 90 ngày</p>
                        </div>

                        {/* Header Discount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chiết khấu (%)
                            </label>
                            <input
                                type="number"
                                value={formData.headerDiscount}
                                onChange={(e) => handleInputChange('headerDiscount', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* Shipping Cost */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phí vận chuyển
                            </label>
                            <input
                                type="number"
                                value={formData.shippingCost}
                                onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Ghi chú"
                        />
                    </div>
                </div>

                {/* Quotation Items */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Danh sách sản phẩm</h2>

                    {validationErrors.items && (
                        <p className="text-red-500 text-sm mb-4">{validationErrors.items}</p>
                    )}

                    {formData.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Không có sản phẩm nào.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">#</th>
                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">Sản phẩm</th>
                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">Số lượng</th>
                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">Đơn giá</th>
                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">Thuế (%)</th>
                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">Thành tiền</th>
                                    <th className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700">Ghi chú</th>
                                </tr>
                                </thead>
                                <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-200 px-2 py-1 text-xs text-gray-700 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1 text-xs">
                                            {item.productName || `${item.productCode || ''} - Sản phẩm`}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                                                min="0"
                                                step="0.01"
                                            />
                                            {validationErrors[`item_${index}_quantity`] && (
                                                <p className="text-red-500 text-xs mt-0.5">{validationErrors[`item_${index}_quantity`]}</p>
                                            )}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="text"
                                                value={formatNumber(item.unitPrice)}
                                                onChange={(e) => {
                                                    const rawValue = parseFormattedNumber(e.target.value);
                                                    handleItemChange(index, 'unitPrice', rawValue);
                                                }}
                                                onBlur={(e) => {
                                                    // Re-format on blur to ensure proper display
                                                    const rawValue = parseFormattedNumber(e.target.value);
                                                    handleItemChange(index, 'unitPrice', rawValue);
                                                }}
                                                className="w-32 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-right"
                                                placeholder="0"
                                            />
                                            {validationErrors[`item_${index}_unitPrice`] && (
                                                <p className="text-red-500 text-xs mt-0.5">{validationErrors[`item_${index}_unitPrice`]}</p>
                                            )}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="number"
                                                value={item.taxRate || 0}
                                                onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                                                className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                disabled={formData.isTaxIncluded}
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1 text-xs">
                                            {formatCurrency(item.lineTotal || 0)}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="text"
                                                value={item.remark || ''}
                                                onChange={(e) => handleItemChange(index, 'remark', e.target.value)}
                                                className="w-32 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                                                placeholder="Ghi chú"
                                            />
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot>
                                <tr className="bg-gray-50 font-semibold">
                                    <td colSpan="5" className="border border-gray-200 px-2 py-1 text-xs text-right">
                                        Tổng phụ:
                                    </td>
                                    <td className="border border-gray-200 px-2 py-1 text-xs">
                                        {formatCurrency(calculateTotals.subtotal)}
                                    </td>
                                    <td className="border border-gray-200 px-2 py-1"></td>
                                </tr>
                                {!formData.isTaxIncluded && (
                                    <tr className="bg-gray-50">
                                        <td colSpan="5" className="border border-gray-200 px-2 py-1 text-xs text-right">
                                            Thuế:
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1 text-xs">
                                            {formatCurrency(calculateTotals.tax)}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1"></td>
                                    </tr>
                                )}
                                {formData.headerDiscount > 0 && (
                                    <tr className="bg-gray-50">
                                        <td colSpan="5" className="border border-gray-200 px-2 py-1 text-xs text-right">
                                            Chiết khấu ({formData.headerDiscount}%):
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1 text-xs text-red-600">
                                            -{formatCurrency(calculateTotals.discountAmount || 0)}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1"></td>
                                    </tr>
                                )}
                                {formData.shippingCost > 0 && (
                                    <tr className="bg-gray-50">
                                        <td colSpan="5" className="border border-gray-200 px-2 py-1 text-xs text-right">
                                            Phí vận chuyển:
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1 text-xs">
                                            {formatCurrency(formData.shippingCost)}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1"></td>
                                    </tr>
                                )}
                                <tr className="bg-blue-50 font-bold">
                                    <td colSpan="5" className="border border-gray-200 px-2 py-1 text-xs text-right">
                                        Tổng cộng:
                                    </td>
                                    <td className="border border-gray-200 px-2 py-1 text-xs">
                                        {formatCurrency(calculateTotals.total)}
                                    </td>
                                    <td className="border border-gray-200 px-2 py-1"></td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/purchase/rfqs/${rfqId}`)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Đang xử lý...' : 'Tạo báo giá'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VendorQuotationForm;