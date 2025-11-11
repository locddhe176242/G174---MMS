/**
 * PURCHASE REQUISITION FORM COMPONENT
 * 
 * Component này dùng để tạo mới hoặc chỉnh sửa phiếu yêu cầu mua hàng (Purchase Requisition)
 * 
 * FEATURES:
 * - Tạo mới phiếu yêu cầu mua hàng
 * - Chỉnh sửa phiếu yêu cầu mua hàng đã tồn tại
 * - Thêm/xóa sản phẩm vào phiếu
 * - Import danh sách sản phẩm từ Excel
 * - Tự động tính tổng giá trị phiếu
 * - Validation dữ liệu trước khi submit
 * 
 * DATABASE SCHEMA:
 * Purchase_Requisitions: requisition_id, requisition_no, requester_id, department, 
 *                        needed_by, purpose, approval_status, approver_id, approved_at,
 *                        total_estimated, status, created_at, updated_at, deleted_at
 * 
 * Purchase_Requisition_Items: pri_id, requisition_id, product_id, product_code,
 *                             product_name, uom, requested_qty, target_unit_price, note
 **/

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import purchaseRequisitionService from "../../../api/purchaseRequisitionService";
import apiClient from '../../../api/apiClient';
import { getCurrentUser } from '../../../api/authService';
import { getAllDepartments } from '../../../api/departmentService';
import * as ExcelJS from 'exceljs';

