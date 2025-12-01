import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faList, faPlus, faSearch, faSpinner, faEdit, faEye, faTrash, faXmark, faFloppyDisk, faFilter, faUndo } from '@fortawesome/free-solid-svg-icons';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment, restoreDepartment } from '../../../api/departmentService';
import Pagination from '../../common/Pagination';
import { toast } from 'react-toastify';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    departmentName: '',
    departmentCode: '',
    description: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAllDepartments();
      const data = res?.data || res || [];
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading departments', err);
      toast.error('Lỗi tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let filtered = departments;
    
    // Apply search filter
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(d =>
        (d.departmentCode || '').toLowerCase().includes(term) ||
        (d.departmentName || '').toLowerCase().includes(term) ||
        (d.description || '').toLowerCase().includes(term)
      );
    }
    
    // Apply status filter (dựa trên deletedAt: null = active, có giá trị = inactive)
    if (statusFilter === 'active') {
      filtered = filtered.filter(d => !d.deletedAt);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(d => d.deletedAt);
    }
    // 'all' shows all departments regardless of status
    
    return filtered;
  }, [departments, searchTerm, statusFilter]);

  const paginated = useMemo(() => {
    const start = currentPage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  // Modal functions
  const openCreateModal = () => {
    setFormData({
      departmentName: '',
      departmentCode: '',
      description: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      departmentName: '',
      departmentCode: '',
      description: ''
    });
  };

  const openEditModal = (department) => {
    setSelectedDepartment(department);
    setFormData({
      departmentName: department.departmentName || '',
      departmentCode: department.departmentCode || '',
      description: department.description || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedDepartment(null);
    setFormData({
      departmentName: '',
      departmentCode: '',
      description: ''
    });
  };

  const openDetailModal = (department) => {
    setSelectedDepartment(department);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedDepartment(null);
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.departmentName.trim()) {
      toast.error('Tên phòng ban không được để trống');
      return false;
    }
    if (!formData.departmentCode.trim()) {
      toast.error('Mã phòng ban không được để trống');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await createDepartment(formData);
      toast.success('Tạo phòng ban thành công');
      closeModal();
      await loadData();
    } catch (error) {
      console.error('Error creating department:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi tạo phòng ban';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await updateDepartment(selectedDepartment.departmentId, formData);
      toast.success('Cập nhật phòng ban thành công');
      closeEditModal();
      await loadData();
    } catch (error) {
      console.error('Error updating department:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi cập nhật phòng ban';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn dừng hoạt động phòng ban này?')) return;

    try {
      setSubmitting(true);
      await deleteDepartment(departmentId);
      toast.success('Dừng hoạt động phòng ban thành công');
      await loadData();
    } catch (error) {
      console.error('Error deactivating department:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi dừng hoạt động phòng ban';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (departmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn khôi phục phòng ban này?')) return;

    try {
      setSubmitting(true);
      await restoreDepartment(departmentId);
      toast.success('Khôi phục phòng ban thành công');
      await loadData();
    } catch (error) {
      console.error('Error restoring department:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khôi phục phòng ban';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-brand-blue" />
            Quản lý Phòng ban
          </h1>
          <p className="text-slate-600 mt-1">Danh sách và tìm kiếm phòng ban</p>
        </div>

        <button
          onClick={openCreateModal}
          className="group flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          <span className="group-hover:font-medium transition-all duration-200">Thêm phòng ban</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên hoặc mô tả phòng ban..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã dừng hoạt động</option>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mã phòng ban</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tên phòng ban</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mô tả</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginated.map((d, idx) => (
                <tr key={d.departmentId || idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-800">{d.departmentCode || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{d.departmentName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{d.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      !d.deletedAt ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {!d.deletedAt ? 'Đang hoạt động' : 'Đã dừng hoạt động'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Nút Xem chi tiết */}
                      <button
                        onClick={() => openDetailModal(d)}
                        title="Xem chi tiết"
                        className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                      
                      {/* Nút Chỉnh sửa */}
                      <button
                        onClick={() => openEditModal(d)}
                        title="Chỉnh sửa"
                        className="group p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-slate-200 hover:border-slate-300"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                      
                      {/* Nút Dừng hoạt động/Khôi phục */}
                      {!d.deletedAt ? (
                        <button
                          onClick={() => handleDelete(d.departmentId)}
                          title="Dừng hoạt động phòng ban"
                          className="group p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-red-200 hover:border-red-300"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(d.departmentId)}
                          title="Khôi phục phòng ban"
                          className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                        >
                          <FontAwesomeIcon icon={faUndo} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginated.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faList} className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Không có phòng ban phù hợp</p>
            </div>
          )}

          {filtered.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalElements={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(0); }}
            />
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Thêm phòng ban mới</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên phòng ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleInputChange}
                    placeholder="Phòng Kế toán"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mã phòng ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departmentCode"
                    value={formData.departmentCode}
                    onChange={handleInputChange}
                    placeholder="KT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả về phòng ban..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="group-hover:font-medium transition-all duration-200">Tạo phòng ban</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="group px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-all duration-200 hover:scale-105 hover:shadow-sm disabled:hover:scale-100"
                >
                  <span className="group-hover:font-medium transition-all duration-200">Hủy</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Chỉnh sửa phòng ban</h2>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên phòng ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleInputChange}
                    placeholder="Phòng Kế toán"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mã phòng ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departmentCode"
                    value={formData.departmentCode}
                    onChange={handleInputChange}
                    placeholder="KT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả về phòng ban..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="group-hover:font-medium transition-all duration-200">Cập nhật phòng ban</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={submitting}
                  className="group px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-all duration-200 hover:scale-105 hover:shadow-sm disabled:hover:scale-100"
                >
                  <span className="group-hover:font-medium transition-all duration-200">Hủy</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Chi tiết phòng ban</h2>
              <button onClick={closeDetailModal} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên phòng ban</label>
                  <p className="text-slate-800">{selectedDepartment.departmentName || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã phòng ban</label>
                  <p className="text-slate-800 font-mono">{selectedDepartment.departmentCode || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                  <p className="text-slate-800">{selectedDepartment.description || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t">
              <button
                onClick={closeDetailModal}
                className="group px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:scale-105 hover:shadow-sm"
              >
                <span className="group-hover:font-medium transition-all duration-200">Đóng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

