import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faList, faPlus, faSearch, faSpinner, faEdit, faEye, faTrash, faXmark, faFloppyDisk, faFilter, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import ProductDetail from './ProductDetail';
import ProductEdit from './ProductEdit';
import ProductAdd from './ProductAdd';
import Pagination from '../../common/Pagination';
import { getProducts, updateProduct, deleteProduct } from '../../../api/productService'
import { getCategories } from '../../../api/categoryService'; 
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductList = () => {
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
   * Mở modal xem chi tiết sản phẩm
   */
  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setCurrentScreen("detail");
  };

  // ============ Add Functions (Thêm) ============
  /**
   * Mở modal thêm sản phẩm mới
   */
  const handleAdd = () => {
    setCurrentScreen("add");
  };

  /**
   * Xử lý sau khi thêm sản phẩm mới thành công
   * Đóng modal và tải lại danh sách sản phẩm
   */
  const handleSaveAdd = async (newProduct) => {
    handleClose();
    await fetchProducts();
  };

  // ============ Update Functions (Cập nhật) ============
  /**
   * Mở modal chỉnh sửa sản phẩm
   */
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setCurrentScreen("edit");
  };

  /**
   * Xử lý sau khi cập nhật sản phẩm thành công
   * Đóng modal và tải lại danh sách sản phẩm
   */
  const handleSaveEdit = async (updatedProduct) => {
    handleClose();
    await fetchProducts();
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

        <button
          onClick={handleAdd}
          className="group flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700"
        >
          <span className="group-hover:font-medium transition-all duration-200">Thêm sản phẩm</span>
        </button>
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
                return (
                  <tr key={productId} className="hover:bg-slate-50">
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
      {currentScreen === 'detail' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <ProductDetail product={selectedProduct} onClose={handleClose} />
        </div>
      )}

      {currentScreen === 'edit' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <ProductEdit product={selectedProduct} onClose={handleClose} onSave={handleSaveEdit} />
        </div>
      )}

      {currentScreen === 'add' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <ProductAdd onClose={handleClose} onSave={handleSaveAdd} />
        </div>
      )}
    </div>
  );
};

export default ProductList;