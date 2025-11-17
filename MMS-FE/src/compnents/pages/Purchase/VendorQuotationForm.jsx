import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { rfqService } from '../../../api/rfqService';
import apiClient from '../../../api/apiClient';
import { getCurrentUser } from '../../../api/authService';

const VendorQuotationForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const rfqId = searchParams.get('rfq_id');
    const vendorId = searchParams.get('vendor_id');

    // Form data state
    const [formData, setFormData] = useState({
        pq_no: '',
        rfq_id: rfqId ? parseInt(rfqId) : null,
        vendor_id: vendorId ? parseInt(vendorId) : null,
        pq_date: new Date(),
        valid_until: null,
        is_tax_included: false,
        delivery_terms: '',
        payment_terms: '',
        lead_time_days: null,
        warranty_months: null,
        header_discount: 0,
        shipping_cost: 0,
        total_amount: 0,
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

    // Format currency
    const formatCurrency = (n) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));

    // Calculate totals
    const calculateTotals = useMemo(() => {
        if (!Array.isArray(formData.items)) return { subtotal: 0, tax: 0, total: 0 };

        const subtotal = formData.items.reduce((sum, item) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.unit_price || 0);
            return sum + qty * price;
        }, 0);

        const tax = formData.items.reduce((sum, item) => {
            return sum + Number(item.tax_amount || 0);
        }, 0);

        const discount = Number(formData.header_discount || 0);
        const shipping = Number(formData.shipping_cost || 0);
        const total = subtotal + tax - discount + shipping;

        return { subtotal, tax, total };
    }, [formData.items, formData.header_discount, formData.shipping_cost]);

    // Auto-generate quotation number
    const generateQuotationNumber = async () => {
        try {
            const response = await fetch('/api/purchase-quotations/generate-number');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                return data.pq_no;
            } else {
                throw new Error(data.message || 'Failed to generate quotation number');
            }
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

                    // Map RFQ items to quotation items
                    if (rfq.items && Array.isArray(rfq.items)) {
                        const mappedItems = rfq.items.map(item => ({
                            rfq_item_id: item.rfq_item_id || item.id,
                            product_id: item.productId || item.product_id,
                            product_code: item.productCode || item.product_code || '',
                            product_name: item.productName || item.product_name || '',
                            quantity: Number(item.quantity || 0),
                            unit_price: Number(item.targetPrice || item.target_price || 0),
                            tax_rate: 0,
                            tax_amount: 0,
                            line_total: 0,
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
                        created_by: user.userId || user.user_id
                    }));
                }

                // Generate quotation number
                const pqNo = await generateQuotationNumber();
                setFormData(prev => ({
                    ...prev,
                    pq_no: pqNo
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
            const price = Number(item.unit_price || 0);
            const taxRate = Number(item.tax_rate || 0);
            const subtotal = qty * price;
            const taxAmount = formData.is_tax_included ? 0 : (subtotal * taxRate / 100);
            const lineTotal = subtotal + taxAmount;

            return {
                ...item,
                tax_amount: taxAmount,
                line_total: lineTotal
            };
        });

        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            total_amount: calculateTotals.total
        }));
    }, [formData.items.map(i => `${i.quantity}-${i.unit_price}-${i.tax_rate}`).join(','), formData.is_tax_included, calculateTotals.total]);

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

        if (!formData.pq_no) {
            errors.pq_no = 'Mã báo giá là bắt buộc';
        }

        if (!formData.rfq_id) {
            errors.rfq_id = 'RFQ là bắt buộc';
        }

        if (!formData.vendor_id) {
            errors.vendor_id = 'Nhà cung cấp là bắt buộc';
        }

        if (!formData.valid_until) {
            errors.valid_until = 'Ngày hết hạn là bắt buộc';
        }

        if (formData.items.length === 0) {
            errors.items = 'Phải có ít nhất một sản phẩm';
        }

        // Validate items
        formData.items.forEach((item, index) => {
            if (!item.quantity || item.quantity <= 0) {
                errors[`item_${index}_quantity`] = 'Số lượng phải lớn hơn 0';
            }
            if (!item.unit_price || item.unit_price <= 0) {
                errors[`item_${index}_unit_price`] = 'Đơn giá phải lớn hơn 0';
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
            const response = await fetch('/api/purchase-quotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    total_amount: calculateTotals.total
                }),
            });

            if (response.ok) {
                toast.success('Tạo báo giá thành công!');
                navigate(`/purchase/rfqs/${rfqId}`);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Có lỗi xảy ra khi gửi dữ liệu');
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
                                value={formData.pq_no}
                                onChange={(e) => handleInputChange('pq_no', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    validationErrors.pq_no ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Mã báo giá"
                            />
                            {validationErrors.pq_no && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.pq_no}</p>
                            )}
                        </div>

                        {/* Quotation Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày báo giá
                            </label>
                            <DatePicker
                                selected={formData.pq_date}
                                onChange={(date) => handleInputChange('pq_date', date)}
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
                                selected={formData.valid_until}
                                onChange={(date) => handleInputChange('valid_until', date)}
                                dateFormat="dd/MM/yyyy"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    validationErrors.valid_until ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholderText="Chọn ngày"
                            />
                            {validationErrors.valid_until && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.valid_until}</p>
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
                                    checked={formData.is_tax_included}
                                    onChange={(e) => handleInputChange('is_tax_included', e.target.checked)}
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
                                value={formData.lead_time_days || ''}
                                onChange={(e) => handleInputChange('lead_time_days', e.target.value ? parseInt(e.target.value) : null)}
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
                                value={formData.warranty_months || ''}
                                onChange={(e) => handleInputChange('warranty_months', e.target.value ? parseInt(e.target.value) : null)}
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
                            <input
                                type="text"
                                value={formData.delivery_terms}
                                onChange={(e) => handleInputChange('delivery_terms', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Điều khoản giao hàng"
                            />
                        </div>

                        {/* Payment Terms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Điều khoản thanh toán
                            </label>
                            <input
                                type="text"
                                value={formData.payment_terms}
                                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Điều khoản thanh toán"
                            />
                        </div>

                        {/* Header Discount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chiết khấu (%)
                            </label>
                            <input
                                type="number"
                                value={formData.header_discount}
                                onChange={(e) => handleInputChange('header_discount', parseFloat(e.target.value) || 0)}
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
                                value={formData.shipping_cost}
                                onChange={(e) => handleInputChange('shipping_cost', parseFloat(e.target.value) || 0)}
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
                                                {item.product_name || `${item.product_code || ''} - Sản phẩm`}
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
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="w-24 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                                                    min="0"
                                                    step="0.01"
                                                />
                                                {validationErrors[`item_${index}_unit_price`] && (
                                                    <p className="text-red-500 text-xs mt-0.5">{validationErrors[`item_${index}_unit_price`]}</p>
                                                )}
                                            </td>
                                            <td className="border border-gray-200 px-2 py-1">
                                                <input
                                                    type="number"
                                                    value={item.tax_rate || 0}
                                                    onChange={(e) => handleItemChange(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                                                    className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    disabled={formData.is_tax_included}
                                                />
                                            </td>
                                            <td className="border border-gray-200 px-2 py-1 text-xs">
                                                {formatCurrency(item.line_total || 0)}
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
                                    {!formData.is_tax_included && (
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
                                    {formData.header_discount > 0 && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="5" className="border border-gray-200 px-2 py-1 text-xs text-right">
                                                Chiết khấu:
                                            </td>
                                            <td className="border border-gray-200 px-2 py-1 text-xs text-red-600">
                                                -{formatCurrency(formData.header_discount)}
                                            </td>
                                            <td className="border border-gray-200 px-2 py-1"></td>
                                        </tr>
                                    )}
                                    {formData.shipping_cost > 0 && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="5" className="border border-gray-200 px-2 py-1 text-xs text-right">
                                                Phí vận chuyển:
                                            </td>
                                            <td className="border border-gray-200 px-2 py-1 text-xs">
                                                {formatCurrency(formData.shipping_cost)}
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