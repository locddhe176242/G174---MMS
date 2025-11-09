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
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());

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
            <FontAwesomeIcon icon={faBox} className="w-6 h-6 text-brand-blue" />
            Quản lý Sản phẩm
          </h1>
          <p className="text-slate-600 mt-1">Danh sách và tìm kiếm sản phẩm</p>
        </div>

        <button
          onClick={handleAdd}
          className="group flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          <span className="group-hover:font-medium transition-all duration-200">Thêm sản phẩm</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã sản phẩm, tên sản phẩm, barcode..."
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
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-2 focus:ring-brand-blue focus:ring-offset-0 cursor-pointer"
                    checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
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
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-2 focus:ring-brand-blue focus:ring-offset-0 cursor-pointer"
                        checked={selectedProducts.includes(productId)}
                        onChange={() => handleSelectProduct(productId)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">{product.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${product.quantity > 50 ? 'text-green-600' : product.quantity > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {product.quantity || 0}
                        </span>
                        {product.quantity === 0 && (
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
                          <FontAwesomeIcon icon={faEye} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                        
                        <button
                          onClick={() => handleEdit(product)}
                          title="Chỉnh sửa"
                          className="group p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-slate-200 hover:border-slate-300"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(productId)}
                          title="Xóa"
                          className="group p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-red-200 hover:border-red-300"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
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