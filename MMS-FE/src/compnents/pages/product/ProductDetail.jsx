import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileText, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getProductById } from '../../../api/productService';
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

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const data = await getProductById(id);
                setProduct(data);
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm:', error);
                toast.error('Không thể tải thông tin sản phẩm!');
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id, navigate]);

    if (loading) {
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
                    >
                        ← Quay lại
                    </button>
                    <h1 className="text-2xl font-semibold">Chi tiết sản phẩm</h1>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">

                <div className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm</label>
                            <p className="text-slate-800">{product.name || '—'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                            <p className="text-slate-800 font-mono">{product.sku || '—'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                            <p className="text-slate-800">{product.categoryName || '—'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị đo</label>
                            <p className="text-slate-800">{product.uom || '—'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
                            <p className="text-slate-800">{product.size || '—'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tổng số lượng</label>
                            <p className="text-slate-800">{product.totalQuantity != null ? Number(product.totalQuantity).toLocaleString('vi-VN') : 0}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                            <p className="text-slate-800">{product.status === 'IN_STOCK' ? 'Còn hàng' : product.status === 'OUT_OF_STOCK' ? 'Hết hàng' : 'Ngừng kinh doanh'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán</label>
                            <p className="text-slate-800">{product.sellingPrice?.toLocaleString('vi-VN') || '—'} đ</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Giá vốn</label>
                            <p className="text-slate-800">{product.purchasePrice?.toLocaleString('vi-VN') || '—'} đ</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                            <p className="text-slate-800 whitespace-pre-wrap">{product.description || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh sản phẩm</label>
                            <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white aspect-square max-w-xs">
                                {product.imageUrl ? (
                                    <img
                                        src={getImageUrl(product.imageUrl)}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => {
                                            console.error('Lỗi khi load ảnh:', e.target.src?.substring(0, 100));
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6">
                                        <FontAwesomeIcon icon={faFileText} className="w-12 h-12 mb-2" />
                                        <p className="text-sm">Chưa có ảnh sản phẩm</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetail;