import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import purchaseRequisitionService from "../../../api/purchaseRequisitionService";
import apiClient from '../../../api/apiClient';
import { getCurrentUser } from '../../../api/authService';

const PurchaseRequisitionForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // Form data state - matching BE RequestDTO format
    const [formData, setFormData] = useState({
        planId: null,
        requesterId: null,
        department: '',
        costCenter: '',
        neededBy: null,
        destinationWarehouseId: null,
        purpose: '',
        approvalStatus: 'Pending',
        approverId: null,
        totalEstimated: 0,
        status: 'Open',
        items: []
    });

    // Additional states
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [requisitionNo, setRequisitionNo] = useState('');

    // Calculate total value
    const totalValue = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        return formData.items.reduce((sum, it) => {
            const qty = Number(it.requested_qty || 0);
            const price = Number(it.valuation_price || 0);
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

    // Auto-generate requisition number
    const generateRequisitionNumber = async () => {
        try {
            const response = await purchaseRequisitionService.generateRequisitionNo();
            if (response.success && response.requisition_no) {
                return response.requisition_no;
            } else {
                throw new Error(response.message || 'Failed to generate requisition number');
            }
        } catch (error) {
            console.error('Error generating requisition number:', error);
            toast.error('Không thể tạo mã phiếu yêu cầu');
            const currentYear = new Date().getFullYear();
            return `PR-${currentYear}-001`; // Fallback number
        }
    };

    const getCurrentUserId = async () => {
        try {
            // Get user profile to get userId
            const response = await apiClient.get('/users/profile');
            if (response.data && response.data.userId) {
                return response.data.userId;
            }
        } catch (error) {
            console.error('Error getting current user:', error);
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

                // Get current user info from localStorage
                const user = getCurrentUser();
                if (user) {
                    // Set requester_id ngay lập tức
                    const userId = user.userId || user.user_id;
                    setFormData(prev => ({
                        ...prev,
                        requesterId: userId
                    }));
                    
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
                            // Fallback to user from localStorage if profile API fails
                            setCurrentUser(user);
                        }
                    } catch (error) {
                        console.error('Error loading user profile:', error);
                        // Fallback to user from localStorage if profile API fails
                        setCurrentUser(user);
                    }
                } else {
                    // Fallback: Get userId from JWT token if user not in localStorage
                    const userId = getCurrentUserId();
                    if (userId) {
                        setCurrentUser({ userId });
                        setFormData(prev => ({
                            ...prev,
                            requester_id: userId
                        }));
                    }
                }

                // Generate requisition number for new requisition
                if (!isEdit) {
                    const reqNo = await generateRequisitionNumber();
                    setRequisitionNo(reqNo);
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
                    const response = await purchaseRequisitionService.getRequisitionById(id);
                    const data = response.data || response;

                    setRequisitionNo(data.requisitionNo || '');
                    setFormData({
                        planId: data.planId || null,
                        requesterId: data.requesterId || null,
                        department: data.department || '',
                        costCenter: data.costCenter || '',
                        neededBy: data.neededBy ? new Date(data.neededBy) : null,
                        destinationWarehouseId: data.destinationWarehouseId || null,
                        purpose: data.purpose || '',
                        approvalStatus: data.approvalStatus || 'Pending',
                        approverId: data.approverId || null,
                        totalEstimated: data.totalEstimated || 0,
                        status: data.status || 'Open',
                        items: (data.items || []).map(item => ({
                            planItemId: item.planItemId || null,
                            productId: item.productId || null,
                            productCode: item.productCode || '',
                            productName: item.productName || '',
                            spec: item.spec || '',
                            uom: item.uom || '',
                            requestedQty: item.requestedQty || 0,
                            targetUnitPrice: item.targetUnitPrice || 0,
                            suggestedVendorId: item.suggestedVendorId || null,
                            note: item.note || ''
                        }))
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

    // Add new item - matching BE ItemRequestDTO format
    const addItem = () => {
        const newItem = {
            product_id: null,
            requested_qty: 1,
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
            // Tự động điền giá định giá từ product (ưu tiên purchasePrice, sau đó purchase_price)
            const purchasePrice = product.purchasePrice ?? product.purchase_price ?? 0;
            
            // Update cả product_id và valuation_price trong một lần để tránh state không đồng bộ
            setFormData(prev => {
                const newItems = [...prev.items];
                newItems[index] = {
                    ...newItems[index],
                    product_id: selectedOption.value,
                    valuation_price: purchasePrice
                };
                return {
                    ...prev,
                    items: newItems
                };
            });
        }
    };

    // Validation - matching BE validation
    const validateAllFields = () => {
        const errors = {};

        if (!formData.department || formData.department.trim() === '') {
            errors.department = 'Phòng ban là bắt buộc';
        }

        if (!formData.destinationWarehouseId) {
            errors.destinationWarehouseId = 'Kho đích đến là bắt buộc';
        }

        if (!formData.purpose || formData.purpose.trim() === '') {
            errors.purpose = 'Mục đích sử dụng là bắt buộc';
        }

        if (formData.items.length === 0) {
            errors.items = 'Phải có ít nhất một sản phẩm';
        }

        // Validate items - matching BE ItemRequestDTO validation
        formData.items.forEach((item, index) => {
            if (!item.productCode || item.productCode.trim() === '') {
                errors[`item_${index}_productCode`] = 'Mã sản phẩm là bắt buộc';
            }
            if (!item.productName || item.productName.trim() === '') {
                errors[`item_${index}_productName`] = 'Tên sản phẩm là bắt buộc';
            }
            if (!item.uom || item.uom.trim() === '') {
                errors[`item_${index}_uom`] = 'Đơn vị tính là bắt buộc';
            }
            if (!item.requestedQty || item.requestedQty <= 0) {
                errors[`item_${index}_qty`] = 'Số lượng phải lớn hơn 0';
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
            
            // Prepare data matching BE RequestDTO format
            const submitData = {
                planId: formData.planId,
                requesterId: formData.requesterId,
                department: formData.department,
                costCenter: formData.costCenter || null,
                neededBy: formData.neededBy ? formData.neededBy.toISOString().split('T')[0] : null,
                destinationWarehouseId: formData.destinationWarehouseId,
                purpose: formData.purpose,
                approvalStatus: formData.approvalStatus,
                approverId: formData.approverId || null,
                totalEstimated: formData.totalEstimated,
                status: formData.status,
                items: formData.items.map(item => ({
                    planItemId: item.planItemId || null,
                    productId: item.productId || null,
                    productCode: item.productCode,
                    productName: item.productName,
                    spec: item.spec || null,
                    uom: item.uom,
                    requestedQty: parseFloat(item.requestedQty) || 0,
                    targetUnitPrice: parseFloat(item.targetUnitPrice) || 0,
                    suggestedVendorId: item.suggestedVendorId || null,
                    note: item.note || null
                }))
            };

            let response;
            if (isEdit) {
                response = await purchaseRequisitionService.updateRequisition(id, submitData);
            } else {
                response = await purchaseRequisitionService.createRequisition(submitData);
            }

            if (response.success) {
                toast.success(response.message || (isEdit ? 'Cập nhật phiếu yêu cầu thành công!' : 'Tạo phiếu yêu cầu thành công!'));
                navigate('/purchase-requisitions');
            } else {
                toast.error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi dữ liệu';
            toast.error(errorMessage);
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
                                Mã phiếu
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
                                value={getUserDisplayName(currentUser)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                readOnly
                            />
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
                                            Sản phẩm <span className="text-red-500">*</span>
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Mã sản phẩm <span className="text-red-500">*</span>
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Tên sản phẩm <span className="text-red-500">*</span>
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Đơn vị tính <span className="text-red-500">*</span>
                                        </th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                            Thành tiền
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
                                                    value={products.find(option => {
                                                        const optionValue = Number(option.value);
                                                        const itemValue = Number(item.product_id);
                                                        return optionValue === itemValue && !isNaN(optionValue) && !isNaN(itemValue);
                                                    }) || null}
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
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.productCode}
                                                    onChange={(e) => handleItemChange(index, 'productCode', e.target.value)}
                                                    className={`w-32 px-2 py-1 border rounded text-sm ${validationErrors[`item_${index}_productCode`] ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="Mã sản phẩm"
                                                />
                                                {validationErrors[`item_${index}_productCode`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`item_${index}_productCode`]}</p>
                                                )}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.productName}
                                                    onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                                    className={`w-48 px-2 py-1 border rounded text-sm ${validationErrors[`item_${index}_productName`] ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="Tên sản phẩm"
                                                />
                                                {validationErrors[`item_${index}_productName`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`item_${index}_productName`]}</p>
                                                )}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.uom}
                                                    onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                                                    className={`w-20 px-2 py-1 border rounded text-sm ${validationErrors[`item_${index}_uom`] ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="UOM"
                                                />
                                                {validationErrors[`item_${index}_uom`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`item_${index}_uom`]}</p>
                                                )}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={item.requested_qty}
                                                    onChange={(e) => handleItemChange(index, 'requested_qty', parseFloat(e.target.value) || 1)}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    min="1"
                                                    step="1"
                                                />
                                                {validationErrors[`item_${index}_qty`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`item_${index}_qty`]}</p>
                                                )}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={item.targetUnitPrice}
                                                    onChange={(e) => handleItemChange(index, 'targetUnitPrice', parseFloat(e.target.value) || 0)}
                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 text-sm">
                                                {formatCurrency((Number(item.requested_qty || 0) * Number(item.valuation_price || 0)))}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.note || ''}
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
                            <div className="flex justify-end mt-3">
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Tổng giá trị</div>
                                    <div className="text-lg font-semibold">{formatCurrency(totalValue)}</div>
                                </div>
                            </div>
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
