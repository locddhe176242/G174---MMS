import React from 'react';
import { X, Upload, FileText, Sparkles } from 'lucide-react';

const ProductDetail = ({ product, onClose }) => {
    if (!product) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Premium Header with Gradient */}
                <div className="relative px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                    Thông tin sản phẩm
                                </h2>
                                <p className="text-sm text-gray-600 mt-0.5">Chi tiết thông tin sản phẩm</p>
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

                {/* Content with Custom Scrollbar */}
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
                                        <div className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800">
                                            {product.name}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mã vạch/Barcode</label>
                                        <div className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800">
                                            {product.barcode}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200/50">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                                <div className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 min-h-[120px] whitespace-pre-wrap">
                                    {product.description || 'Robot hút bụi tự động với công nghệ AI 3.0 hệ số đi dây dụng xem tự trong những tình năng mà trờ nhớ AI Deebot T10. Vớt tính năng này, Robot sẽ tác nhân địa chính các các chướng ngại vật khó hướng.\n\nVới chất lượng camera 960P, Robot hút bụi sẽ động tự thực thông tin và đô trờ thì vật cụ sai thể chế mấc Deebot T10 được tập trảnh để sẽ trảnh. IR Chướng ngại vật. Bao gốm: giầy dép, tất, thảm trời sàn, thứng rác, ghê-s giường.'}
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl p-6 border border-gray-200/50">
                                <h3 className="text-base font-semibold text-gray-800 mb-5">Thông tin giá</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán</label>
                                        <div className="relative">
                                            <div className="w-full pl-4 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-right text-gray-800">
                                                {product.purchasePrice?.toLocaleString('vi-VN') || 'N/A'}
                                            </div>
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">đ</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Giá vốn</label>
                                        <div className="relative">
                                            <div className="w-full pl-4 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-right text-gray-800">
                                                {product.sellingPrice?.toLocaleString('vi-VN') || 'N/A'}
                                            </div>
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Properties Section */}
                            <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl p-6 border border-gray-200/50">
                                <h3 className="text-base font-semibold text-gray-800 mb-5">Thuộc tính</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                                        <div className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800">
                                            {product.quantity}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                        <div className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800">
                                            {product.status === 'IN_STOCK' ? 'Còn hàng' : 'Hết hàng'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị đo</label>
                                        <div className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800">
                                            {product.uom || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                                        <div className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800">
                                            {product.size || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                                        <div className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800">
                                            {product.sku || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Image & Category */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Image Display */}
                            <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-6 border border-gray-200/50">
                                <h3 className="text-base font-semibold text-gray-800 mb-4">Ảnh sản phẩm</h3>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white aspect-square">
                                    {product.imageUrl ? (
                                        <div className="w-full h-full">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-4"
                                            />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                                                <Upload className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">Chưa có ảnh sản phẩm</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Category */}
                            <div className="bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-xl p-6 border border-gray-200/50">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                                <div className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800">
                                    {product.categoryName || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                        Đóng
                    </button>
                </div>

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
        </div>
    );
};

export default ProductDetail;