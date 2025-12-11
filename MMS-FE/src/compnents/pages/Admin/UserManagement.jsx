import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus, faXmark, faFloppyDisk, faSpinner, faSearch, faEnvelope, faLock, faIdCard, faBuilding, faUserTag, faUser, faPhone, faEdit, faEye, faMinus, faCheck, faHistory, faFilter, faCalendar, faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import { registerUser, getAllUsers } from '../../../api/userService';
import { getAllDepartments } from '../../../api/departmentService';
import { getAllRoles } from '../../../api/roleService';
import { activityLogService } from '../../../api/activityLogService';
import { toast } from 'react-toastify';
import Pagination from '../../common/Pagination';
import EditUserModal from './EditUserModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [confirmState, setConfirmState] = useState({
    open: false,
    action: null,
    userId: null,
    message: "",
  });

  const [statusFilter, setStatusFilter] = useState('all');

  const [activeTab, setActiveTab] = useState('basic');
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityLogsPage, setActivityLogsPage] = useState(0);
  const [activityLogsTotalPages, setActivityLogsTotalPages] = useState(0);
  const [activityLogsTotalElements, setActivityLogsTotalElements] = useState(0);
  const [activityLogsFilter, setActivityLogsFilter] = useState('');
  const [activityLogsSearch, setActivityLogsSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    employeeCode: '',
    departmentId: '',
    roleIds: [],
    fullName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    let filtered = users.filter((user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.status === 'ACTIVE');
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => user.status === 'INACTIVE');
    }

    setFilteredUsers(filtered);
  }, [searchTerm, users, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      
      const [departmentsData, rolesData] = await Promise.all([
        getAllDepartments(),
        getAllRoles(),
      ]);
      
      setUsers(usersData.data || usersData || []);
      setDepartments(departmentsData.data || departmentsData || []);
      setRoles(rolesData.data || rolesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      employeeCode: '',
      departmentId: '',
      roleIds: [],
      fullName: '',
      phoneNumber: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = async () => {
    await loadData();
  };

  const openDetailModal = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const openConfirmModal = (action, user) => {
    let message = "";
    if (action === 'deactivate') {
      message = `Bạn có chắc chắn muốn DỪNG HOẠT ĐỘNG tạm thời tài khoản của ${user.email}?\n\n🟠 Đây là thao tác tạm thời:\n• Nhân viên nghỉ phép dài hạn\n• Tài khoản không thể đăng nhập\n• Dễ dàng khôi phục khi cần\n• Email vẫn được giữ`;
    } else if (action === 'activate') {
      message = `Bạn có chắc chắn muốn KHÔI PHỤC HOẠT ĐỘNG tài khoản của ${user.email}?\n\n🟢 Tài khoản sẽ được kích hoạt lại và có thể đăng nhập bình thường.`;
    }
    
    setConfirmState({
      open: true,
      action,
      userId: user.id || user.userId,
      message,
    });
  };

  const closeConfirmModal = () => {
    setConfirmState({
      open: false,
      action: null,
      userId: null,
      message: "",
    });
  };

  const performConfirmedAction = async () => {
    const { action, userId } = confirmState;
    if (!action || !userId) return;
    
    try {
      setSubmitting(true);
      
      if (action === 'deactivate' || action === 'activate') {
        const { toggleUserStatus } = await import('../../../api/userService');
        await toggleUserStatus(userId);
        toast.success(action === 'deactivate' ? 'Đã dừng hoạt động tài khoản' : 'Đã khôi phục tài khoản');
      }
      
      await loadData();
    } catch (error) {
      console.error('Error performing action:', error);
      const errorMessage = 'Lỗi thay đổi trạng thái tài khoản';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
      closeConfirmModal();
    }
  };

  const loadActivityLogs = async (userId, page = 0, filter = '', search = '') => {
    try {
      setActivityLogsLoading(true);
      let response;
      
      if (search.trim()) {
        response = await activityLogService.searchUserActivityLogs(userId, search, page, 10);
      } else if (filter) {
        response = await activityLogService.getUserActivityLogsByType(userId, filter, page, 10);
      } else {
        response = await activityLogService.getUserActivityLogs(userId, page, 10);
      }
      
      setActivityLogs(response.data || []);
      setActivityLogsTotalPages(response.totalPages || 0);
      setActivityLogsTotalElements(response.totalElements || 0);
      setActivityLogsPage(page);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      toast.error('Lỗi tải lịch sử hoạt động');
    } finally {
      setActivityLogsLoading(false);
    }
  };

  const handleActivityLogsFilter = (filter) => {
    setActivityLogsFilter(filter);
    if (selectedUser) {
      loadActivityLogs(selectedUser.id || selectedUser.userId, 0, filter, activityLogsSearch);
    }
  };

  const handleActivityLogsSearch = (search) => {
    setActivityLogsSearch(search);
    if (selectedUser) {
      loadActivityLogs(selectedUser.id || selectedUser.userId, 0, activityLogsFilter, search);
    }
  };

  const handleActivityLogsPageChange = (newPage) => {
    if (selectedUser) {
      loadActivityLogs(selectedUser.id || selectedUser.userId, newPage, activityLogsFilter, activityLogsSearch);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleToggle = (roleId) => {
    setFormData((prev) => {
      const roleIds = prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId];
      return { ...prev, roleIds };
    });
  };

  const validateForm = () => {
    if (!formData.email.endsWith('@mms.com')) {
      toast.error('Email phải có đuôi @mms.com');
      return false;
    }

    if (formData.password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!*()_\-])[A-Za-z\d@#$%^&+=!*()_\-]{8,64}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return false;
    }

    if (formData.roleIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 vai trò');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const submitData = {
        email: formData.email,
        password: formData.password,
        employeeCode: formData.employeeCode,
        departmentId: parseInt(formData.departmentId),
        roleIds: formData.roleIds.map((id) => parseInt(id)),
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || null,
      };

      await registerUser(submitData);
      toast.success('Đăng ký nhân viên thành công');
      closeModal();
      await loadData();
    } catch (error) {
      console.error('Error registering user:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi đăng ký nhân viên';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId || d.departmentId === departmentId);
    return dept?.departmentName || dept?.name || 'N/A';
  };

  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      'ACCOUNTING': 'Kế toán',
      'MANAGER': 'Quản lý',
      'PURCHASE': 'Mua hàng',
      'SALE': 'Bán hàng',
      'WAREHOUSE': 'Kho hàng'
    };
    return roleMap[roleName] || roleName;
  };

  const getUserRoles = (user) => {
    if (user.userRoles && Array.isArray(user.userRoles)) {
      return user.userRoles.map((ur) => {
        const roleName = ur.role?.roleName || ur.roleName;
        return getRoleDisplayName(roleName);
      }).join(', ');
    }
    return 'N/A';
  };

  const paginatedUsers = filteredUsers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-brand-blue" />
            Quản lý Nhân viên
          </h1>
          <p className="text-slate-600 mt-1">Đăng ký và quản lý tài khoản nhân viên</p>
        </div>
        <button
          onClick={openCreateModal}
          className="group flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-blue-600 hover:border-blue-700"
        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
          <span className="group-hover:font-medium transition-all duration-200">Đăng ký nhân viên mới</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo email, mã nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            >
              <option value="all">Tất cả tài khoản</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng hoạt động</option>
            </select>
          </div>
        </div>
        
        {/* Legend cho action buttons */}
        <div className="mt-3 flex items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
            <span>Dừng hoạt động tạm thời</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>Khôi phục hoạt động</span>
          </div>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mã NV</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Họ tên</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phòng ban</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id || user.userId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-800">{user.employeeCode}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {user.fullName || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {getDepartmentName(user.departmentId || user.department?.id)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.deletedAt ? 'bg-gray-100 text-gray-700' :
                      user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {user.deletedAt ? 'Đã xóa vĩnh viễn' :
                       user.status === 'Active' ? 'Đang hoạt động' : 'Tạm dừng hoạt động'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Nút Xem chi tiết */}
                      <button
                        onClick={() => openDetailModal(user)}
                        title="Xem chi tiết"
                        className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      
                      {/* Nút Chỉnh sửa */}
                      <button
                        onClick={() => openEditModal(user)}
                        title="Chỉnh sửa"
                        className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      {/* Nút Dừng hoạt động/Khôi phục */}
                      {user.status === 'Active' ? (
                        <button
                          onClick={() => openConfirmModal('deactivate', user)}
                          title="Dừng hoạt động tạm thời - Nhân viên nghỉ phép, tạm thời vô hiệu hóa tài khoản"
                          className="group p-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-orange-200 hover:border-orange-300"
                        >
                          <FontAwesomeIcon icon={faMinus} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirmModal('restore', user)}
                          title="Khôi phục hoạt động - Kích hoạt lại tài khoản đã dừng"
                          className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                        >
                          <FontAwesomeIcon icon={faCheck} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      )}

                      {/* Nút Dừng hoạt động/Khôi phục */}
                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => openConfirmModal('deactivate', user)}
                          title="Dừng hoạt động tài khoản - Tạm dừng quyền truy cập hệ thống"
                          className="group p-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-orange-200 hover:border-orange-300"
                        >
                          <FontAwesomeIcon icon={faPause} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      ) : user.status === 'INACTIVE' ? (
                        <button
                          onClick={() => openConfirmModal('activate', user)}
                          title="Khôi phục hoạt động - Kích hoạt lại quyền truy cập hệ thống"
                          className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                        >
                          <FontAwesomeIcon icon={faPlay} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedUsers.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faUsers} className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Không tìm thấy nhân viên nào</p>
            </div>
          )}

          {!loading && filteredUsers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalElements={filteredUsers.length}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Đăng ký nhân viên mới</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="nguyen.van.a@mms.com"
                      autoComplete="off"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">Email phải có đuôi @mms.com</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <FontAwesomeIcon icon={faIdCard} className="w-4 h-4 mr-2" />
                      Mã nhân viên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleInputChange}
                      placeholder="EMP001"
                      maxLength={50}
                      autoComplete="off"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <FontAwesomeIcon icon={faLock} className="w-4 h-4 mr-2" />
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="********"
                      autoComplete="new-password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">8-64 ký tự, hoa+thường+số+ký tự đặc biệt</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <FontAwesomeIcon icon={faLock} className="w-4 h-4 mr-2" />
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="********"
                      autoComplete="new-password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2" />
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    maxLength={255}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2" />
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="0987654321"
                      pattern="^(0\d{9,10})$"
                      autoComplete="off"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mr-2" />
                      Phòng ban <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                      required
                    >
                      <option value="">Chọn phòng ban</option>
                      {departments.map((dept) => (
                        <option key={dept.id || dept.departmentId} value={dept.id || dept.departmentId}>
                          {dept.departmentName || dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faUserTag} className="w-4 h-4 mr-2" />
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id || role.roleId}
                        type="button"
                        onClick={() => handleRoleToggle(role.id || role.roleId)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.roleIds.includes(role.id || role.roleId)
                            ? 'border-brand-blue bg-blue-50 text-brand-blue'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-sm">{getRoleDisplayName(role.roleName)}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Chọn ít nhất 1 vai trò</p>
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
                      <span>Đang đăng ký...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="group-hover:font-medium transition-all duration-200">Đăng ký nhân viên</span>
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

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                Chi tiết nhân viên
              </h2>
              <button 
                onClick={closeDetailModal} 
                className="text-slate-400 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'basic'
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2" />
                  Thông tin cơ bản
                </button>
                <button
                  onClick={() => setActiveTab('roles')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'roles'
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faUserTag} className="w-4 h-4 mr-2" />
                  Vai trò
                </button>
                <button
                  onClick={() => {
                    setActiveTab('activity');
                    if (selectedUser) {
                      loadActivityLogs(selectedUser.id || selectedUser.userId);
                    }
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faHistory} className="w-4 h-4 mr-2" />
                  Lịch sử hoạt động
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'basic' && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <p className="text-slate-800">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mã nhân viên</label>
                    <p className="text-slate-800">{selectedUser.employeeCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                    <p className="text-slate-800">{selectedUser.fullName || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                    <p className="text-slate-800">{selectedUser.phoneNumber || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phòng ban</label>
                    <p className="text-slate-800">{getDepartmentName(selectedUser.departmentId || selectedUser.department?.id)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedUser.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Vai trò</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles && selectedUser.roles.length > 0 ? (
                    selectedUser.roles.map((role, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Chưa phân vai trò</span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Lịch sử hoạt động</h3>
                  <div className="flex items-center gap-3">
                    {/* Filter */}
                    <select
                      value={activityLogsFilter}
                      onChange={(e) => handleActivityLogsFilter(e.target.value)}
                      className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="LOGIN">Đăng nhập</option>
                      <option value="LOGOUT">Đăng xuất</option>
                      <option value="PROFILE_UPDATE">Cập nhật profile</option>
                      <option value="PASSWORD_CHANGE">Đổi mật khẩu</option>
                      <option value="STATUS_CHANGE">Thay đổi trạng thái</option>
                    </select>
                    
                    {/* Search */}
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={activityLogsSearch}
                        onChange={(e) => handleActivityLogsSearch(e.target.value)}
                        className="pl-10 pr-4 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                      />
                    </div>
                  </div>
                </div>

                {/* Activity Logs Table */}
                {activityLogsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin text-brand-blue" />
                    <span className="ml-2 text-slate-600">Đang tải...</span>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faHistory} className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Chưa có hoạt động nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Thời gian</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Hành động</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Mô tả</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {activityLogs.map((log) => (
                          <tr key={log.logId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-600">
                              {log.logDateFormatted || new Date(log.logDate).toLocaleString('vi-VN')}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                log.activityType === 'LOGIN' ? 'bg-green-100 text-green-700' :
                                log.activityType === 'LOGOUT' ? 'bg-red-100 text-red-700' :
                                log.activityType === 'PROFILE_UPDATE' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-600">{log.description}</td>
                            <td className="px-3 py-2 text-slate-500 text-xs">{log.ipAddress || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {activityLogsTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Hiển thị {activityLogsPage * 10 + 1}-{Math.min((activityLogsPage + 1) * 10, activityLogsTotalElements)} trong tổng số {activityLogsTotalElements} hoạt động
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleActivityLogsPageChange(activityLogsPage - 1)}
                        disabled={activityLogsPage === 0}
                        className="px-3 py-1 border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        Trước
                      </button>
                      <span className="px-3 py-1 text-sm text-slate-600">
                        {activityLogsPage + 1} / {activityLogsTotalPages}
                      </span>
                      <button
                        onClick={() => handleActivityLogsPageChange(activityLogsPage + 1)}
                        disabled={activityLogsPage >= activityLogsTotalPages - 1}
                        className="px-3 py-1 border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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

      {/* Confirm Modal */}
      {confirmState.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Xác nhận</h3>
              <button 
                onClick={closeConfirmModal} 
                className="text-slate-400 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-slate-700 whitespace-pre-line">{confirmState.message}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={closeConfirmModal}
                disabled={submitting}
                className="group px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:scale-105 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="group-hover:font-medium transition-all duration-200">Hủy</span>
              </button>
              <button
                onClick={performConfirmedAction}
                disabled={submitting}
                className={`group px-6 py-2.5 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 ${
                  confirmState.action === 'deactivate' 
                    ? 'bg-red-500 hover:bg-red-600 border border-red-400 hover:border-red-500' 
                    : 'bg-green-500 hover:bg-green-600 border border-green-400 hover:border-green-500'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin mr-2" />
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="group-hover:font-medium transition-all duration-200">
                    {confirmState.action === 'deactivate' ? 'Dừng hoạt động' : 'Khôi phục'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
