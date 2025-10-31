import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faPlus, faEye, faEdit, faTrash, faSpinner, faTag, faFileDownload, faUndo
} from '@fortawesome/free-solid-svg-icons';
import CategoryDetail from './CategoryDetail';
import CategoryEdit from './CategoryEdit';
import CategoryAdd from './CategoryAdd';
import { getCategories, getDeletedCategories, deleteCategory, restoreCategory } from '../../../api/categoryService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeFilter, setActiveFilter] = useState('active'); 

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [activeResponse, deletedResponse] = await Promise.all([
        getCategories(),
        getDeletedCategories()
      ]);
      
      const allCategories = [...(activeResponse || []), ...(deletedResponse || [])];
      setCategories(allCategories);
    } catch (error) {
      console.error("Lỗi khi tải danh sách danh mục:", error);
      toast.error("Không thể tải danh sách danh mục!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((category) => {
    const matchFilter = activeFilter === 'active' 
      ? !category.deletedAt 
      : !!category.deletedAt;
    
    const matchSearch =
      searchTerm.trim() === "" ||
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchFilter && matchSearch;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCategories(filteredCategories.map((c) => c.categoryId));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleViewDetail = (category) => {
    setSelectedCategory(category);
    setCurrentScreen("detail");
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setCurrentScreen("edit");
  };

  const handleAdd = () => {
    setCurrentScreen("add");
  };

  const handleDelete = async (categoryId) => {
    if (!categoryId) {
      console.error("categoryId bị undefined!");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await deleteCategory(categoryId);
        await fetchCategories();

        toast.success(" Đã xóa danh mục thành công!", {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        });
      } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
        toast.error("Có lỗi xảy ra khi xóa danh mục!", {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        });
      }
    }
  };

  const handleRestore = async (categoryId) => {
    if (!categoryId) {
      console.error("categoryId bị undefined!");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn khôi phục danh mục này?")) {
      try {
        await restoreCategory(categoryId);
        await fetchCategories();

        toast.success("Đã khôi phục danh mục thành công!", {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        });
      } catch (error) {
        console.error("Lỗi khi khôi phục danh mục:", error);
        toast.error("Có lỗi xảy ra khi khôi phục danh mục!", {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        });
      }
    }
  };

  const handleClose = () => {
    setCurrentScreen(null);
    setSelectedCategory(null);
  };

  const handleSaveEdit = async (updatedCategory) => {
    handleClose();
    await fetchCategories();
  };

  const handleSaveAdd = async (newCategory) => {
    handleClose();
    await fetchCategories();
  };

  return (
    <div className="p-6">
      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-500" />
        </div>
      )}
      
      <div className="">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FontAwesomeIcon icon={faTag} className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
                <p className="text-sm text-gray-600">Danh sách và tìm kiếm danh mục sản phẩm</p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="group flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="group-hover:font-medium transition-all duration-200">Thêm danh mục</span>
            </button>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mô tả danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="active">Đang hoạt động</option>
            <option value="deleted">Đã xóa</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((category) => (
                  <tr key={category.categoryId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        checked={selectedCategories.includes(category.categoryId)}
                        onChange={() => handleSelectCategory(category.categoryId)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {category.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {category.createdAt ? new Date(category.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                        </button>
                        {!category.deletedAt && (
                          <>
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.categoryId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {category.deletedAt && (
                          <button
                            onClick={() => handleRestore(category.categoryId)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Khôi phục"
                          >
                            <FontAwesomeIcon icon={faUndo} className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">1-{filteredCategories.length}</span> trong tổng <span className="font-medium">{categories.length}</span> danh mục
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Mỗi trang:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                  1
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
                
      {currentScreen === 'detail' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <CategoryDetail category={selectedCategory} onClose={handleClose} />
        </div>
      )}

      {currentScreen === 'edit' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <CategoryEdit category={selectedCategory} onClose={handleClose} onSave={handleSaveEdit} />
        </div>
      )}

      {currentScreen === 'add' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <CategoryAdd onClose={handleClose} onSave={handleSaveAdd} />
        </div>
      )}
    </div>
  );
};

export default CategoryList;