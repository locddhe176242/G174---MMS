import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faList, faPlus, faSearch, faSpinner, faEdit, faEye, faTrash, faXmark, faFloppyDisk, faFilter, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../common/Pagination';
import { getProducts, updateProduct, deleteProduct } from '../../../api/productService'
import { getCategories } from '../../../api/categoryService'; 
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuthStore from '../../../store/authStore';

const ProductList = () => {
  const navigate = useNavigate();
  const { roles } = useAuthStore();
  
  // Check if user is MANAGER or PURCHASE
  const canEdit = roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name;
    return roleName === 'MANAGER' || roleName === 'ROLE_MANAGER' || 
           roleName === 'PURCHASE' || roleName === 'ROLE_PURCHASE';
  }) || false;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [categories, setCategories] = useState([]);

  // Helper function to build full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Remove /api from base URL for static resources
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  // ============ Effects ============
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []); // Load tất cả products một lần, filter ở client-side

  // ============ View Functions (Xem) ============
  /**
   * Lấy danh sách sản phẩm từ API
   * Hỗ trợ tìm kiếm theo keyword
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts(searchTerm || "");
      
      // Backend trả về List<ProductResponseDTO>, không phải Page
      if (Array.isArray(response)) {
        setProducts(response);
      } else if (response && response.content) {
        // Fallback nếu có pagination
        setProducts(response.content);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
      toast.error("Không thể tải danh sách sản phẩm!");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lấy danh sách danh mục sản phẩm từ API
   */
  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response && Array.isArray(response)) {
        setCategories(response);
      } else if (response?.content) {
        // Một số API trả về dạng phân trang
        setCategories(response.content);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      toast.error("Không thể tải danh mục!");
    }
  };

  /**
   * Lọc sản phẩm ở client-side theo danh mục và từ khóa tìm kiếm
   */
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === "all" || product.categoryName === selectedCategory;

      const matchSearch =
        searchTerm.trim() === "" ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  /**
   * Phân trang danh sách sản phẩm đã lọc
   */
  const paginatedProducts = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  /**
   * Chọn/bỏ chọn tất cả sản phẩm trong trang hiện tại
   */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(paginatedProducts.map((p) => p.productId || p.id || p.product_id).filter(Boolean));
    } else {
      setSelectedProducts([]);
    }
  };

  /**
   * Chọn/bỏ chọn từng sản phẩm
   */
  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  /**
   * Điều hướng đến trang chi tiết sản phẩm
   */
  const handleViewDetail = (product) => {
    const productId = product.productId || product.id || product.product_id;
    navigate(`/products/${productId}`);
  };

  // ============ Add Functions (Thêm) ============
  /**
   * Điều hướng đến trang thêm sản phẩm mới
   */
  const handleAdd = () => {
    navigate('/products/new');
  };

  // ============ Update Functions (Cập nhật) ============
  /**
   * Điều hướng đến trang chỉnh sửa sản phẩm
   */
  const handleEdit = (product) => {
    const productId = product.productId || product.id || product.product_id;
    navigate(`/products/${productId}/edit`);
  };

  // ============ Delete Functions (Xóa) ============
  /**
   * Xóa mềm sản phẩm (soft delete)
   * Hiển thị confirm dialog trước khi xóa
   */
  const handleDelete = async (productId) => {
    if (!productId) {
      console.error("ID sản phẩm không xác định!");
      toast.error("Không tìm thấy ID sản phẩm!");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        await deleteProduct(productId);
        await fetchProducts();

        toast.success("Đã xóa sản phẩm thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        const errorMessage = error?.response?.data?.error || error?.message || "Có lỗi xảy ra khi xóa sản phẩm!";
        toast.error(errorMessage);
      }
    }
  };

  // ============ Common Functions (Chung) ============
  /**
   * Đóng modal và reset state
   */
  const handleClose = () => {
    setCurrentScreen(null);
    setSelectedProduct(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Quản lý Sản phẩm
          </h1>
        </div>

        {canEdit && (
        <button
          onClick={handleAdd}
          className="group flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700"
        >
          <span className="group-hover:font-medium transition-all duration-200">Thêm sản phẩm</span>
        </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã sản phẩm, tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-slate-600" />
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(0); }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Hình ảnh</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Số lượng</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Danh mục</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedProducts.map((product, index) => {
                const productId = product.productId || product.id || product.product_id;
                const imageUrls = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
                const images = imageUrls.map(url => getImageUrl(url)).filter(Boolean);
                
                return (
                  <tr key={productId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {images.length > 0 ? (
                          <>
                            <img 
                              src={images[0]} 
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-lg border-2 border-slate-300 shadow-md hover:shadow-lg transition-shadow"
                              onError={(e) => {
                                console.error('Image load error:', images[0]);
                                e.target.src = 'https://via.placeholder.com/112?text=No+Image';
                              }}
                            />
                            {images.length > 1 && (
                              <div className="flex flex-col gap-1.5">
                                {images.slice(1, 4).map((img, idx) => (
                                  <img 
                                    key={idx}
                                    src={img} 
                                    alt={`${product.name} ${idx + 2}`}
                                    className="w-16 h-16 object-cover rounded border-2 border-slate-200 hover:border-slate-300 transition-colors"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/64?text=?';
                                    }}
                                  />
                                ))}
                                {images.length > 4 && (
                                  <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded border-2 border-slate-200 text-sm font-semibold text-slate-700">
                                    +{images.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-28 h-28 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-200">
                            <FontAwesomeIcon icon={faBox} className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">{product.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${(product.totalQuantity || 0) > 50 ? 'text-green-600' : (product.totalQuantity || 0) > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {product.totalQuantity != null ? Number(product.totalQuantity).toLocaleString('vi-VN') : 0}
                        </span>
                        {(product.totalQuantity == null || product.totalQuantity === 0) && (
                          <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                            Hết hàng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {product.categoryName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{product.createdAt || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetail(product)}
                          title="Xem chi tiết"
                          className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        {canEdit && (
                          <>
                        <button
                          onClick={() => handleEdit(product)}
                          title="Chỉnh sửa"
                              className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                        >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(productId)}
                          title="Xóa"
                          className="group p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-red-200 hover:border-red-300"
                        >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                        </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedProducts.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faList} className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Không có sản phẩm phù hợp</p>
            </div>
          )}

          {filteredProducts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalElements={filteredProducts.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(0); }}
            />
          )}
        </div>
      )}

      {/* Modals */}

    </div>
  );
};

export default ProductList;