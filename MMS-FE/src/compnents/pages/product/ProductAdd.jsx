import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUpload, faImage, faPlus, faSpinner, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { getCategories } from '../../../api/categoryService';
import { createProduct, uploadProductImage } from '../../../api/productService';
import { toast } from 'react-toastify';

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

const ProductAdd = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        purchasePrice: '',
        sellingPrice: '',
        categoryId: '',
        uom: '',
        size: '',
        status: 'IN_STOCK',
        image_url: null,
        imageFile: null, // Lưu file object để upload
        sku: ''
    });
    // ============ State ============
    const [categories, setCategories] = useState([]);

    // ============ Effects ============
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data || []);
            } catch (error) {
                console.error("Lỗi khi tải danh mục:", error);
            }
        };
        fetchCategories();
    }, []);

    // ============ Event Handlers ============
    /**
     * Xử lý thay đổi giá trị input
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /**
     * Xử lý upload ảnh sản phẩm
     * Validate file type và size, đọc file thành base64 để preview
     */
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
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
                    setFormData(prev => ({
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
        }
    };

    /**
     * Xử lý submit form thêm sản phẩm mới
     * Validate dữ liệu, upload ảnh nếu có, sau đó gọi API tạo sản phẩm
     */
    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.warning('Vui lòng nhập tên sản phẩm!');
      return;
    }
    if (!formData.categoryId) {
      toast.warning('Vui lòng chọn danh mục sản phẩm!');
      return;
    }

    /**
     * Helper để parse số thực an toàn
     * Loại bỏ ký tự đặc biệt, chỉ giữ số và dấu chấm
     * @param {string|number} value - Giá trị cần parse
     * @returns {number|null} - Số thực đã parse hoặc null nếu không hợp lệ
     */
    const parseFloatSafe = (value) => {
      if (!value || value === '') return null;
      const cleaned = String(value).replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
    };
    
    /**
     * Helper để parse số nguyên an toàn
     * Loại bỏ ký tự đặc biệt, chỉ giữ số
     * @param {string|number} value - Giá trị cần parse
     * @returns {number|null} - Số nguyên đã parse hoặc null nếu không hợp lệ
     */
    const parseIntSafe = (value) => {
      if (!value || value === '') return null;
      const cleaned = String(value).replace(/[^\d]/g, '');
      const parsed = parseInt(cleaned, 10);
      return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
    };
    
    // Chuẩn hóa dữ liệu trước khi gửi - đảm bảo các field bắt buộc có giá trị hợp lệ
    const newProduct = {
      // Field bắt buộc (@NotBlank/@NotNull)
      sku: (formData.sku || `PRD${Date.now()}`).trim(),
      name: formData.name.trim(),
      uom: (formData.uom || '').trim(),
      size: parseFloatSafe(formData.size),
      purchasePrice: parseFloatSafe(formData.purchasePrice),
      sellingPrice: parseFloatSafe(formData.sellingPrice),
      categoryId: parseIntSafe(formData.categoryId),
      
      // Field không bắt buộc
      description: formData.description?.trim() || null,

      // Chỉ gửi imageUrl nếu không phải base64 (data:image/...)
      // Base64 quá dài (>255 ký tự) sẽ vi phạm validation
      imageUrl: (formData.imageUrl || formData.image_url) && 
                !(formData.imageUrl || formData.image_url).startsWith('data:image/') 
                ? (formData.imageUrl || formData.image_url) 
                : null,
      status: formData.status || 'IN_STOCK',
    };
    
    // Validate các field bắt buộc trước khi gửi
    if (!newProduct.uom || newProduct.uom === '') {
      toast.warning('Vui lòng nhập đơn vị tính (UOM)!');
      return;
    }
    if (!newProduct.size || newProduct.size <= 0) {
      toast.warning('Vui lòng nhập kích cỡ hợp lệ (phải lớn hơn 0)!');
      return;
    }
    if (!newProduct.purchasePrice || newProduct.purchasePrice <= 0) {
      toast.warning('Vui lòng nhập giá vốn hợp lệ (phải lớn hơn 0)!');
      return;
    }
    if (!newProduct.sellingPrice || newProduct.sellingPrice <= 0) {
      toast.warning('Vui lòng nhập giá bán hợp lệ (phải lớn hơn 0)!');
      return;
    }
    if (!newProduct.categoryId) {
      toast.warning('Vui lòng chọn danh mục sản phẩm!');
      return;
    }

    console.log('Đang tạo sản phẩm:', newProduct);
    try {
      // Nếu có file ảnh (base64), upload trước để lấy URL ngắn
      let finalImageUrl = newProduct.imageUrl;
      if (formData.imageFile && (formData.imageUrl || formData.image_url)?.startsWith('data:image/')) {
        try {
          const uploadResponse = await uploadProductImage(formData.imageFile);
          finalImageUrl = uploadResponse.imageUrl;
          newProduct.imageUrl = finalImageUrl;
        } catch (uploadError) {
          console.error('Lỗi khi upload ảnh:', uploadError);
          newProduct.imageUrl = null;
        }
      }
      
      const response = await createProduct(newProduct);
      toast.success('Thêm sản phẩm thành công!');
      onSave(response);
      onClose();
    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm:', error);
      console.error('Phản hồi lỗi:', error?.response?.data);
      
      // Hiển thị lỗi chi tiết từ backend
      let apiMessage = 'Thêm mới thất bại, vui lòng thử lại!';
      
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
            apiMessage = `Thêm mới thất bại: ${fieldName} ${message}`;
          }
        } else if (errorData.error) {
          // Kiểm tra nếu là lỗi trùng (duplicate)
          if (errorData.error.includes('trùng')) {
            apiMessage = `Thêm mới thất bại: ${errorData.error}`;
          } else {
            apiMessage = `Thêm mới thất bại: ${errorData.error}`;
          }
        } else if (errorData.message) {
          apiMessage = `Thêm mới thất bại: ${errorData.message}`;
        }
      } else if (error?.message) {
        apiMessage = `Thêm mới thất bại: ${error.message}`;
      }
      
      toast.error(apiMessage);
    }
  };

    // ============ Render ============
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-5xl my-8 mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Thêm sản phẩm mới</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
                    </button>
                </div>

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
                                placeholder="Nhập tên sản phẩm"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                                required
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
                                placeholder=""
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Danh mục <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                                required
                                onInvalid={(e) => {
                                    e.target.setCustomValidity('Vui lòng chọn danh mục sản phẩm');
                                }}
                                onInput={(e) => {
                                    e.target.setCustomValidity('');
                                }}
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(category => (
                                    <option key={category.categoryId} value={category.categoryId}>
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
                                placeholder=""
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
                                placeholder=""
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                            >
                                <option value="IN_STOCK">Còn hàng</option>
                                <option value="OUT_OF_STOCK">Hết hàng</option>
                                <option value="DISCONTINUED">Ngừng kinh doanh</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán</label>
                            <input
                                type="number"
                                name="sellingPrice"
                                value={formData.sellingPrice}
                                onChange={handleChange}
                                placeholder="0"
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
                                placeholder="0"
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
                            placeholder="Nhập mô tả sản phẩm"
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
                                            setFormData(prev => ({
                                                ...prev,
                                                imageUrl: null,
                                                image_url: null,
                                                imageFile: null
                                            }));
                                            toast.warning('Ảnh không hợp lệ, vui lòng chọn lại!');
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-6">
                                    <FontAwesomeIcon icon={faImage} className="w-12 h-12 mb-2" />
                                    <p className="text-sm">Tải ảnh sản phẩm lên (Tối đa 2MB)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                    <button
                        type="submit"
                        className="group flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700"
                    >
                        <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="group-hover:font-medium transition-all duration-200">Tạo sản phẩm</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="group px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:scale-105 hover:shadow-sm"
                    >
                        <span className="group-hover:font-medium transition-all duration-200">Hủy</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
    );
};

export default ProductAdd;