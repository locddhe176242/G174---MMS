import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faFloppyDisk, 
  faSpinner, 
  faEnvelope, 
  faLock, 
  faIdCard, 
  faBuilding, 
  faUserTag, 
  faUser, 
  faPhone,
  faEye,
  faEyeSlash,
  faKey,
  faToggleOn,
  faToggleOff
} from '@fortawesome/free-solid-svg-icons';
import { updateUser, resetUserPassword, toggleUserStatus } from '../../../api/userService';
import { getAllDepartments } from '../../../api/departmentService';
import { getAllRoles } from '../../../api/roleService';
import { toast } from 'react-toastify';

const EditUserModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onUserUpdated 
}) => {
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    employeeCode: '',
    departmentId: '',
    roleIds: [],
    fullName: '',
    phoneNumber: '',
    status: 'Active'
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      loadData();
      populateForm();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (user && roles.length > 0) {
      // Map role names to role IDs
      const userRoleIds = [];
      if (user.roles && Array.isArray(user.roles)) {
        user.roles.forEach(roleName => {
          const role = roles.find(r => r.roleName === roleName);
          if (role && (role.id || role.roleId)) {
            const roleId = parseInt(role.id || role.roleId);
            if (!isNaN(roleId)) {
              userRoleIds.push(roleId);
            }
          }
        });
      }
      
      setFormData(prev => ({
        ...prev,
        roleIds: userRoleIds
      }));
    }
  }, [user, roles]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [departmentsData, rolesData] = await Promise.all([
        getAllDepartments(),
        getAllRoles(),
      ]);
      
      setDepartments(departmentsData.data || departmentsData || []);
      setRoles(rolesData.data || rolesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = () => {
    if (user) {
      setFormData({
        email: user.email || '',
        employeeCode: user.employeeCode || '',
        departmentId: user.departmentId || '',
        roleIds: [], // Will be populated after roles are loaded
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        status: user.status || 'Active'
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleToggle = (roleId) => {
    const roleIdInt = parseInt(roleId);
    setFormData((prev) => {
      const roleIds = prev.roleIds.includes(roleIdInt)
        ? prev.roleIds.filter((id) => id !== roleIdInt)
        : [...prev.roleIds, roleIdInt];
      return { ...prev, roleIds };
    });
  };

  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPasswordData({ ...resetPasswordData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.email.endsWith('@gmail.com')) {
      toast.error('Email phải có đuôi @gmail.com');
      return false;
    }

    if (formData.roleIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 vai trò');
      return false;
    }

    return true;
  };

  const validateResetPassword = () => {
    if (resetPasswordData.newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!*()_\-])[A-Za-z\d@#$%^&+=!*()_\-]{8,64}$/;
    if (!passwordRegex.test(resetPasswordData.newPassword)) {
      toast.error('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt');
      return false;
    }

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
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
        employeeCode: formData.employeeCode,
        departmentId: parseInt(formData.departmentId),
        roleIds: formData.roleIds.map((id) => parseInt(id)).filter(id => !isNaN(id)),
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || null,
      };

      await updateUser(user.id || user.userId, submitData);
      toast.success('Cập nhật thông tin nhân viên thành công');
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi cập nhật thông tin nhân viên';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateResetPassword()) return;

    try {
      setSubmitting(true);
      await resetUserPassword(user.id || user.userId, resetPasswordData.newPassword);
      toast.success('Đặt lại mật khẩu thành công');
      setShowResetPassword(false);
      setResetPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi đặt lại mật khẩu';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setSubmitting(true);
      await toggleUserStatus(user.id || user.userId);
      toast.success('Thay đổi trạng thái thành công');
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error toggling status:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi thay đổi trạng thái';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId || d.departmentId === departmentId);
    return dept?.departmentName || dept?.name || 'N/A';
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            Chỉnh sửa thông tin nhân viên
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600"
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-brand-blue" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Info Section */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Thông tin cơ bản</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
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
                        placeholder="nguyen.van.a@gmail.com"
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">Email phải có đuôi @gmail.com</p>
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
                      {roles.map((role) => {
                        const roleId = parseInt(role.id || role.roleId);
                        return (
                          <button
                            key={roleId}
                            type="button"
                            onClick={() => handleRoleToggle(roleId)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              formData.roleIds.includes(roleId)
                                ? 'border-brand-blue bg-blue-50 text-brand-blue'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="font-semibold text-sm">{role.roleName}</div>
                          </button>
                        );
                      })}
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
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                        Cập nhật thông tin
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>

            {/* Security Actions Section */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Thao tác bảo mật</h3>
              
              <div className="space-y-3">
                {/* Reset Password */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faKey} className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-slate-800">Đặt lại mật khẩu</p>
                      <p className="text-sm text-slate-600">Tạo mật khẩu mới cho nhân viên</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                    disabled={submitting}
                  >
                    {showResetPassword ? 'Ẩn' : 'Đặt lại'}
                  </button>
                </div>

                {/* Toggle Status */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon 
                      icon={formData.status === 'Active' ? faToggleOn : faToggleOff} 
                      className={`w-5 h-5 ${formData.status === 'Active' ? 'text-green-500' : 'text-red-500'}`} 
                    />
                    <div>
                      <p className="font-medium text-slate-800">Trạng thái tài khoản</p>
                      <p className="text-sm text-slate-600">
                        Hiện tại: {formData.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleStatus}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      formData.status === 'Active' 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    disabled={submitting}
                  >
                    {formData.status === 'Active' ? 'Khóa' : 'Mở khóa'}
                  </button>
                </div>
              </div>

              {/* Reset Password Form */}
              {showResetPassword && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-800 mb-3">Đặt lại mật khẩu</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="newPassword"
                          value={resetPasswordData.newPassword}
                          onChange={handleResetPasswordChange}
                          placeholder="********"
                          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">8-64 ký tự, hoa+thường+số+ký tự đặc biệt</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={resetPasswordData.confirmPassword}
                          onChange={handleResetPasswordChange}
                          placeholder="********"
                          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleResetPassword}
                        disabled={submitting}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm"
                      >
                        {submitting ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin mr-2" />
                            Đang đặt lại...
                          </>
                        ) : (
                          'Đặt lại mật khẩu'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowResetPassword(false);
                          setResetPasswordData({ newPassword: '', confirmPassword: '' });
                        }}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUserModal;