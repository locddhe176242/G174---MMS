import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faPlus, faPenToSquare, faTrash, faSearch, faSpinner, faXmark, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { getAllMenuItemsPaginated, createMenuItem, updateMenuItem, deleteMenuItem } from '../../../api/menuService';
import { toast } from 'react-toastify';
import Pagination from '../../common/Pagination';

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [formData, setFormData] = useState({
    menuKey: '',
    menuLabel: '',
    menuPath: '',
    iconName: '',
    displayOrder: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadMenus();
  }, [currentPage, pageSize]);

  useEffect(() => {
    const filtered = menus.filter((menu) =>
      menu.menuKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.menuLabel.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMenus(filtered);
  }, [searchTerm, menus]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await getAllMenuItemsPaginated(currentPage, pageSize);
      setMenus(response.content);
      setFilteredMenus(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Lỗi tải danh sách menu:', error);
      toast.error('Lỗi tải danh sách menu');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      menuKey: '',
      menuLabel: '',
      menuPath: '',
      iconName: '',
      displayOrder: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (menu) => {
    setModalMode('edit');
    setSelectedMenu(menu);
    setFormData({
      menuKey: menu.menuKey,
      menuLabel: menu.menuLabel,
      menuPath: menu.menuPath,
      iconName: menu.iconName,
      displayOrder: menu.displayOrder,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      if (modalMode === 'create') {
        await createMenuItem(formData);
        toast.success('Tạo menu thành công');
      } else {
        await updateMenuItem(selectedMenu.menuId, formData);
        toast.success('Cập nhật menu thành công');
      }
      
      closeModal();
      await loadMenus();
    } catch (error) {
      console.error('Lỗi gửi menu:', error);
      toast.error(modalMode === 'create' ? 'Lỗi tạo menu' : 'Lỗi cập nhật menu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (menu) => {
    if (!window.confirm(`Bạn có chắc muốn xóa menu "${menu.menuLabel}"?`)) {
      return;
    }

    try {
      await deleteMenuItem(menu.menuId);
      toast.success('Xóa menu thành công');
      await loadMenus();
    } catch (error) {
      console.error('Lỗi xoá menu:', error);
      toast.error('Lỗi xóa menu');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faBars} className="w-6 h-6 text-brand-blue" />
            Quản lý Menu Items
          </h1>
          <p className="text-slate-600 mt-1">Tạo, sửa, xóa menu items trong hệ thống</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Tạo menu mới
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo menu key hoặc label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      )}

      {!loading && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Menu Key</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Label</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Path</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Icon</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Order</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMenus.map((menu) => (
                <tr key={menu.menuId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-800">{menu.menuKey}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{menu.menuLabel}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{menu.menuPath}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{menu.iconName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{menu.displayOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(menu)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Sửa"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(menu)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Xóa"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMenus.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faBars} className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Không tìm thấy menu nào</p>
            </div>
          )}
          
          {!loading && filteredMenus.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalElements={totalElements}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(0);
              }}
            />
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {modalMode === 'create' ? 'Tạo menu mới' : 'Chỉnh sửa menu'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Menu Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.menuKey}
                    onChange={(e) => setFormData({ ...formData, menuKey: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                    disabled={modalMode === 'edit'}
                  />
                  <p className="text-xs text-slate-500 mt-1">Unique key (e.g., dashboard, customers)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.menuLabel}
                    onChange={(e) => setFormData({ ...formData, menuLabel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Hiển thị trên UI (e.g., Trang chủ, Khách hàng)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Menu Path <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.menuPath}
                    onChange={(e) => setFormData({ ...formData, menuPath: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Route path (e.g., /dashboard, /customers)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Icon Name
                  </label>
                  <input
                    type="text"
                    value={formData.iconName}
                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                  />
                  <p className="text-xs text-slate-500 mt-1">Icon name (home, customers, products, ...)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Display Order <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">0-9: Main, 10-99: Operation, 100+: Management</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                      {modalMode === 'create' ? 'Tạo menu' : 'Cập nhật'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;

