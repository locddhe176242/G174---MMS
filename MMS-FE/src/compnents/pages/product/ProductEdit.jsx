import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faFloppyDisk, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getCategories } from '../../../api/categoryService';
import { getProductById, updateProduct, uploadProductImage } from '../../../api/productService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Helper function để xử lý image URL (giống UserProfile)
 * Xử lý base64, relative path, và full URL
 * @param {string} imageUrl - URL ảnh (base64, relative path, hoặc full URL)
 * @returns {string|null} - URL ảnh đầy đủ hoặc null
 */
const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // Nếu là base64 (data:image/...), dùng trực tiếp
    if (imageUrl.startsWith('data:image/')) {
        return imageUrl;
    }
    // Nếu là relative path (/uploads/...), thêm base URL
    if (imageUrl.startsWith('/uploads/')) {
        return `http://localhost:8080${imageUrl}`;
    }
    // Nếu đã có http/https, dùng trực tiếp
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    // Mặc định thêm base URL
    return `http://localhost:8080${imageUrl}`;
};

const ProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        purchasePrice: '',
        sellingPrice: '',
        categoryId: '',
        uom: '',
        size: '',
        status: 'IN_STOCK',
        imageUrl: null,
        imageFile: null, // Lưu file object để upload
        sku: ''
    });

    // ============ State ============
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // ============ Effects ============
    useEffect(() => {
        const fetchProductAndCategories = async () => {
            try {
                setFetching(true);
                // Fetch product data
                const productData = await getProductById(id);
                setProduct(productData);
                
                // Set form data from product
                setFormData({
                    name: productData?.name || '',
                    description: productData?.description || '',
                    purchasePrice: productData?.purchasePrice || '',
                    sellingPrice: productData?.sellingPrice || '',
                    categoryId: productData?.categoryId ? String(productData.categoryId) : '',
                    uom: productData?.uom || '',
                    size: productData?.size || '',
                    status: productData?.status || 'IN_STOCK',
                    imageUrl: productData?.imageUrl || productData?.image_url || null,
                    imageFile: null,
                    sku: productData?.sku || ''
                });

                // Fetch categories
                const categoriesData = await getCategories();
                setCategories(categoriesData || []);
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm:', error);
                toast.error('Không thể tải thông tin sản phẩm!');
                navigate('/products');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchProductAndCategories();
        }
    }, [id, navigate]);

    // ============ Event Handlers ============
    /**
     * Xử lý thay đổi giá trị input
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * Xử lý upload ảnh sản phẩm
     * Validate file type và size, đọc file thành base64 để preview
     */
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.warning('File phải là hình ảnh!');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.warning('Kích thước ảnh không được vượt quá 2MB');
            return;
        }

        // Lưu file object để upload sau
        const reader = new FileReader();
        reader.onerror = () => {
            console.error('Lỗi khi đọc file:', reader.error);
            toast.error('Lỗi khi đọc file ảnh!');
        };
        reader.onloadend = () => {
            if (reader.result) {
                console.log('Đọc file thành công, kích thước base64:', reader.result.length);
                setFormData((prev) => ({ 
                    ...prev, 
                    imageUrl: reader.result,
                    image_url: reader.result, // Giữ để hiển thị
                    imageFile: file // Lưu file object để upload
                }));
            } else {
                console.error('Không đọc được file');
                toast.error('Không đọc được file ảnh!');
            }
        };
        reader.readAsDataURL(file);
    };

    /**
     * Xử lý submit form cập nhật sản phẩm
     * Validate dữ liệu, upload ảnh mới nếu có, sau đó gọi API cập nhật sản phẩm
     * Chỉ gửi các field có giá trị (partial update)
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Chuẩn hóa dữ liệu trước khi gửi - chỉ gửi field có giá trị (UPDATE chỉ cần field cần update)
            const payload = {};
            
            // Chỉ thêm field nếu có giá trị (mapper sẽ chỉ update field không null)
            if (formData.name && formData.name.trim()) payload.name = formData.name.trim();
            if (formData.sku && formData.sku.trim()) payload.sku = formData.sku.trim();
            if (formData.uom && formData.uom.trim()) payload.uom = formData.uom.trim();
            if (formData.description !== undefined) payload.description = formData.description?.trim() || null;

            
            // Parse số - chỉ gửi nếu có giá trị hợp lệ
            if (formData.size && formData.size !== '' && !isNaN(parseFloat(formData.size))) {
                const sizeValue = parseFloat(formData.size);
                if (sizeValue > 0) payload.size = sizeValue;
            }
            if (formData.purchasePrice && formData.purchasePrice !== '' && !isNaN(parseFloat(formData.purchasePrice))) {
                const priceValue = parseFloat(formData.purchasePrice);
                if (priceValue > 0) payload.purchasePrice = priceValue;
            }
            if (formData.sellingPrice && formData.sellingPrice !== '' && !isNaN(parseFloat(formData.sellingPrice))) {
                const priceValue = parseFloat(formData.sellingPrice);
                if (priceValue > 0) payload.sellingPrice = priceValue;
            }
            if (formData.categoryId && formData.categoryId !== '') {
                const catId = parseInt(formData.categoryId);
                if (!isNaN(catId)) payload.categoryId = catId;
            }
            
            // Xử lý ảnh: nếu có file mới (base64), upload trước để lấy URL ngắn
            let finalImageUrl = null;
            if (formData.imageFile && (formData.imageUrl || formData.image_url)?.startsWith('data:image/')) {
                // Có file mới cần upload
                try {
                    const uploadResponse = await uploadProductImage(formData.imageFile);
                    finalImageUrl = uploadResponse.imageUrl;
                    payload.imageUrl = finalImageUrl;
                } catch (uploadError) {
                    console.error('Lỗi khi upload ảnh:', uploadError);
                    // Không set imageUrl, giữ nguyên ảnh cũ
                }
            } else if (formData.imageUrl || formData.image_url) {
                // Ảnh đã có (URL từ server), chỉ gửi nếu không phải base64
                const currentImageUrl = formData.imageUrl || formData.image_url;
                if (!currentImageUrl.startsWith('data:image/')) {
                    // Nếu là relative path, giữ nguyên
                    // Nếu là full URL, chuyển về relative path
                    if (currentImageUrl.startsWith('http://localhost:8080')) {
                        payload.imageUrl = currentImageUrl.replace('http://localhost:8080', '');
                    } else {
                        payload.imageUrl = currentImageUrl;
                    }
                }
                // Nếu là base64, bỏ qua (không gửi)
            }
            
            // Không cho cập nhật trạng thái
            // if (formData.status) payload.status = formData.status;
            
            console.log('Dữ liệu gửi đi:', payload);
            const response = await updateProduct(id, payload);
            toast.success('Cập nhật sản phẩm thành công!');
            navigate('/products');
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error);
            console.error('Phản hồi lỗi:', error?.response?.data);
            
            // Hiển thị lỗi chi tiết từ backend
            let errorMessage = 'Cập nhật thất bại, vui lòng thử lại!';
            
            if (error?.response?.data) {
                const errorData = error.response.data;
                
                // Nếu có validation errors từ backend (MethodArgumentNotValidException)
                if (errorData.errors && typeof errorData.errors === 'object') {
                    const firstError = Object.entries(errorData.errors)[0];
                    if (firstError) {
                        const [field, message] = firstError;
                        const fieldNames = {
                            'name': 'Tên sản phẩm',
                            'sku': 'SKU',
                            'uom': 'Đơn vị tính',
                            'size': 'Kích cỡ',
                            'purchasePrice': 'Giá vốn',
                            'sellingPrice': 'Giá bán',
                            'categoryId': 'Danh mục',
                            'status': 'Trạng thái',
                            'imageUrl': 'Ảnh sản phẩm'
                        };
                        const fieldName = fieldNames[field] || field;
                        errorMessage = `Cập nhật thất bại: ${fieldName} ${message}`;
                    }
                } else if (errorData.error) {
                    // Kiểm tra nếu là lỗi trùng (duplicate)
                    if (errorData.error.includes('trùng')) {
                        errorMessage = `Cập nhật thất bại: ${errorData.error}`;
                    } else {
                        errorMessage = `Cập nhật thất bại: ${errorData.error}`;
                    }
                } else if (errorData.message) {
                    errorMessage = `Cập nhật thất bại: ${errorData.message}`;
                }
            } else if (error?.message) {
                errorMessage = `Cập nhật thất bại: ${error.message}`;
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ============ Render ============
    if (fetching) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-500" />
            </div>
        );
    }

    if (!product) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/products')}
                        className="px-3 py-1.5 rounded border hover:bg-gray-50"
                        title="Quay lại trang trước"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <h1 className="text-2xl font-semibold">Chỉnh sửa sản phẩm</h1>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">

            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tên sản phẩm <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                                onInvalid={(e) => {
                                    e.target.setCustomValidity('Vui lòng nhập tên sản phẩm');
                                }}
                                onInput={(e) => {
                                    e.target.setCustomValidity('');
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map((category) => (
                                    <option key={category.categoryId} value={String(category.categoryId)}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị đo</label>
                            <input
                                type="text"
                                name="uom"
                                value={formData.uom}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kích cỡ</label>
                            <input
                                type="text"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                            <input
                                type="text"
                                name="status"
                                value={formData.status === 'IN_STOCK' ? 'Còn hàng' : formData.status === 'OUT_OF_STOCK' ? 'Hết hàng' : 'Ngừng kinh doanh'}
                                disabled
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue bg-gray-100 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán</label>
                            <input
                                type="number"
                                name="sellingPrice"
                                value={formData.sellingPrice}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                                onInvalid={(e) => {
                                    e.target.setCustomValidity('Giá bán phải lớn hơn hoặc bằng 0');
                                }}
                                onInput={(e) => {
                                    e.target.setCustomValidity('');
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Giá vốn</label>
                            <input
                                type="number"
                                name="purchasePrice"
                                value={formData.purchasePrice}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                                onInvalid={(e) => {
                                    e.target.setCustomValidity('Giá vốn phải lớn hơn hoặc bằng 0');
                                }}
                                onInput={(e) => {
                                    e.target.setCustomValidity('');
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh sản phẩm</label>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white hover:border-brand-blue transition-all cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {formData.imageUrl || formData.image_url ? (
                                <div className="relative w-full h-48">
                                    <img
                                        src={getImageUrl(formData.imageUrl || formData.image_url)}
                                        alt="Preview"
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => {
                                            console.error('Lỗi khi load ảnh:', e.target.src?.substring(0, 100));
                                            toast.warning('Ảnh không hợp lệ!');
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-6">
                                    <FontAwesomeIcon icon={faImage} className="w-12 h-12 mb-2" />
                                    <p className="text-sm">Tải ảnh sản phẩm</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                    <button
                        type="submit"
                        disabled={loading}
                        className="group flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700 disabled:hover:scale-100"
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                                <span>Đang cập nhật...</span>
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                <span className="group-hover:font-medium transition-all duration-200">Cập nhật sản phẩm</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        disabled={loading}
                        className="group px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-all duration-200 hover:scale-105 hover:shadow-sm disabled:hover:scale-100"
                    >
                        <span className="group-hover:font-medium transition-all duration-200">Hủy</span>
                    </button>
                </div>
            </form>
            </div>
        </div>
    );
};

export default ProductEdit;