const PurchaseRequisitionForm = () => {
    // ==================== ROUTING & MODE ====================
    const navigate = useNavigate();
    const { id } = useParams(); // Lấy ID từ URL nếu đang edit
    const isEdit = Boolean(id); // true = edit mode, false = create mode

    // ==================== FORM STATE ====================
    /**
     * Form data state - Cấu trúc khớp với Backend RequestDTO
     * 
     * @property {number} requesterId - ID người yêu cầu (từ JWT token)
     * @property {string} purpose - Mục đích sử dụng (required)
     * @property {number} approverId - ID người duyệt
     * @property {string} status - Trạng thái phiếu: Draft/Pending/Approved/Rejected
     * @property {Array} items - Danh sách sản phẩm trong phiếu
     */
    const [formData, setFormData] = useState({
        requesterId: null,
        departmentId: null,
        purpose: '',
        justification: '',
        neededBy: null,
        priority: 'Medium',
        currencyCode: 'VND',
        approvalStatus: 'Draft',
        approverId: null,
        approvalRemarks: '',
        status: 'Open',
        items: []
    });

    // ==================== ADDITIONAL STATES ====================
    const [loading, setLoading] = useState(false); // Loading state cho form submission
    const [validationErrors, setValidationErrors] = useState({}); // Lưu lỗi validation
    const [products, setProducts] = useState([]); // Danh sách sản phẩm từ DB
    const [departments, setDepartments] = useState([]); // Danh sách phòng ban từ DB
    const [currentUser, setCurrentUser] = useState(null); // Thông tin user hiện tại
    const [requisitionNo, setRequisitionNo] = useState(''); // Mã phiếu yêu cầu (auto-generated)
    const fileInputRef = React.useRef(null); // Reference cho file input (Excel import)

    // ==================== COMPUTED VALUES ====================
    /**
     * Tính tổng giá trị của tất cả items trong phiếu
     * Công thức: Σ(requestedQty × estimatedUnitPrice)
     */
    const totalValue = useMemo(() => {
        if (!Array.isArray(formData.items)) return 0;
        return formData.items.reduce((sum, it) => {
            const qty = Number(it.requestedQty || 0);
            const estimatedUnitPrice = Number(it.estimatedUnitPrice || 0);
            return sum + qty * estimatedUnitPrice;
        }, 0);
    }, [formData.items]);

    // ==================== HELPER FUNCTIONS ====================
    /**
     * Format số thành tiền tệ VND
     */
    const formatCurrency = (n) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));

    /**
     * Lấy tên hiển thị của user từ các field có sẵn
     * Priority: fullName > firstName+lastName > firstName > email > employeeCode > userId
     */
    const getUserDisplayName = (user) => {
        if (!user) return 'Đang tải...';
        if (user.fullName) return user.fullName;
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
        if (user.firstName) return user.firstName;
        if (user.email) return user.email;
        if (user.employeeCode) return user.employeeCode;
        return `User ID: ${user.userId || user.user_id}`;
    };

    // ==================== API HELPER FUNCTIONS ====================
    /**
     * Tự động sinh mã phiếu yêu cầu mua hàng
     * Format: PR-YYYY-XXX (VD: PR-2025-001)
     * 
     * @returns {Promise<string>} Mã phiếu yêu cầu
     */
    const generateRequisitionNumber = async () => {
        try {
            const requisitionNo = await purchaseRequisitionService.generateRequisitionNumber();
            return requisitionNo || `PR-${new Date().getFullYear()}-001`;
        } catch (error) {
            console.error('Error generating requisition number:', error);
            toast.error('Không thể tạo mã phiếu yêu cầu');
            const currentYear = new Date().getFullYear();
            return `PR-${currentYear}-001`; // Fallback number
        }
    };

    /**
     * Lấy user ID hiện tại từ API profile
     * 
     * @returns {Promise<number|null>} User ID hoặc null nếu không lấy được
     */
    const getCurrentUserId = async () => {
        try {
            const response = await apiClient.get('/users/profile');
            if (response.data && response.data.userId) {
                return response.data.userId;
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
        return null;
    };

    // ==================== USEEFFECT: LOAD INITIAL DATA ====================
    /**
     * Load dữ liệu khởi tạo khi component mount
     * - Danh sách sản phẩm (products)
     * - Thông tin user hiện tại (currentUser & requesterId)
     * - Sinh mã phiếu yêu cầu nếu là create mode
     */
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Load danh sách sản phẩm từ API
                const productsResponse = await apiClient.get('/product');
                const productsData = Array.isArray(productsResponse.data) 
                    ? productsResponse.data 
                    : [];
                setProducts(productsData.map(p => ({
                    value: p.productId ?? p.id ?? p.product_id,
                    label: `${p.sku || p.productCode || ''} - ${p.name || ''}`,
                    product: p
                })));

                // 1b. Load danh sách phòng ban từ API
                try {
                    const departmentsResponse = await getAllDepartments();
                    const departmentsData = Array.isArray(departmentsResponse?.data) 
                        ? departmentsResponse.data 
                        : (Array.isArray(departmentsResponse) ? departmentsResponse : []);
                    setDepartments(departmentsData);
                } catch (error) {
                    console.error('Error loading departments:', error);
                }

                // 2. Load thông tin user hiện tại
                const user = getCurrentUser();
                if (user) {
                    const userId = user.userId || user.user_id;
                    setFormData(prev => ({
                        ...prev,
                        requesterId: userId
                    }));
                    
                    // Load thêm thông tin profile chi tiết
                    try {
                        const profileResponse = await apiClient.get('/users/profile');
                        if (profileResponse.data) {
                            setCurrentUser({
                                ...user,
                                ...profileResponse.data
                            });
                        } else {
                            setCurrentUser(user);
                        }
                    } catch (error) {
                        console.error('Error loading user profile:', error);
                        setCurrentUser(user);
                    }
                } else {
                    // Fallback: Get userId từ API nếu không có trong localStorage
                    const userId = await getCurrentUserId();
                    if (userId) {
                        setCurrentUser({ userId });
                        setFormData(prev => ({
                            ...prev,
                            requesterId: userId
                        }));
                    }
                }

                // 3. Sinh mã phiếu yêu cầu mới nếu đang ở create mode
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

    // ==================== USEEFFECT: LOAD REQUISITION DATA (EDIT MODE) ====================
    /**
     * Load dữ liệu phiếu yêu cầu khi đang ở edit mode
     * Chỉ chạy khi isEdit = true và có id
     */
    useEffect(() => {
        if (isEdit && id) {
            const loadRequisitionData = async () => {
                try {
                    setLoading(true);
                    
                    // Gọi API lấy chi tiết phiếu yêu cầu
                    const data = await purchaseRequisitionService.getRequisitionById(id);

                    setRequisitionNo(data.requisitionNo || '');


                    // Set form data từ response
                    setFormData({
                        requesterId: data.requesterId || null,
                        departmentId: data.departmentId || null,
                        purpose: data.purpose || '',
                        justification: data.justification || '',
                        neededBy: data.neededBy ? new Date(data.neededBy) : null,
                        priority: data.priority || 'Medium',
                        currencyCode: data.currencyCode || 'VND',
                        approvalStatus: data.approvalStatus || 'Draft',
                        approverId: data.approverId || null,
                        approvalRemarks: data.approvalRemarks || '',
                        status: data.status || 'Open',
                        items: (data.items || []).map(item => ({
                            priId: item.priId || null,
                            // Xác định productSource: nếu có productId thì là existing, nếu không thì là new
                            productSource: item.productId ? 'existing' : 'new',
                            productId: item.productId || null,
                            productCode: item.productCode || '',
                            productName: item.productName || '',
                            specification: item.specification || '',
                            uom: item.uom || '',
                            requestedQty: item.requestedQty || 0,
                            estimatedUnitPrice: item.estimatedUnitPrice || 0,
                            deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
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

    // ==================== FORM HANDLERS ====================
    /**
     * Xử lý thay đổi input fields chính (department, neededBy, purpose, etc.)
     * 
     * @param {string} field - Tên field cần update
     * @param {any} value - Giá trị mới
     */
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Xóa validation error cho field này sau khi user sửa
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    /**
     * Xử lý thay đổi field trong items array
     * 
     * @param {number} index - Index của item trong array
     * @param {string} field - Tên field cần update (productCode, requestedQty, etc.)
     * @param {any} value - Giá trị mới
     */
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

    /**
     * Format số thành string có dấu phẩy ngăn cách hàng nghìn
     * VD: 1000000 -> "1,000,000"
     * 
     * @param {number} num - Số cần format
     * @returns {string} Số đã format
     */
    const formatNumber = (num) => {
        if (!num) return '';
        return Number(num).toLocaleString('en-US');
    };

    /**
     * Parse string có dấu phẩy về số
     * VD: "1,000,000" -> 1000000
     * 
     * @param {string} str - String cần parse
     * @returns {number} Số đã parse
     */
    const parseFormattedNumber = (str) => {
        if (!str) return 0;
        return parseFloat(str.toString().replace(/,/g, '')) || 0;
    };

    /**
     * Xử lý thay đổi estimated unit price với format display
     * 
     * @param {number} index - Index của item
     * @param {string} value - Giá trị input (có thể có dấu phẩy)
     */
    const handleEstimatedUnitPriceChange = (index, value) => {
        // Parse value (bỏ dấu phẩy nếu có)
        const numValue = parseFormattedNumber(value);
        handleItemChange(index, 'estimatedUnitPrice', numValue);
    };

    /**
     * Xử lý thay đổi số lượng với format display
     * 
     * @param {number} index - Index của item
     * @param {string} value - Giá trị input (có thể có dấu phẩy)
     */
    const handleQtyChange = (index, value) => {
        // Parse value (bỏ dấu phẩy nếu có)
        const numValue = parseFormattedNumber(value);
        handleItemChange(index, 'requestedQty', numValue);
    };

    /**
     * Thêm một item (sản phẩm) mới vào danh sách
     * Item mới có cấu trúc khớp với Purchase_Requisition_Items table
     * productSource: 'existing' = chọn từ Product table, 'new' = nhập trực tiếp
     */
    const addItem = () => {
        const newItem = {
            productSource: 'existing', // 'existing' hoặc 'new'
            productId: null,          // product_id (INT, nullable) - chỉ dùng khi productSource = 'existing'
            productCode: '',          // product_code (VARCHAR 50) - bắt buộc khi productSource = 'new'
            productName: '',          // product_name (VARCHAR 255) - bắt buộc khi productSource = 'new'
            specification: '',        // specification (TEXT)
            uom: '',                  // uom (VARCHAR 50)
            requestedQty: 1,          // requested_qty (DECIMAL 18,2, required)
            estimatedUnitPrice: 0,    // estimated_unit_price (DECIMAL 18,2)
            deliveryDate: null,       // delivery_date (DATE)
            note: ''                  // note (TEXT)
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    /**
     * Xóa một item khỏi danh sách
     * 
     * @param {number} index - Index của item cần xóa
     */
    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    // ==================== EXCEL IMPORT ====================
    /**
     * Import danh sách sản phẩm từ file Excel
     * 
     * FORMAT FILE EXCEL (Header - dòng 1):
     * Column A: Mã SP (product_code)
     * Column B: Tên SP (product_name)
     * Column C: ĐVT (uom)
     * Column D: Số lượng (requested_qty)
     * Column E: Đơn giá (target_unit_price)
     * Column F: Ghi chú (note)
     * 
     * LOGIC:
     * - Đọc từ dòng 2 trở đi (dòng 1 là header)
     * - Tự động tìm productId nếu mã/tên sản phẩm match với DB
     * - Validate số lượng phải > 0
     * - Thêm vào items hiện có (không xóa items đang có)
     * 
     * @param {Event} event - File input change event
     */
    const handleExcelImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Kiểm tra file extension
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
            return;
        }

        try {
            // Đọc file Excel bằng ExcelJS
            const workbook = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await workbook.xlsx.load(arrayBuffer);

            // Lấy worksheet đầu tiên
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                toast.error('File Excel không có dữ liệu');
                return;
            }

                    // Parse dữ liệu từ Excel
            const importedItems = [];

            worksheet.eachRow((row, rowNum) => {
                if (rowNum === 1) return; // Bỏ qua header row

                // Lấy giá trị từ các cell (1-based index)
                // Format: Product ID | Product Code | Product Name | Specification | UOM | Số lượng | Estimated Unit Price | Ngày giao hàng | Ghi chú
                const productIdStr = row.getCell(1).value?.toString().trim() || '';
                const productCode = row.getCell(2).value?.toString().trim() || '';
                const productName = row.getCell(3).value?.toString().trim() || '';
                const specification = row.getCell(4).value?.toString().trim() || '';
                const uom = row.getCell(5).value?.toString().trim() || '';
                const qty = parseFloat(row.getCell(6).value) || 1;
                const estimatedUnitPrice = parseFloat(row.getCell(7).value) || 0;
                const deliveryDateStr = row.getCell(8).value?.toString().trim() || '';
                const note = row.getCell(9).value?.toString().trim() || '';

                // Bỏ qua dòng trống (ít nhất phải có productId hoặc productCode)
                if (!productIdStr && !productCode) return;

                // Parse productId (có thể null)
                let productId = null;
                if (productIdStr) {
                    const parsed = parseInt(productIdStr);
                    if (!isNaN(parsed)) {
                        productId = parsed;
                    }
                }

                // Parse deliveryDate
                let deliveryDate = null;
                if (deliveryDateStr) {
                    deliveryDate = new Date(deliveryDateStr);
                    if (isNaN(deliveryDate.getTime())) {
                        deliveryDate = null;
                    }
                }

                // Xác định productSource: nếu có productId thì là existing, nếu không thì là new
                const source = productId ? 'existing' : 'new';
                
                // Thêm item vào danh sách import
                importedItems.push({
                    productSource: source,
                    productId: productId,
                    productCode: productCode,
                    productName: productName,
                    specification: specification,
                    uom: uom,
                    requestedQty: isNaN(qty) || qty <= 0 ? 1 : qty,
                    estimatedUnitPrice: isNaN(estimatedUnitPrice) ? 0 : estimatedUnitPrice,
                    deliveryDate: deliveryDate,
                    note: note
                });
            });

            // Kiểm tra có dữ liệu không
            if (importedItems.length === 0) {
                toast.error('Không tìm thấy dữ liệu hợp lệ trong file Excel');
                return;
            }

            // Thêm items đã import vào form
            setFormData(prev => ({
                ...prev,
                items: [...prev.items, ...importedItems]
            }));

            toast.success(`Đã import ${importedItems.length} sản phẩm từ Excel`);

            // Reset file input để có thể import lại cùng file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error importing Excel:', error);
            toast.error('Lỗi khi đọc file Excel: ' + error.message);
        }
    };

    /**
     * Trigger click vào hidden file input để mở file browser
     */
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    /**
     * Xử lý khi user chọn sản phẩm từ dropdown (khi productSource = 'existing')
     * Tự động điền estimatedUnitPrice, productCode, productName, uom từ product
     * 
     * @param {number} index - Index của item trong array
     * @param {Object} selectedOption - Option được chọn từ react-select
     */
    const handleProductSelect = (index, selectedOption) => {
        if (selectedOption) {
            const product = selectedOption.product;
            // Lấy giá mua từ product (có thể là purchasePrice hoặc purchase_price)
            const purchasePrice = product.purchasePrice ?? product.purchase_price ?? 0;
            
            setFormData(prev => {
                const newItems = [...prev.items];
                newItems[index] = {
                    ...newItems[index],
                    productSource: 'existing',
                    productId: selectedOption.value,
                    productCode: product.sku || product.productCode || '',
                    productName: product.name || '',
                    uom: product.uom || '',
                    estimatedUnitPrice: purchasePrice
                };
                return {
                    ...prev,
                    items: newItems
                };
            });
        } else {
            // Khi bỏ chọn sản phẩm
            setFormData(prev => {
                const newItems = [...prev.items];
                newItems[index] = {
                    ...newItems[index],
                    productId: null,
                    productCode: '',
                    productName: '',
                    uom: '',
                    estimatedUnitPrice: 0
                };
                return {
                    ...prev,
                    items: newItems
                };
            });
        }
    };

    /**
     * Xử lý khi user thay đổi loại sản phẩm (existing hoặc new)
     * 
     * @param {number} index - Index của item
     * @param {string} source - 'existing' hoặc 'new'
     */
    const handleProductSourceChange = (index, source) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            if (source === 'existing') {
                // Chuyển sang existing: xóa productCode, productName, giữ productId nếu có
                newItems[index] = {
                    ...newItems[index],
                    productSource: 'existing',
                    productCode: '',
                    productName: '',
                    specification: '',
                    uom: ''
                };
            } else {
                // Chuyển sang new: xóa productId, giữ productCode, productName nếu đã nhập
                newItems[index] = {
                    ...newItems[index],
                    productSource: 'new',
                    productId: null,
                    estimatedUnitPrice: 0
                };
            }
            return {
                ...prev,
                items: newItems
            };
        });
    };

    // ==================== VALIDATION ====================
    /**
     * Validate toàn bộ form trước khi submit
     * 
     * VALIDATION RULES (khớp với Backend):
     * - purpose: required
     * - items: required, min 1 item
     * 
     * ITEM VALIDATION RULES:
     * - productId: required
     * - requestedQty: required, > 0
     * - deliveryDate: required
     * 
     * @returns {Object} Object chứa các lỗi validation (key: field name, value: error message)
     */
    const validateAllFields = () => {
        const errors = {};

        // Validate Purchase Requisition fields
        // Phòng ban là bắt buộc
        if (!formData.departmentId) {
            errors.departmentId = 'Phòng ban là bắt buộc';
        }

        // Ngày cần hàng là bắt buộc
        if (!formData.neededBy) {
            errors.neededBy = 'Ngày cần hàng là bắt buộc';
        }

        if (formData.items.length === 0) {
            errors.items = 'Phải có ít nhất một sản phẩm';
        }

        // Validate items - matching BE ItemRequestDTO validation
        formData.items.forEach((item, index) => {
            const productSource = item.productSource || 'existing';
            
            // Validate sản phẩm: nếu existing thì cần productId, nếu new thì cần productCode và productName
            if (productSource === 'existing') {
                if (!item.productId) {
                    errors[`item_${index}_productId`] = 'Vui lòng chọn sản phẩm từ danh sách';
                }
            } else {
                if (!item.productCode || item.productCode.trim() === '') {
                    errors[`item_${index}_productCode`] = 'Mã sản phẩm là bắt buộc';
                }
                if (!item.productName || item.productName.trim() === '') {
                    errors[`item_${index}_productName`] = 'Tên sản phẩm là bắt buộc';
                }
            }
            
            if (!item.requestedQty || Number(item.requestedQty) <= 0) {
                errors[`item_${index}_requestedQty`] = 'Số lượng phải lớn hơn 0';
            }
            if (!item.deliveryDate) {
                errors[`item_${index}_deliveryDate`] = 'Ngày giao hàng là bắt buộc';
            }
        });

        return errors;
    };

    // ==================== FORM SUBMISSION ====================
    /**
     * Xử lý submit form (tạo mới hoặc cập nhật phiếu yêu cầu)
     * 
     * FLOW:
     * 1. Validate toàn bộ form
     * 2. Prepare data theo format Backend RequestDTO
     * 3. Call API create/update
     * 4. Navigate về list page nếu thành công
     * 
     * DATA MAPPING TO BACKEND:
     * - requesterId: từ currentUser (JWT token)
     * - department: string, required
     * - neededBy: date (ISO format YYYY-MM-DD)
     * - purpose: string, required
     * - approvalStatus: enum (Pending/Approved/Rejected)
     * - approverId: number, nullable
     * - totalEstimated: tự động tính từ items
     * - status: enum (Open/Closed/Cancelled)
     * - items: array of PurchaseRequisitionItemRequestDTO
     * 
     * @param {Event} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validate form
        const errors = validateAllFields();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            toast.error('Vui lòng kiểm tra lại thông tin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            setLoading(true);
            
            // 2. Prepare data theo format Backend RequestDTO
            const submitData = {
                requesterId: formData.requesterId,
                departmentId: formData.departmentId || null,
                purpose: formData.purpose.trim(),
                justification: formData.justification?.trim() || null,
                neededBy: formData.neededBy ? formData.neededBy.toISOString().split('T')[0] : null,
                priority: formData.priority || 'Medium',
                currencyCode: formData.currencyCode || 'VND',
                approvalStatus: formData.approvalStatus || 'Draft',
                approverId: formData.approverId || null,
                approvalRemarks: formData.approvalRemarks?.trim() || null,
                status: formData.status || 'Open',
                items: formData.items.map(item => {
                    // Chuẩn bị item data cho backend
                    // productSource chỉ dùng ở frontend, không gửi lên backend
                    const itemData = {
                        productId: item.productId || null,
                        productCode: item.productCode?.trim() || null,
                        productName: item.productName?.trim() || null,
                        specification: item.specification?.trim() || null,
                        uom: item.uom?.trim() || null,
                        requestedQty: parseFloat(item.requestedQty) || 0,
                        estimatedUnitPrice: parseFloat(item.estimatedUnitPrice) || 0,
                        deliveryDate: item.deliveryDate ? item.deliveryDate.toISOString().split('T')[0] : null,
                        note: item.note?.trim() || null
                    };
                    
                    // Nếu là sản phẩm mới (không có productId), đảm bảo có productCode và productName
                    if (!itemData.productId) {
                        // Backend sẽ lưu productCode và productName trực tiếp
                        if (!itemData.productCode || !itemData.productName) {
                            // Validation đã được xử lý ở validateAllFields, nhưng đảm bảo ở đây
                            console.warn(`Item ${item.index} thiếu productCode hoặc productName`);
                        }
                    }
                    
                    return itemData;
                })
            };

            // 3. Call API
            if (isEdit) {
                await purchaseRequisitionService.updateRequisition(id, submitData);
                toast.success('Cập nhật phiếu yêu cầu thành công!');
            } else {
                await purchaseRequisitionService.createRequisition(submitData);
                toast.success('Tạo phiếu yêu cầu thành công!');
            }
            
            // 4. Navigate về list page
            navigate('/purchase-requisitions');
        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi dữ liệu';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ==================== RENDER ====================
    // Loading screen khi đang load dữ liệu edit
    if (loading && isEdit) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* ==================== HEADER ==================== */}
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
                {/* ==================== PURCHASE REQUISITION INFORMATION ==================== */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin phiếu yêu cầu</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mã phiếu yêu cầu - Auto-generated, readonly */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã phiếu
                            </label>
                            <input
                                type="text"
                                value={requisitionNo}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                readOnly
                                title="Mã phiếu được tự động sinh bởi hệ thống (format: PR-YYYY-XXX)"
                            />
                        </div>

                        {/* Người yêu cầu - Lấy từ JWT token, readonly */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Người yêu cầu
                            </label>
                            <input
                                type="text"
                                value={getUserDisplayName(currentUser)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                readOnly
                                title="Người yêu cầu là user đang đăng nhập"
                            />
                        </div>

                        {/* Phòng ban - Required */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phòng ban <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.departmentId || ''}
                                onChange={(e) => handleInputChange('departmentId', e.target.value ? parseInt(e.target.value) : null)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.departmentId ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">-- Chọn phòng ban --</option>
                                {departments.map(dept => (
                                    <option key={dept.id || dept.departmentId} value={dept.id || dept.departmentId}>
                                        {dept.departmentName || dept.name}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.departmentId && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.departmentId}</p>
                            )}
                        </div>

                        {/* Ngày cần hàng - Required */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày cần hàng <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.neededBy}
                                onChange={(date) => handleInputChange('neededBy', date)}
                                dateFormat="dd/MM/yyyy"
                                minDate={new Date()}
                                className={`w-full px-3 py-2 border rounded-md ${validationErrors.neededBy ? 'border-red-500' : 'border-gray-300'}`}
                                placeholderText="Chọn ngày"
                            />
                            {validationErrors.neededBy && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.neededBy}</p>
                            )}
                        </div>

                        {/* Độ ưu tiên */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Độ ưu tiên
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => handleInputChange('priority', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Low">Thấp</option>
                                <option value="Medium">Trung bình</option>
                                <option value="High">Cao</option>
                                <option value="Urgent">Khẩn cấp</option>
                            </select>
                        </div>

                        {/* Mã tiền tệ */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã tiền tệ
                            </label>
                            <input
                                type="text"
                                value={formData.currencyCode}
                                onChange={(e) => handleInputChange('currencyCode', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="VND"
                            />
                        </div>

                        {/* Trạng thái duyệt - Chỉ hiển thị khi edit */}
                        {isEdit && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái duyệt
                                </label>
                                <select
                                    value={formData.approvalStatus}
                                    onChange={(e) => handleInputChange('approvalStatus', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Draft">Nháp</option>
                                    <option value="Pending">Chờ duyệt</option>
                                    <option value="Approved">Đã duyệt</option>
                                    <option value="Rejected">Từ chối</option>
                                    <option value="Cancelled">Hủy</option>
                                </select>
                            </div>
                        )}

                        {/* Trạng thái phiếu - Chỉ hiển thị khi edit */}
                        {isEdit && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái phiếu
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Open">Mở</option>
                                    <option value="Closed">Đóng</option>
                                    <option value="Converted">Đã chuyển đổi</option>
                                    <option value="Cancelled">Hủy</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Note/Ghi chú - Optional field, TEXT */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú
                        </label>
                        <textarea
                            value={formData.purpose}
                            onChange={(e) => handleInputChange('purpose', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ghi chú (tùy chọn)"
                        />
                    </div>

                    {/* Ghi chú duyệt - Chỉ hiển thị khi edit */}
                    {isEdit && formData.approvalRemarks && (
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú duyệt
                            </label>
                            <textarea
                                value={formData.approvalRemarks}
                                readOnly
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            />
                        </div>
                    )}
                </div>

                {/* ==================== PRODUCT ITEMS TABLE ==================== */}
                {/* 
                    Bảng danh sách sản phẩm trong phiếu yêu cầu
                    
                    COLUMNS:
                    - #: STT
                    - Sản phẩm: Dropdown chọn product (required)
                    - Số lượng: requested_qty (required, > 0)
                    - Ngày giao hàng: delivery_date (required)
                    - Giá ước tính: valuation_price
                    - Đơn vị giá: price_unit (default 1)
                    - Thành tiền: auto-calculated (qty × valuationPrice × priceUnit)
                    - Ghi chú: note
                    - Thao tác: Nút xóa item
                */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Danh sách sản phẩm</h2>
                        <div className="flex gap-2">
                            {/* Nút Import Excel */}
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                title="Import danh sách sản phẩm từ Excel"
                            >
                                Import Excel
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleExcelImport}
                                className="hidden"
                            />
                            {/* Nút Thêm sản phẩm manual */}
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                title="Thêm sản phẩm mới vào danh sách"
                            >
                                Thêm sản phẩm
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
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 w-12">
                                            #
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 min-w-[280px]">
                                            Sản phẩm <span className="text-red-500">*</span>
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 min-w-[150px]">
                                            Mô tả
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 w-32">
                                            Đơn vị tính
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 w-28">
                                            Số lượng <span className="text-red-500">*</span>
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 w-36">
                                            Ngày giao hàng <span className="text-red-500">*</span>
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 w-36">
                                            Đơn giá ước tính
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 w-36">
                                            Thành tiền
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 min-w-[120px]">
                                            Ghi chú
                                        </th>
                                        <th className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50 w-20">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => {
                                        const productSource = item.productSource || 'existing';
                                        return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-200 px-3 py-3 text-sm text-gray-700 text-center font-medium">
                                                {index + 1}
                                            </td>
                                            <td className="border border-gray-200 px-3 py-3 align-top">
                                                {/* Toggle chọn loại sản phẩm - Compact design */}
                                                <div className="mb-2 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleProductSourceChange(index, 'existing')}
                                                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                                            productSource === 'existing'
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        Từ kho
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleProductSourceChange(index, 'new')}
                                                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                                            productSource === 'new'
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        Nhập mới
                                                    </button>
                                                </div>

                                                {/* Hiển thị dropdown nếu chọn "Sản phẩm có sẵn" */}
                                                {productSource === 'existing' ? (
                                                    <div>
                                                        <Select
                                                            value={products.find(option => {
                                                                const optionValue = Number(option.value);
                                                                const itemValue = Number(item.productId);
                                                                return optionValue === itemValue && !isNaN(optionValue) && !isNaN(itemValue);
                                                            }) || null}
                                                            onChange={(selectedOption) => handleProductSelect(index, selectedOption)}
                                                            options={products}
                                                            placeholder="Chọn sản phẩm..."
                                                            className="text-sm"
                                                            menuPortalTarget={document.body}
                                                            menuPosition="fixed"
                                                            menuShouldScrollIntoView={false}
                                                            styles={{
                                                                control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                menu: (base) => ({ ...base, zIndex: 9999 }),
                                                            }}
                                                        />
                                                        {validationErrors[`item_${index}_productId`] && (
                                                            <p className="text-red-500 text-xs mt-1">{validationErrors[`item_${index}_productId`]}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* Hiển thị input fields nếu chọn "Sản phẩm mới" */
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={item.productCode || ''}
                                                            onChange={(e) => handleItemChange(index, 'productCode', e.target.value)}
                                                            placeholder="Mã sản phẩm *"
                                                            className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${validationErrors[`item_${index}_productCode`] ? 'border-red-500' : 'border-gray-300'}`}
                                                        />
                                                        {validationErrors[`item_${index}_productCode`] && (
                                                            <p className="text-red-500 text-xs mt-0.5">{validationErrors[`item_${index}_productCode`]}</p>
                                                        )}
                                                        <input
                                                            type="text"
                                                            value={item.productName || ''}
                                                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                                            placeholder="Tên sản phẩm *"
                                                            className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${validationErrors[`item_${index}_productName`] ? 'border-red-500' : 'border-gray-300'}`}
                                                        />
                                                        {validationErrors[`item_${index}_productName`] && (
                                                            <p className="text-red-500 text-xs mt-0.5">{validationErrors[`item_${index}_productName`]}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            {/* Mô tả */}
                                            <td className="border border-gray-200 px-3 py-3 align-top">
                                                <input
                                                    type="text"
                                                    value={item.specification || ''}
                                                    onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                                                    placeholder={productSource === 'new' ? "VD: Hộp 12 chai..." : "Mô tả sản phẩm"}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    title="Mô tả về sản phẩm: đóng gói, kích thước, thông số kỹ thuật"
                                                />
                                            </td>
                                            {/* Đơn vị tính */}
                                            <td className="border border-gray-200 px-3 py-3 align-top">
                                                <input
                                                    type="text"
                                                    value={item.uom || ''}
                                                    onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                                                    placeholder={productSource === 'new' ? "VD: Chai, Gói..." : "ĐVT"}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    title="Đơn vị tính của sản phẩm"
                                                />
                                            </td>
                                            {/* Số lượng */}
                                            <td className="border border-gray-200 px-3 py-3 align-top">
                                                <input
                                                    type="text"
                                                    value={formatNumber(item.requestedQty)}
                                                    onChange={(e) => handleQtyChange(index, e.target.value)}
                                                    className={`w-full px-2 py-1.5 border rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${validationErrors[`item_${index}_requestedQty`] ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="0"
                                                />
                                                {validationErrors[`item_${index}_requestedQty`] && (
                                                    <p className="text-red-500 text-xs mt-0.5">{validationErrors[`item_${index}_requestedQty`]}</p>
                                                )}
                                            </td>
                                            {/* Ngày giao hàng */}
                                            <td className="border border-gray-200 px-3 py-3 align-top">
                                                <DatePicker
                                                    selected={item.deliveryDate}
                                                    onChange={(date) => handleItemChange(index, 'deliveryDate', date)}
                                                    dateFormat="dd/MM/yyyy"
                                                    minDate={new Date()}
                                                    className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${validationErrors[`item_${index}_deliveryDate`] ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholderText="Chọn ngày"
                                                />
                                                {validationErrors[`item_${index}_deliveryDate`] && (
                                                    <p className="text-red-500 text-xs mt-0.5">{validationErrors[`item_${index}_deliveryDate`]}</p>
                                                )}
                                            </td>
                                            {/* Đơn giá ước tính */}
                                            <td className="border border-gray-200 px-3 py-3 align-top">
                                                <input
                                                    type="text"
                                                    value={formatNumber(item.estimatedUnitPrice)}
                                                    onChange={(e) => handleEstimatedUnitPriceChange(index, e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            {/* Thành tiền */}
                                            <td className="border border-gray-200 px-3 py-3 align-top text-sm font-medium text-gray-900">
                                                {formatCurrency((Number(item.requestedQty || 0) * Number(item.estimatedUnitPrice || 0)))}
                                            </td>
                                            {/* Ghi chú */}
                                            <td className="border border-gray-200 px-3 py-3 align-top">
                                                <input
                                                    type="text"
                                                    value={item.note || ''}
                                                    onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Ghi chú"
                                                />
                                            </td>
                                            {/* Thao tác */}
                                            <td className="border border-gray-200 px-3 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                    title="Xóa sản phẩm này"
                                                >
                                                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
                            {/* Tổng giá trị phiếu */}
                            <div className="flex justify-end mt-3">
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Tổng giá trị</div>
                                    <div className="text-lg font-semibold">{formatCurrency(totalValue)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ==================== ACTION BUTTONS ==================== */}
                <div className="flex justify-end gap-4">
                    {/* Nút Hủy - quay về list page */}
                    <button
                        type="button"
                        onClick={() => navigate('/purchase-requisitions')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                        Hủy
                    </button>
                    {/* Nút Submit - tạo mới hoặc cập nhật */}
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
