import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus, faXmark, faFloppyDisk, faSpinner, faSearch, faEnvelope, faLock, faIdCard, faBuilding, faUserTag, faUser, faPhone } from '@fortawesome/free-solid-svg-icons';
import { registerUser, getAllUsers } from '../../../api/userService';
import { getAllDepartments } from '../../../api/departmentService';
import { getAllRoles } from '../../../api/roleService';
import { toast } from 'react-toastify';
import Pagination from '../../common/Pagination';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    const filtered = users.filter((user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, departmentsData, rolesData] = await Promise.all([
        getAllUsers(),
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

  const getUserRoles = (user) => {
    if (user.userRoles && Array.isArray(user.userRoles)) {
      return user.userRoles.map((ur) => ur.role?.roleName || ur.roleName).join(', ');
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
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Đăng ký nhân viên mới
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo email, mã nhân viên..."
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mã NV</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Họ tên</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phòng ban</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vai trò</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
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
                  <td className="px-4 py-3 text-sm text-slate-600">{getUserRoles(user)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
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
                        <div className="font-semibold text-sm">{role.roleName}</div>
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                      Đăng ký nhân viên
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
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

export default UserManagement;

