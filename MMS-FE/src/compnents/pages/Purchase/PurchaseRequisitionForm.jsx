import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getCurrentUser } from '../../../api/authService';
import { getProducts } from '../../../api/productService';
import purchaseRequisitionService from '../../../api/purchaseRequisitionService';
import { getCurrentUserProfile } from '../../../api/userProfileService';
import * as ExcelJS from 'exceljs';

const PurchaseRequisitionForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // Form data state
    const [formData, setFormData] = useState({
        requisition_no: '',
        requisition_date: new Date(),
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
    const fileInputRef = useRef(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // Calculate total value - removed valuation_price
    const totalValue = useMemo(() => {
        return 0; // No longer calculating total since valuation_price is removed
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

    // Auto-generate requisition number from backend service
    const generateRequisitionNumber = async () => {
        try {
            const requisitionNo = await purchaseRequisitionService.generateRequisitionNo();
            return requisitionNo;
        } catch (error) {
            console.error('Error generating requisition number:', error);
            // Fallback to proper format - không dùng timestamp
            const currentYear = new Date().getFullYear();
            return `PR-${currentYear}-001`; // Fallback number
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
                // Load products using productService (has auth handling)
                try {
                    const productsData = await getProducts();
                    // Backend trả về List<ProductResponseDTO> trực tiếp
                    if (Array.isArray(productsData)) {
                        setProducts(productsData.map(p => ({
                            value: p.productId ?? p.id ?? p.product_id,
                            label: `${p.sku || ''} - ${p.name || ''}`,
                            product: p
                        })));
                    } else {
                        console.warn('Unexpected products response format:', productsData);
                        setProducts([]);
                    }
                } catch (error) {
                    console.error('Failed to load products:', error);
                    toast.error('Không thể tải danh sách sản phẩm: ' + (error.message || 'Lỗi không xác định'));
                    setProducts([]);
                }

                // Get current user info from localStorage
                const user = getCurrentUser();
                if (user) {
                    // Set requester_id ngay lập tức
                    const userId = user.userId || user.user_id;
                    setFormData(prev => ({
                        ...prev,
                        requester_id: userId
                    }));

                    // Load user profile to get name using service
                    try {
                        const profile = await getCurrentUserProfile();
                        setCurrentUser({
                            ...user,
                            fullName: profile.fullName,
                            firstName: profile.firstName,
                            lastName: profile.lastName
                        });
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
                    const requisitionNo = await generateRequisitionNumber();
                    setFormData(prev => ({
                        ...prev,
                        requisition_no: requisitionNo,
                        requisition_date: new Date()
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
                    const data = await purchaseRequisitionService.getRequisitionById(id);

                    // Kiểm tra status - chỉ cho phép edit khi status là Draft
                    const status = data.status || 'Draft';
                    if (status !== 'Draft') {
                        const statusMap = {
                            'Draft': 'Bản nháp',
                            'Pending': 'Chờ duyệt',
                            'Approved': 'Đã duyệt',
                            'Rejected': 'Đã từ chối',
                            'Cancelled': 'Đã hủy'
                        };
                        const statusLabel = statusMap[status] || status;
                        toast.error(`Không thể chỉnh sửa phiếu yêu cầu với trạng thái "${statusLabel}". Chỉ có thể chỉnh sửa khi trạng thái là "Bản nháp".`);
                        navigate(`/purchase/purchase-requisitions/${id}`);
                        return;
                    }

                    setFormData({
                        requisition_no: data.requisition_no || data.requisitionNo || '',
                        requisition_date: data.requisition_date ? new Date(data.requisition_date) : (data.requisitionDate ? new Date(data.requisitionDate) : new Date()),
                        requester_id: data.requester_id || data.requesterId || null,
                        purpose: data.purpose || '',
                        status: status,
                        approver_id: data.approver_id || data.approverId || null,
                        approved_at: data.approved_at ? new Date(data.approved_at) : (data.approvedAt ? new Date(data.approvedAt) : null),
                        items: (data.items || []).map(item => ({
                            product_id: item.product_id || item.productId || null,
                            product_name: item.product_name || item.productName || '',
                            requested_qty: item.requested_qty || item.requestedQty || 1,
                            unit: item.unit || item.uom || '',
                            delivery_date: item.delivery_date ? new Date(item.delivery_date) : (item.deliveryDate ? new Date(item.deliveryDate) : new Date()),
                            note: item.note || ''
                        }))
                    });
                } catch (error) {
                    console.error('Error loading requisition data:', error);
                    toast.error('Lỗi khi tải dữ liệu phiếu yêu cầu: ' + error.message);
                } finally {
                    setLoading(false);
                }
            };

            loadRequisitionData();
        }
    }, [isEdit, id, navigate]);

    // Track form changes
    useEffect(() => {
        // Check if form has meaningful data (not just initial state)
        // Consider it has data if: has purpose OR has items
        // Don't check requisition_no because it's auto-generated
        const hasData = (formData.purpose && formData.purpose.trim() !== '') ||
            (formData.items && formData.items.length > 0);

        // Only track for new forms (not edit mode)
        if (!isEdit) {
            setHasUnsavedChanges(hasData);
        } else {
            setHasUnsavedChanges(false);
        }
    }, [formData, isEdit]);


    // Handle navigation with unsaved changes check
    const handleNavigate = (path) => {
        // Check again to make sure we have the latest state
        // Only check purpose and items (not requisition_no as it's auto-generated)
        const hasData = (formData.purpose && formData.purpose.trim() !== '') ||
            (formData.items && formData.items.length > 0);

        if (!isEdit && hasData) {
            setPendingNavigation(path);
            setShowSaveDraftDialog(true);
        } else {
            navigate(path);
        }
    };

    // Handle save draft and navigate
    const handleSaveDraftAndNavigate = async () => {
        try {
            setLoading(true);
            // Format data to match DTO (camelCase)
            const draftData = {
                requisitionNo: formData.requisition_no,
                requisitionDate: formData.requisition_date ? formData.requisition_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                requesterId: formData.requester_id,
                purpose: formData.purpose || '',
                status: 'Draft', // Luôn là Draft khi lưu bản nháp
                approverId: formData.approver_id,
                approvedAt: formData.approved_at ? formData.approved_at.toISOString() : null,
                items: (formData.items || []).map(item => ({
                    productId: item.product_id,
                    productName: item.product_name || '',
                    requestedQty: parseFloat(item.requested_qty) || 1,
                    unit: item.unit || '',
                    deliveryDate: item.delivery_date ? item.delivery_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    note: item.note || ''
                }))
            };

            // Use service - apiClient handles auth automatically
            await purchaseRequisitionService.createRequisition(draftData);
            toast.success('Đã lưu bản nháp vào hệ thống');
        } catch (error) {
            console.error('Error saving draft to backend:', error);
            toast.error('Lỗi khi lưu bản nháp: ' + (error.message || 'Lỗi không xác định'));
        } finally {
            setLoading(false);
        }
        setHasUnsavedChanges(false);
        setShowSaveDraftDialog(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    // Handle discard and navigate
    const handleDiscardAndNavigate = () => {
        setHasUnsavedChanges(false);
        setShowSaveDraftDialog(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    // Handle browser back/close (beforeunload)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

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

    // Handle quantity change with validation
    const handleQuantityChange = (index, value) => {
        // Allow empty string for clearing - don't validate during typing
        if (value === '' || value === null || value === undefined) {
            setFormData(prev => {
                const newItems = [...prev.items];
                newItems[index] = {
                    ...newItems[index],
                    requested_qty: ''
                };
                return {
                    ...prev,
                    items: newItems
                };
            });
            return;
        }

        // Allow any value during typing (validation happens on blur)
        // Store as string to allow empty input
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = {
                ...newItems[index],
                requested_qty: value
            };
            return {
                ...prev,
                items: newItems
            };
        });
    };

    // Get available products for a specific item (exclude already selected products)
    const getAvailableProducts = (currentIndex) => {
        // Get list of product_ids already selected in other items
        const selectedProductIds = formData.items
            .map((item, idx) => idx !== currentIndex ? item.product_id : null)
            .filter(id => id !== null && id !== undefined);

        // Filter out products that are already selected
        return products.filter(product => {
            const productId = Number(product.value);
            return !selectedProductIds.some(selectedId => Number(selectedId) === productId);
        });
    };

    // Add new item
    const addItem = () => {
        const newItem = {
            product_id: null,
            product_name: '',
            requested_qty: 1,
            unit: '',
            delivery_date: new Date(),
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

    // Handle Excel import
    const handleExcelImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Check file extension
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await workbook.xlsx.load(arrayBuffer);

            // Get first worksheet
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                toast.error('File Excel không có dữ liệu');
                return;
            }

            // Expected columns: Sản phẩm, Số lượng, Đơn vị, Ngày giao hàng, Ghi chú
            // Skip header row (row 1), start from row 2
            const importedItems = [];

            worksheet.eachRow((row, rowNum) => {
                if (rowNum === 1) return; // Skip header

                // Get cell values - ExcelJS uses 1-based indexing
                const getCellValue = (colIndex, isDateColumn = false) => {
                    const cell = row.getCell(colIndex);
                    if (!cell || cell.value === null || cell.value === undefined) return null;

                    // For date column, check if cell is formatted as date
                    if (isDateColumn) {
                        // Check if cell has date format
                        if (cell.type === ExcelJS.ValueType.Date || cell.value instanceof Date) {
                            if (cell.value instanceof Date) {
                                // Create new date to avoid timezone issues
                                return new Date(cell.value.getFullYear(), cell.value.getMonth(), cell.value.getDate());
                            }
                            return new Date(cell.value);
                        }

                        // If number and cell format suggests date, treat as Excel date serial
                        if (cell.type === ExcelJS.ValueType.Number && cell.numFmt) {
                            // Check if format contains date indicators (d, m, y)
                            const dateFormats = ['d', 'm', 'y', 'dd', 'mm', 'yy', 'yyyy', 'mmm', 'mmmm'];
                            const hasDateFormat = dateFormats.some(fmt => cell.numFmt.toLowerCase().includes(fmt));
                            if (hasDateFormat) {
                                // This is an Excel date serial number
                                return { isExcelDateSerial: true, value: cell.value };
                            }
                        }
                    }

                    // Handle date cells - ExcelJS may return Date object or number
                    if (cell.type === ExcelJS.ValueType.Date || cell.value instanceof Date) {
                        if (cell.value instanceof Date) {
                            // Create new date to avoid timezone issues
                            return new Date(cell.value.getFullYear(), cell.value.getMonth(), cell.value.getDate());
                        }
                        return new Date(cell.value);
                    }

                    // Handle number cells
                    if (cell.type === ExcelJS.ValueType.Number) {
                        return cell.value;
                    }

                    // Handle formula cells
                    if (cell.type === ExcelJS.ValueType.Formula) {
                        return cell.result;
                    }

                    // Default: convert to string
                    return cell.value?.toString() || '';
                };

                // Map columns: A=Sản phẩm, B=Số lượng, C=Đơn vị, D=Ngày giao hàng, E=Ghi chú
                const productNameValue = getCellValue(1);
                const qtyValue = getCellValue(2);
                const unitValue = getCellValue(3);
                const deliveryDateValue = getCellValue(4, true); // isDateColumn = true
                const noteValue = getCellValue(5);

                const productName = productNameValue ? productNameValue.toString().trim() : '';
                const qty = qtyValue ? (typeof qtyValue === 'number' ? qtyValue : parseFloat(qtyValue)) : 1;
                const unit = unitValue ? unitValue.toString().trim() : '';
                const note = noteValue ? noteValue.toString().trim() : '';

                // Skip empty rows
                if (!productName) return;

                // Try to find product by name in products list
                let productId = null;
                const foundProduct = products.find(p => {
                    const label = p.label || '';
                    return label.includes(productName) || label.toLowerCase().includes(productName.toLowerCase());
                });
                if (foundProduct) {
                    productId = foundProduct.value;
                }

                // Parse delivery date
                let deliveryDate = new Date();
                if (deliveryDateValue) {
                    // Check if it's an Excel date serial number object
                    if (deliveryDateValue && typeof deliveryDateValue === 'object' && deliveryDateValue.isExcelDateSerial) {
                        // Excel date serial number (days since 1900-01-01)
                        // Excel epoch is 1899-12-30 (not 1900-01-01)
                        const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
                        const serialNumber = deliveryDateValue.value;
                        const jsDate = new Date(excelEpoch.getTime() + (serialNumber - 1) * 24 * 60 * 60 * 1000);
                        // Extract date parts to avoid timezone issues
                        deliveryDate = new Date(jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate());
                    } else if (deliveryDateValue instanceof Date) {
                        // ExcelJS returns Date object - extract date parts to avoid timezone issues
                        deliveryDate = new Date(
                            deliveryDateValue.getFullYear(),
                            deliveryDateValue.getMonth(),
                            deliveryDateValue.getDate()
                        );
                    } else if (typeof deliveryDateValue === 'number') {
                        // Could be Excel date serial number or just a number
                        // If it's a small number (< 100000), likely a date serial
                        if (deliveryDateValue > 0 && deliveryDateValue < 100000) {
                            // Excel date serial number
                            const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
                            const jsDate = new Date(excelEpoch.getTime() + (deliveryDateValue - 1) * 24 * 60 * 60 * 1000);
                            deliveryDate = new Date(jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate());
                        } else {
                            // Not a date, use current date
                            deliveryDate = new Date();
                        }
                    } else {
                        // Try to parse as date string (format: DD/MM/YYYY or YYYY-MM-DD)
                        const dateStr = deliveryDateValue.toString().trim();
                        let parsedDate = null;

                        // Try DD/MM/YYYY format
                        if (dateStr.includes('/')) {
                            const parts = dateStr.split('/');
                            if (parts.length === 3) {
                                const day = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                                const year = parseInt(parts[2], 10);
                                parsedDate = new Date(year, month, day);
                            }
                        } else {
                            // Try standard date parsing
                            parsedDate = new Date(dateStr);
                        }

                        if (parsedDate && !isNaN(parsedDate.getTime())) {
                            deliveryDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
                        }
                    }
                }

                importedItems.push({
                    product_id: productId,
                    product_name: productId ? '' : productName,
                    requested_qty: isNaN(qty) || qty <= 0 ? 1 : qty,
                    unit: unit,
                    delivery_date: deliveryDate,
                    note: note
                });
            });

            if (importedItems.length === 0) {
                toast.error('Không tìm thấy dữ liệu hợp lệ trong file Excel');
                return;
            }

            // Add imported items to form
            setFormData(prev => ({
                ...prev,
                items: [...prev.items, ...importedItems]
            }));

            toast.success(`Đã import ${importedItems.length} sản phẩm từ Excel`);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error importing Excel:', error);
            toast.error('Lỗi khi đọc file Excel: ' + error.message);
        }
    };

    // Trigger file input
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Download Excel template
    const downloadExcelTemplate = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Template');

            // Set column headers
            worksheet.columns = [
                { header: 'Sản phẩm', key: 'product', width: 30 },
                { header: 'Số lượng', key: 'quantity', width: 12 },
                { header: 'Đơn vị', key: 'unit', width: 12 },
                { header: 'Ngày giao hàng', key: 'delivery_date', width: 18 },
                { header: 'Ghi chú', key: 'note', width: 30 }
            ];

            // Style header row
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            // Add example row
            const exampleRow = worksheet.addRow({
                product: 'Ví dụ: Máy tính Dell XPS 13',
                quantity: 5,
                unit: 'Cái',
                delivery_date: new Date(),
                note: 'Ghi chú mẫu'
            });

            // Style example row (light gray background)
            exampleRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' }
            };

            // Format date column
            worksheet.getColumn('delivery_date').numFmt = 'dd/mm/yyyy';

            // Freeze header row
            worksheet.views = [
                { state: 'frozen', ySplit: 1 }
            ];

            // Generate buffer and download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Template_Phieu_Yeu_Cau_Mua_Hang_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Đã tải template Excel thành công!');
        } catch (error) {
            console.error('Error downloading Excel template:', error);
            toast.error('Lỗi khi tải template Excel: ' + error.message);
        }
    };


    const handleProductSelect = (index, selectedOption) => {
        if (selectedOption && selectedOption.product) {
            const product = selectedOption.product;
            const unit = product.uom || '';

            // Update product_id and unit
            setFormData(prev => {
                const newItems = [...prev.items];
                newItems[index] = {
                    ...newItems[index],
                    product_id: selectedOption.value,
                    product_name: `${product.sku || product.productCode || ''} - ${product.name || ''}`.trim(),
                    unit: unit
                };
                return {
                    ...prev,
                    items: newItems
                };
            });
        } else {
            // Clear product selection
            setFormData(prev => {
                const newItems = [...prev.items];
                newItems[index] = {
                    ...newItems[index],
                    product_id: null,
                    product_name: '',
                    unit: ''
                };
                return {
                    ...prev,
                    items: newItems
                };
            });
        }
    };

    // Validation cơ bản ở frontend - backend sẽ validate đầy đủ
    const validateAllFields = () => {
        const errors = {};

        // Chỉ validate những field cơ bản nhất để UX tốt hơn
        // Backend sẽ validate đầy đủ theo DTO requirements

        if (!formData.purpose || !formData.purpose.trim()) {
            errors.purpose = 'Mục đích sử dụng là bắt buộc';
        }

        if (!formData.items || formData.items.length === 0) {
            errors.items = 'Phải có ít nhất một sản phẩm';
        }

        // Validate items cơ bản
        formData.items.forEach((item, index) => {
            if (!item.product_id && (!item.product_name || !item.product_name.trim())) {
                errors[`item_${index}_product`] = 'Sản phẩm là bắt buộc';
            }
            if (!item.requested_qty || parseFloat(item.requested_qty) <= 0) {
                errors[`item_${index}_qty`] = 'Số lượng phải lớn hơn 0';
            }
            if (!item.delivery_date) {
                errors[`item_${index}_delivery_date`] = 'Ngày giao hàng là bắt buộc';
            }
        });

        return errors;
    };

    // Handle form submission (Tạo mới/Cập nhật với status Pending hoặc giữ nguyên)
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate đầy đủ khi submit (tạo mới hoặc cập nhật)
        const errors = validateAllFields();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            toast.error('Vui lòng kiểm tra lại thông tin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            setLoading(true);

            // Format data to match DTO (camelCase)
            const submitData = {
                requisitionNo: formData.requisition_no,
                requisitionDate: formData.requisition_date ? formData.requisition_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                requesterId: formData.requester_id,
                purpose: formData.purpose,
                // Khi tạo mới: gửi status 'Pending', khi edit: giữ nguyên status hiện tại
                status: isEdit ? formData.status : 'Pending',
                approverId: formData.approver_id,
                approvedAt: formData.approved_at ? formData.approved_at.toISOString() : null,
                items: formData.items.map(item => ({
                    productId: item.product_id,
                    productName: item.product_name || '',
                    requestedQty: parseFloat(item.requested_qty) || 1,
                    unit: item.unit || '',
                    deliveryDate: item.delivery_date ? item.delivery_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    note: item.note || ''
                }))
            };

            // Use service - apiClient handles auth automatically
            if (isEdit) {
                await purchaseRequisitionService.updateRequisition(id, submitData);
                toast.success('Cập nhật phiếu yêu cầu thành công!');
            } else {
                await purchaseRequisitionService.createRequisition(submitData);
                toast.success('Tạo phiếu yêu cầu thành công!');
            }
            setHasUnsavedChanges(false);
            navigate('/purchase/purchase-requisitions');
        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi dữ liệu';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle save draft (không validate, status = Draft)
    const handleSaveDraft = async () => {
        try {
            setLoading(true);

            // Format data to match DTO (camelCase)
            const draftData = {
                requisitionNo: formData.requisition_no,
                requisitionDate: formData.requisition_date ? formData.requisition_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                requesterId: formData.requester_id,
                purpose: formData.purpose || '',
                status: 'Draft', // Luôn là Draft khi lưu bản nháp
                approverId: formData.approver_id,
                approvedAt: formData.approved_at ? formData.approved_at.toISOString() : null,
                items: (formData.items || []).map(item => ({
                    productId: item.product_id,
                    productName: item.product_name || '',
                    requestedQty: parseFloat(item.requested_qty) || 1,
                    unit: item.unit || '',
                    deliveryDate: item.delivery_date ? item.delivery_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    note: item.note || ''
                }))
            };

            // Use service - apiClient handles auth automatically
            if (isEdit) {
                await purchaseRequisitionService.updateRequisition(id, draftData);
                toast.success('Đã lưu bản nháp thành công!');
            } else {
                const data = await purchaseRequisitionService.createRequisition(draftData);
                toast.success('Đã lưu bản nháp thành công!');
                // Nếu tạo mới, cập nhật ID để có thể edit sau
                const savedId = data?.requisitionId || data?.requisition_id || data?.id;
                if (savedId) {
                    // Có thể navigate đến edit page hoặc giữ nguyên
                    setHasUnsavedChanges(false);
                }
            }
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving draft:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi lưu bản nháp';
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
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEdit ? 'Cập nhật phiếu yêu cầu' : 'Tạo phiếu yêu cầu'}
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate("/purchase/purchase-requisitions")}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                        ← Quay lại
                    </button>
                </div>
                <div className="border-t border-gray-200" />
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
                        </div>

                        {/* Requisition Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày yêu cầu
                            </label>
                            <DatePicker
                                selected={formData.requisition_date}
                                onChange={(date) => handleInputChange('requisition_date', date)}
                                dateFormat="dd/MM/yyyy"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholderText="Chọn ngày"
                            />
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
                                value={(() => {
                                    const statusMap = {
                                        'Draft': 'Bản nháp',
                                        'Pending': 'Chờ duyệt',
                                        'Approved': 'Đã duyệt',
                                        'Rejected': 'Đã từ chối',
                                        'Cancelled': 'Đã hủy'
                                    };
                                    return statusMap[formData.status] || formData.status;
                                })()}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lí do <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.purpose}
                            onChange={(e) => handleInputChange('purpose', e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.purpose ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Mô tả lí do yêu cầu mua hàng"
                        />
                        {validationErrors.purpose && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.purpose}</p>
                        )}
                    </div>
                </div>

                {/* Product Items */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h2>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={downloadExcelTemplate}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Tải Template Excel
                            </button>
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Import từ Excel
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleExcelImport}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                Thêm sản phẩm
                            </button>
                        </div>
                    </div>

                    {validationErrors.items && (
                        <p className="text-red-500 text-sm px-6 pt-4">{validationErrors.items}</p>
                    )}

                    {formData.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">#</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sản phẩm</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Số lượng</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Đơn vị</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày giao hàng</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ghi chú</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Select
                                                    value={item.product_id ? products.find(option => {
                                                        const optionValue = Number(option.value);
                                                        const itemValue = Number(item.product_id);
                                                        return optionValue === itemValue && !isNaN(optionValue) && !isNaN(itemValue);
                                                    }) || null : null}
                                                    onChange={(selectedOption) => handleProductSelect(index, selectedOption)}
                                                    options={getAvailableProducts(index)}
                                                    placeholder="Chọn sản phẩm"
                                                    className="text-xs"
                                                    menuPortalTarget={document.body}
                                                    menuPosition="fixed"
                                                    menuShouldScrollIntoView={false}
                                                    isClearable
                                                    styles={{
                                                        control: (base) => ({ ...base, fontSize: '0.875rem', minHeight: '36px', height: '36px' }),
                                                        valueContainer: (base) => ({ ...base, padding: '2px 8px' }),
                                                        input: (base) => ({ ...base, margin: '0px', fontSize: '0.875rem' }),
                                                        indicatorsContainer: (base) => ({ ...base, height: '36px' }),
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                        menu: (base) => ({ ...base, zIndex: 9999, fontSize: '0.875rem' }),
                                                    }}
                                                />
                                                {validationErrors[`item_${index}_product`] && (
                                                    <p className="text-xs text-red-600 mt-1">{validationErrors[`item_${index}_product`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.requested_qty || ''}
                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                    onBlur={(e) => {
                                                        const value = e.target.value;
                                                        const numValue = parseFloat(value);
                                                        // Auto-set to 1 if empty or < 1 (số lượng phải là số nguyên dương)
                                                        if (value === '' || value === null || isNaN(numValue) || numValue < 1) {
                                                            setFormData(prev => {
                                                                const newItems = [...prev.items];
                                                                newItems[index] = {
                                                                    ...newItems[index],
                                                                    requested_qty: 1
                                                                };
                                                                return {
                                                                    ...prev,
                                                                    items: newItems
                                                                };
                                                            });
                                                        }
                                                    }}
                                                    className={`w-20 px-2 py-1 border rounded text-sm text-right ${validationErrors[`item_${index}_qty`] ? 'border-red-500' : 'border-gray-300'}`}
                                                    step="1"
                                                    min="1"
                                                />
                                                {validationErrors[`item_${index}_qty`] && (
                                                    <p className="text-xs text-red-600 mt-1">{validationErrors[`item_${index}_qty`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.unit || ''}
                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                    className={`w-24 px-2 py-1 border rounded text-sm ${validationErrors[`item_${index}_unit`] ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="Đơn vị"
                                                    maxLength={50}
                                                />
                                                {validationErrors[`item_${index}_unit`] && (
                                                    <p className="text-xs text-red-600 mt-1">{validationErrors[`item_${index}_unit`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <DatePicker
                                                    selected={item.delivery_date}
                                                    onChange={(date) => handleItemChange(index, 'delivery_date', date)}
                                                    dateFormat="dd/MM/yyyy"
                                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    placeholderText="Chọn ngày"
                                                />
                                                {validationErrors[`item_${index}_delivery_date`] && (
                                                    <p className="text-xs text-red-600 mt-1">{validationErrors[`item_${index}_delivery_date`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.note}
                                                    onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                                                    className="w-48 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    placeholder="Ghi chú"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-800 text-xs"
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
                        onClick={() => handleNavigate('/purchase/purchase-requisitions')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        {loading ? 'Đang xử lý...' : 'Lưu bản nháp'}
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

            {/* Save Draft Dialog */}
            {showSaveDraftDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Bạn có thay đổi chưa lưu
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có muốn lưu bản nháp trước khi rời khỏi trang không?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleDiscardAndNavigate}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveDraftAndNavigate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                Lưu bản nháp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseRequisitionForm;