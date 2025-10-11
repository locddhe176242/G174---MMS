import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Eye, Edit, Trash2, ChevronDown,
    Filter, FileDown, Upload, Package, Sparkles
} from 'lucide-react';
import ProductDetail from './ProductDetail';
import ProductEdit from './ProductEdit';
import ProductAdd from './ProductAdd';
import { getProducts } from '../../../api/productService';

const ProductList = () => {
    // ✅ Danh sách sản phẩm từ API
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // State quản lý màn hình hiện tại
    const [currentScreen, setCurrentScreen] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // ✅ Gọi API để lấy danh sách sản phẩm khi load trang
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await getProducts({
                    page: 0,
                    size: itemsPerPage, 
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    fieldSearch: searchTerm || ''
                });

                // 👇 Giả sử API trả về dạng { content: [...], totalElements: n }
                if (response && response.content) {
                    setProducts(response.content);
                } else {
                    setProducts(response);
                }
            } catch (error) {
                console.error('Lỗi khi tải danh sách sản phẩm:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
}, [searchTerm, itemsPerPage]) // khi search thay đổi sẽ gọi lại API

    // ✅ Lọc sản phẩm theo danh mục (search đã dùng trên API)
    const filteredProducts = products.filter(product => {
        const matchCategory =
            selectedCategory === 'all' || product.category_name === selectedCategory;
        return matchCategory;
    });

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(filteredProducts.map(p => p.product_id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleViewDetail = (product) => {
        setSelectedProduct(product);
        setCurrentScreen('detail');
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setCurrentScreen('edit');
    };

    const handleAdd = () => {
        setCurrentScreen('add');
    };

    const handleDelete = (productId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            setProducts(products.filter(p => p.product_id !== productId));
        }
    };

    const handleClose = () => {
        setCurrentScreen(null);
        setSelectedProduct(null);
    };

    const handleSaveEdit = (updatedProduct) => {
        setProducts(prevProducts =>
            prevProducts.map(p =>
                p.product_id === updatedProduct.product_id ? updatedProduct : p
            )
        );
        alert('Cập nhật sản phẩm thành công!');
        handleClose();
    };

    const handleSaveAdd = (newProduct) => {
        setProducts(prevProducts => [...prevProducts, newProduct]);
        alert('Thêm sản phẩm thành công!');
        handleClose();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            {loading && (
                <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
            <div className="max-w-7xl mx-auto p-8">
                {/* Floating Header with Glassmorphism */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
                                <Package className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                    Quản lý sản phẩm
                                </h1>
                                <p className="text-sm text-gray-600 mt-0.5">Quản lý và theo dõi kho hàng của bạn</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                <FileDown className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                                <span>Xuất file</span>
                            </button>
                            <button className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-green-300 hover:shadow-md transition-all duration-300">
                                <Upload className="w-4 h-4 group-hover:text-green-600 transition-colors" />
                                <span>Nhập file</span>
                            </button>
                            <button
                                onClick={handleAdd}
                                className="group flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-[1.02]"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Thêm sản phẩm</span>
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter Bar với Glassmorphism Effect */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl shadow-gray-200/50 p-5">
                        <div className="flex gap-3 items-center">
                            {/* Enhanced Search Box */}
                            <div className="flex-1 relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-4 h-4 transition-colors duration-300" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã sản phẩm, tên sản phẩm, barcode..."
                                    className="relative w-full pl-11 pr-4 py-3 text-sm bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Category Dropdown với hover effect */}
                            <div className="relative group">
                                <select
                                    className="appearance-none pl-4 pr-10 py-3 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm hover:bg-white cursor-pointer min-w-[180px] transition-all duration-300"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="all">Tất cả danh mục</option>
                                    <option value="Robot hút bụi">🤖 Robot hút bụi</option>
                                    <option value="Điện thoại">📱 Điện thoại</option>
                                    <option value="Laptop">💻 Laptop</option>
                                    <option value="Phụ kiện">🎧 Phụ kiện</option>
                                    <option value="Máy tính bảng">📋 Máy tính bảng</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 w-4 h-4 pointer-events-none transition-colors duration-300" />
                            </div>

                            {/* Advanced Filter Button */}
                            <button className="group flex items-center gap-2 px-5 py-3 text-sm font-medium border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                                <span className="text-gray-700 group-hover:text-indigo-700 transition-colors">Bộ lọc nâng cao</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Premium Table Card */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl shadow-gray-200/50 overflow-hidden">
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-blue-50/40 backdrop-blur-sm">
                                <th className="w-12 px-6 py-4">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all duration-200"
                                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group">
                                        <span>Sản phẩm</span>
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group">
                                        <span>Có thể bán</span>
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group">
                                        <span>Loại</span>
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group">
                                        <span>Ngày tạo</span>
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-center">
                                    <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((product, index) => (
                                <tr key={product.product_id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all duration-200"
                                            checked={selectedProducts.includes(product.product_id)}
                                            onChange={() => handleSelectProduct(product.product_id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {product.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${product.quantity > 50 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {product.quantity}
                                                </span>
                                            {product.quantity === 0 && (
                                                <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                                        Hết hàng
                                                    </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200/50">
                                                {product.categoryName}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{product.createdAt}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1 transition-opacity duration-200">
                                            <button
                                                onClick={() => handleViewDetail(product)}
                                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.product_id)}
                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Premium Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-blue-50/30 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                                Hiển thị <span className="text-blue-600 font-semibold">1-{filteredProducts.length}</span> trong tổng <span className="text-blue-600 font-semibold">{products.length}</span> sản phẩm
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Hiển thị</span>
                                <div className="relative group">
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="appearance-none pl-3 pr-8 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-blue-300 transition-all duration-200"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={15}>15</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">kết quả</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="w-9 h-9 flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105">
                                    1
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Modal Overlay */}
            {currentScreen && (
                <div
                    className="fixed inset-0 bg-gradient-to-br from-gray-900/40 via-blue-900/20 to-indigo-900/30 backdrop-blur-md z-40"
                    onClick={handleClose}
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                />
            )}

            {/* Modals */}
            {currentScreen === 'detail' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <ProductDetail product={selectedProduct} onClose={handleClose} />
                </div>
            )}

            {currentScreen === 'edit' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <ProductEdit product={selectedProduct} onClose={handleClose} onSave={handleSaveEdit} />
                </div>
            )}

            {currentScreen === 'add' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <ProductAdd onClose={handleClose} onSave={handleSaveAdd} />
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: scale(0.92) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductList;