import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Save, Sparkles } from 'lucide-react';
import { getCategories } from '../../../api/categoryService';
import { updateProduct } from '../../../api/productService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductEdit = ({ product, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        barcode: product?.barcode || product?.sku || '',
        description: product?.description || '',
        purchasePrice: product?.purchasePrice || '',
        sellingPrice: product?.sellingPrice || '',
        categoryId: product?.categoryId ? String(product.categoryId) : '',
        uom: product?.uom || '',
        size: product.size || '',
        status: product?.status || 'IN_STOCK',
        quantity: product?.quantity || 0,
        image_url: product?.image_url || null,
        sku: product?.sku || ''
    });

    console.log('Product edit data:', product);

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data || []);

                if (product?.categoryId) {
                    const catExists = data.find(
                        (c) => c.categoryId === Number(product.categoryId)
                    );
                    if (catExists) {
                        setFormData((prev) => ({
                            ...prev,
                            categoryId: String(product.categoryId),
                        }));
                    }
                }
            } catch (error) {
                console.error('❌ Lỗi khi tải danh mục:', error);
                toast.error('Không thể tải danh mục sản phẩm!');
            }
        };
        fetchCategories();
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.warning('Kích thước ảnh không được vượt quá 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () =>
            setFormData((prev) => ({ ...prev, image_url: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await updateProduct(product.id, formData);
            toast.success('Cập nhật sản phẩm thành công!');
            onSave(response);
            onClose();
        } catch (error) {
            console.error('❌ Lỗi khi update sản phẩm:', error);
            toast.error('Cập nhật thất bại, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                                <Save className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                    Chỉnh sửa sản phẩm
                                </h2>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Cập nhật thông tin sản phẩm
                                </p>
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

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col h-full"
                >
                    <div
                        className="flex-1 overflow-y-auto px-8 py-6"
                        style={{
                            maxHeight: 'calc(90vh - 180px)',
                            WebkitOverflowScrolling: 'touch',
                            transform: 'translateZ(0)',
                            scrollBehavior: 'smooth',
                        }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Thông tin sản phẩm */}
                                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200/50">
                                    <div className="flex items-center gap-2 mb-5">
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-base font-semibold text-gray-800">
                                            Thông tin sản phẩm
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tên sản phẩm{' '}
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm transition-all duration-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Barcode
                                            </label>
                                            <input
                                                type="text"
                                                name="barcode"
                                                value={formData.barcode}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mô tả */}
                                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200/50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="5"
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm resize-none transition-all duration-200"
                                    />
                                </div>

                                {/* Thông tin giá */}
                                <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl p-6 border border-gray-200/50">
                                    <h3 className="text-base font-semibold text-gray-800 mb-5">
                                        Giá
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Giá bán
                                            </label>
                                            <input
                                                type="number"
                                                name="sellingPrice"
                                                value={formData.sellingPrice}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-sm text-right transition-all duration-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Giá vốn
                                            </label>
                                            <input
                                                type="number"
                                                name="purchasePrice"
                                                value={formData.purchasePrice}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-sm text-right transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin khác */}
                                <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl p-6 border border-gray-200/50">
                                    <h3 className="text-base font-semibold text-gray-800 mb-5">
                                        Thông tin khác
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Đơn vị đo
                                            </label>
                                            <input
                                                type="text"
                                                name="uom"
                                                value={formData.uom}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Size
                                            </label>
                                            <input
                                                type="text"
                                                name="size"
                                                value={formData.size}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                SKU
                                            </label>
                                            <input
                                                type="text"
                                                name="sku"
                                                value={formData.sku}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                name="quantity"
                                                value={formData.quantity}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Trạng thái
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border rounded-xl cursor-pointer"
                                            >
                                                <option value="IN_STOCK">In Stock</option>
                                                <option value="OUT_OF_STOCK">Out of Stock</option>
                                                <option value="DISCONTINUED">Discontinued</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Image Upload */}
                                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-6 border border-gray-200/50">
                                    <h3 className="text-base font-semibold text-gray-800 mb-4">
                                        Ảnh sản phẩm
                                    </h3>
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white hover:border-blue-400 cursor-pointer aspect-square">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        {formData.image_url ? (
                                            <img
                                                src={formData.image_url}
                                                alt="Preview"
                                                className="w-full h-full object-contain p-4"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                <ImageIcon className="w-8 h-8 mb-2" />
                                                <p>Tải ảnh sản phẩm</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-xl p-6 border border-gray-200/50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Danh mục
                                    </label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border rounded-xl cursor-pointer"
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.categoryId}
                                                value={String(category.categoryId)}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />{' '}
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductEdit;
