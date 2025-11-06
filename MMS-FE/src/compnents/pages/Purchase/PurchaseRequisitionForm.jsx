import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PurchaseRequisitionForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // Form data state
    const [formData, setFormData] = useState({
        requisition_no: '',
        requester_id: null,
        purpose: '',
        status: 'Draft',
        approver_id: null,
        approved_at: null,
        items: []
    });

    // Additional states
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [products, setProducts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // Auto-generate requisition number
    const generateRequisitionNumber = async () => {
        try {
            const response = await fetch('/api/purchase-requisitions/generate-number');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return data.requisition_no;
            } else {
                throw new Error(data.message || 'Failed to generate requisition number');
            }
        } catch (error) {
            console.error('Error generating requisition number:', error);
            // Fallback to proper format - không dùng timestamp
            const currentYear = new Date().getFullYear();
            return `PR-${currentYear}-999`; // Fallback number
        }
    };

    const getCurrentUserId = () => {
        const token = localStorage.getItem('token');
        console.log('Token:', token); // Debug token

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('JWT Payload:', payload); // Debug payload
                return payload.userId;
            } catch (error) {
                console.error('Error parsing token:', error);
                return null;
            }
        }
        return null;
    };

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load products
                const productsResponse = await fetch('/api/product?page=0&size=100');
                const resJson = await productsResponse.json();
                const productsData = Array.isArray(resJson) ? resJson : (resJson.content || []);
                setProducts(productsData.map(p => ({
                    value: p.id ?? p.product_id,
                    label: `${p.sku || p.productCode} - ${p.name}`,
                    product: p
                })));

                // Get current user info from JWT token
                const userId = getCurrentUserId();
                if (userId) {
                    setCurrentUser({ userId });
                    // Set requester_id ngay lập tức
                    setFormData(prev => ({
                        ...prev,
                        requester_id: userId
                    }));
                }

                // Generate requisition number for new requisition
                if (!isEdit) {
                    const requisitionNo = await generateRequisitionNumber();
                    setFormData(prev => ({
                        ...prev,
                        requisition_no: requisitionNo
                    }));
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
                toast.error('Lỗi khi tải dữ liệu ban đầu');
            }
        };

        loadInitialData();
    }, [isEdit]);

    // Load requisition data for edit
    useEffect(() => {
        if (isEdit && id) {
            const loadRequisitionData = async () => {
                try {
                    setLoading(true);
                    const response = await fetch(`/api/purchase-requisitions/${id}`);
                    const data = await response.json();

                    setFormData({
                        requisition_no: data.requisition_no,
                        requester_id: data.requester_id,
                        purpose: data.purpose,
                        status: data.status,
                        approver_id: data.approver_id,
                        approved_at: data.approved_at ? new Date(data.approved_at) : null,
                        items: data.items || []
                    });
                } catch (error) {
                    console.error('Error loading requisition data:', error);
                    toast.error('Lỗi khi tải dữ liệu phiếu yêu cầu');
                } finally {
                    setLoading(false);
                }
            };

            loadRequisitionData();
        }
    }, [isEdit, id]);

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear validation error for this field
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

    // Add new item
    const addItem = () => {
        const newItem = {
            product_id: null,
            requested_qty: 0,
            delivery_date: new Date(),
            valuation_price: 0,
            price_unit: 1,
            note: ''
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    // Remove item
    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };


    const handleProductSelect = (index, selectedOption) => {
        if (selectedOption) {
            const product = selectedOption.product;
            handleItemChange(index, 'product_id', product.product_id || product.id);
            // Nếu muốn tự động điền giá định giá
            if (product.purchase_price) {
                handleItemChange(index, 'valuation_price', product.purchase_price);
            }
        }
    };

    // Validation
    const validateAllFields = () => {
        const errors = {};

        if (!formData.requisition_no) {
            errors.requisition_no = 'Mã phiếu yêu cầu là bắt buộc';
        }

        if (!formData.purpose) {
            errors.purpose = 'Mục đích sử dụng là bắt buộc';
        }

        if (formData.items.length === 0) {
            errors.items = 'Phải có ít nhất một sản phẩm';
        }

        // Validate items
        formData.items.forEach((item, index) => {
            if (!item.product_id) {
                errors[`item_${index}_product`] = 'Sản phẩm là bắt buộc';
            }
            if (!item.requested_qty || item.requested_qty <= 0) {
                errors[`item_${index}_qty`] = 'Số lượng phải lớn hơn 0';
            }
            if (!item.delivery_date) {
                errors[`item_${index}_delivery_date`] = 'Ngày giao hàng là bắt buộc';
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
            const url = isEdit ? `/api/purchase-requisitions/${id}` : '/api/purchase-requisitions';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(isEdit ? 'Cập nhật phiếu yêu cầu thành công!' : 'Tạo phiếu yêu cầu thành công!');
                navigate('/purchase-requisitions');
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

    if (loading && isEdit) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => navigate('/purchase-requisitions')}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEdit ? 'Cập nhật phiếu yêu cầu' : 'Tạo phiếu yêu cầu'}
                    </h1>
                </div>
                <p className="text-gray-600">
                    {isEdit ? 'Chỉnh sửa thông tin phiếu yêu cầu mua hàng' : 'Tạo phiếu yêu cầu mua hàng mới'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Purchase Requisition Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin phiếu yêu cầu</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Requisition Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã phiếu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.requisition_no}
                                onChange={(e) => handleInputChange('requisition_no', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.requisition_no ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Mã phiếu yêu cầu"
                                readOnly={!isEdit}
                            />
                            {validationErrors.requisition_no && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.requisition_no}</p>
                            )}
                        </div>

                        {/* Requester ID - Chỉ hiển thị */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Người yêu cầu
                            </label>
                            <input
                                type="text"
                                value={currentUser ? `User ID: ${currentUser.userId}` : 'Đang tải...'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                readOnly
                            />
                            <p className="text-xs text-gray-500 mt-1">Tự động lấy từ tài khoản đang đăng nhập</p>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <input
                                type="text"
                                value={formData.status}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                readOnly
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {isEdit ? 'Trạng thái không thể thay đổi trực tiếp' : 'Mặc định là Draft khi tạo mới'}
                            </p>
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mục đích sử dụng <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.purpose}
                            onChange={(e) => handleInputChange('purpose', e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.purpose ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Mô tả mục đích sử dụng"
                        />
                        {validationErrors.purpose && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.purpose}</p>
                        )}
                    </div>
                </div>

                {/* Product Items */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Danh sách sản phẩm</h2>
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
                            <p>Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            #
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Sản phẩm
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Số lượng
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Ngày giao hàng
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Giá định giá
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Ghi chú
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                                                {index + 1}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <Select
                                                    value={products.find(option => String(option.value) === String(item.product_id)) || null}
                                                    onChange={(selectedOption) => handleProductSelect(index, selectedOption)}
                                                    options={products}
                                                    placeholder="Chọn sản phẩm"
                                                    className="min-w-48"
                                                    menuPortalTarget={document.body}
                                                    menuPosition="fixed"
                                                    menuShouldScrollIntoView={false}
                                                    styles={{
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                                    }}
                                                />
                                                {validationErrors[`item_${index}_product`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`item_${index}_product`]}</p>
                                                )}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={item.requested_qty}
                                                    onChange={(e) => handleItemChange(index, 'requested_qty', parseFloat(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    min="0"
                                                    step="0.01"
                                                />
                                                {validationErrors[`item_${index}_qty`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`item_${index}_qty`]}</p>
                                                )}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <DatePicker
                                                    selected={item.delivery_date}
                                                    onChange={(date) => handleItemChange(index, 'delivery_date', date)}
                                                    dateFormat="dd/MM/yyyy"
                                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    placeholderText="Chọn ngày"
                                                />
                                                {validationErrors[`item_${index}_delivery_date`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`item_${index}_delivery_date`]}</p>
                                                )}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={item.valuation_price}
                                                    onChange={(e) => handleItemChange(index, 'valuation_price', parseFloat(e.target.value) || 0)}
                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.note}
                                                    onChange={(e) => handleItemChange(index, 'note', e.target.value)}
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/purchase-requisitions')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseRequisitionForm;