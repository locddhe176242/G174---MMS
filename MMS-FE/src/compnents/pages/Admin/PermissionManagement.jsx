import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faPlus, faTrash, faSearch, faSpinner, faXmark, faFloppyDisk, faFilter } from '@fortawesome/free-solid-svg-icons';
import { getAllPermissions, createPermission, deletePermission } from '../../../api/permissionService';
import { toast } from 'react-toastify';

const PermissionManagement = () => {
  const [permissions, setPermissions] = useState([]);
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState('all');
  const [resources, setResources] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    permissionKey: '',
    permissionName: '',
    resource: '',
    action: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    const uniqueResources = [...new Set(permissions.map((p) => p.resource))];
    setResources(uniqueResources.filter(Boolean));
  }, [permissions]);

  useEffect(() => {
    let filtered = permissions;

    if (selectedResource !== 'all') {
      filtered = filtered.filter((p) => p.resource === selectedResource);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.permissionKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.resource && p.resource.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredPermissions(filtered);
  }, [searchTerm, selectedResource, permissions]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await getAllPermissions();
      setPermissions(data);
      setFilteredPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Lỗi tải danh sách permissions');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      permissionKey: '',
      permissionName: '',
      resource: '',
      action: '',
      description: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await createPermission(formData);
      toast.success('Tạo permission thành công');
      closeModal();
      await loadPermissions();
    } catch (error) {
      console.error('Error creating permission:', error);
      toast.error('Lỗi tạo permission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (permission) => {
    if (!window.confirm(`Bạn có chắc muốn xóa permission "${permission.permissionName}"?`)) {
      return;
    }

    try {
      await deletePermission(permission.permissionId);
      toast.success('Xóa permission thành công');
      await loadPermissions();
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Lỗi xóa permission');
    }
  };

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const resource = perm.resource || 'other';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(perm);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faKey} className="w-6 h-6 text-brand-blue" />
            Quản lý Permissions
          </h1>
          <p className="text-slate-600 mt-1">Tạo và xóa permissions trong hệ thống</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700"
        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
          Tạo permission mới
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm permission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>

        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue appearance-none bg-white"
          >
            <option value="all">Tất cả resources</option>
            {resources.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800 capitalize flex items-center gap-2">
                  <FontAwesomeIcon icon={faKey} className="w-5 h-5 text-brand-blue" />
                  {resource}
                  <span className="text-sm font-normal text-slate-500">({perms.length} permissions)</span>
                </h3>
              </div>

              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Permission Key</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Action</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {perms.map((perm) => (
                    <tr key={perm.permissionId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-800">{perm.permissionKey}</td>
                      <td className="px-4 py-3 text-sm text-slate-800">{perm.permissionName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {perm.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{perm.description || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(perm)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {Object.keys(groupedPermissions).length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faKey} className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Không tìm thấy permission nào</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Tạo permission mới</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Permission Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.permissionKey}
                    onChange={(e) => setFormData({ ...formData, permissionKey: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    placeholder="customer.view"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Format: resource.action</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Permission Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.permissionName}
                    onChange={(e) => setFormData({ ...formData, permissionName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    placeholder="Xem khách hàng"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Resource <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.resource}
                    onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    placeholder="customer, vendor, product, sales..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Action <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  >
                    <option value="">Chọn action</option>
                    <option value="view">view</option>
                    <option value="create">create</option>
                    <option value="edit">edit</option>
                    <option value="delete">delete</option>
                    <option value="export">export</option>
                    <option value="import">import</option>
                    <option value="approve">approve</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    rows="3"
                    placeholder="Mô tả chi tiết permission này..."
                  />
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
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                      Tạo permission
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

export default PermissionManagement;

