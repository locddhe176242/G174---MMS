import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Plus, Sparkles } from 'lucide-react';
import { getCategories } from '../../../api/categoryService'; 
import { createProduct } from '../../../api/productService';

const ProductAdd = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        description: '',
        purchasePrice: '',
        sellingPrice: '',
        categoryId: '',
        uom: '',
        status: 'IN_STOCK',
        quantity: '',
        image_url: null,
        size: '',
        sku: ''
    });
    const [categories, setCategories] = useState([]);

     useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data || []);
            } catch (error) {
                console.error("❌ Lỗi khi tải danh mục:", error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newProduct = {
            sku: formData.barcode || `PRD${Date.now()}`,
            created_at: new Date().toLocaleDateString('vi-VN'),
            ...formData
        };
        try {
            // Gọi API lưu sản phẩm
            const response = await createProduct(newProduct);
            console.log('✅ Thêm sản phẩm thành công:', response);
            onSave(response); // cập nhật state parent nếu cần
            onClose(); // đóng modal
        } catch (error) {
            console.error('❌ Lỗi khi tạo sản phẩm:', error);
            alert('Tạo sản phẩm thất bại, thử lại!');
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Kích thước ảnh không được vượt quá 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image_url: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Premium Header with Gradient */}
            <div className="relative px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                Thêm sản phẩm
                            </h2>
                            <p className="text-sm text-gray-600 mt-0.5">Tạo sản phẩm mới trong hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 group"
                    >
                        <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:rotate-90 transition-all duration-200" />
                    </button>
                </div>
            </div>

            {/* Form Content with Custom Scrollbar */}
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto px-8 py-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Info Section */}
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200/50">
                                <div className="flex items-center gap-2 mb-5">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-base font-semibold text-gray-800">Thông tin sản phẩm</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tên sản phẩm <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm transition-all duration-200"
                                            placeholder="Nhập tên sản phẩm (tối đa 300 ký tự)"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mã vạch/Barcode</label>
                                        <input
                                            type="text"
                                            name="barcode"
                                            value={formData.barcode}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm transition-all duration-200"
                                            placeholder="Nhập mã vạch"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200/50">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="5"
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm resize-none transition-all duration-200"
                                    placeholder="Nhập mô tả sản phẩm"
                                />
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl p-6 border border-gray-200/50">
                                <h3 className="text-base font-semibold text-gray-800 mb-5">Thông tin</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị đo</label>
                                        <input
                                            type="text"
                                            name="uom"
                                            value={formData.uom}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-sm transition-all duration-200"
                                            placeholder="VD:  cái, thùng, mét, kg, gói, v.v."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                                        <input
                                            type="text"
                                            name="size"
                                            value={formData.size}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-sm transition-all duration-200"
                                            placeholder="Theo đơn vị đo lường"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-sm transition-all duration-200"
                                            placeholder="Phải Unique"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                        <input
                                            type="text"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-sm transition-all duration-200"
                                            placeholder="Phải Unique"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-sm transition-all duration-200 cursor-pointer"
                                        >
                                            <option value="IN_STOCK">In Stock</option>
                                            <option value="OUT_OF_STOCK">Out of Stock</option>
                                            <option value="DISCONTINUED">Discontinued</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl p-6 border border-gray-200/50">
                                <h3 className="text-base font-semibold text-gray-800 mb-5">Giá</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="sellingPrice"
                                                value={formData.sellingPrice}
                                                onChange={handleChange}
                                                className="w-full pl-4 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-sm text-right transition-all duration-200"
                                                placeholder="0"
                                                min="0"
                                            />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">đ</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Giá vốn</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="purchasePrice"
                                                value={formData.purchasePrice}
                                                onChange={handleChange}
                                                className="w-full pl-4 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-sm text-right transition-all duration-200"
                                                placeholder="0"
                                                min="0"
                                            />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Right Column - Image & Category */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Image Upload */}
                            <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-6 border border-gray-200/50">
                                <h3 className="text-base font-semibold text-gray-800 mb-4">Ảnh sản phẩm</h3>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white hover:border-blue-400 transition-all duration-300 group cursor-pointer aspect-square">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {formData.imageUrl ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={formData.imageUrl}
                                                alt="Preview"
                                                className="w-full h-full object-contain p-4"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                                                <div className="text-white text-sm font-medium flex items-center gap-2">
                                                    <Upload className="w-4 h-4" />
                                                    Thay đổi ảnh
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <ImageIcon className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">Tải ảnh sản phẩm lên</p>
                                            <p className="text-xs text-gray-500">(Tối đa 2MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Category */}
                            <div className="bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-xl p-6 border border-gray-200/50">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 text-sm transition-all duration-200 cursor-pointer appearance-none"
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(category => (
                                        <option key={category.categoryId} value={category.categoryId}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 flex items-center gap-2 hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm sản phẩm
                    </button>
                </div>
            </form>

            <style jsx>{`
                /* Custom Scrollbar */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 8px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #3b82f6, #6366f1);
                    border-radius: 10px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #2563eb, #4f46e5);
                }
            `}</style>
        </div>
    );
};

export default ProductAdd;