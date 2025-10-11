import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faSearch, faSpinner, faXmark, faFloppyDisk, faPlus, faTrash, faCalendar, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { getUserOverridePermissions, grantPermissionToUser, revokePermissionFromUser, cleanupExpiredPermissions } from '../../../api/userPermissionService';
import { getAllPermissions } from '../../../api/permissionService';
import { searchUsers } from '../../../api/userService';
import { toast } from 'react-toastify';

const UserPermissionManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [grantFormData, setGrantFormData] = useState({
    permissionKey: '',
    expiresAt: '',
    reason: '',
    isPermanent: false,
  });
  const [granting, setGranting] = useState(false);

  const loadAllPermissions = async () => {
    try {
      const data = await getAllPermissions();
      setAllPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Lỗi tải danh sách permissions');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Vui lòng nhập email hoặc tên user');
      return;
    }

    try {
      setSearching(true);
      
      const mockUser = {
        userId: 5,
        email: searchTerm,
        fullName: 'Nguyễn Văn A',
        roleName: 'SALE',
        roleDisplayName: 'Bán hàng',
      };
      
      setSelectedUser(mockUser);
      await loadUserPermissions(mockUser.userId);
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Không tìm thấy user');
    } finally {
      setSearching(false);
    }
  };

  const loadUserPermissions = async (userId) => {
    try {
      setLoading(true);
      const data = await getUserOverridePermissions(userId);
      setUserPermissions(data);
    } catch (error) {
      console.error('Error loading user permissions:', error);
      toast.error('Lỗi tải permissions của user');
    } finally {
      setLoading(false);
    }
  };

  const openGrantModal = () => {
    setGrantFormData({
      permissionKey: '',
      expiresAt: '',
      reason: '',
      isPermanent: false,
    });
    loadAllPermissions();
    setShowGrantModal(true);
  };

  const handleGrant = async (e) => {
    e.preventDefault();

    try {
      setGranting(true);
      
      const payload = {
        userId: selectedUser.userId,
        permissionKey: grantFormData.permissionKey,
        expiresAt: grantFormData.isPermanent ? null : grantFormData.expiresAt,
        reason: grantFormData.reason,
      };

      await grantPermissionToUser(payload);
      toast.success('Cấp quyền thành công');
      setShowGrantModal(false);
      await loadUserPermissions(selectedUser.userId);
    } catch (error) {
      console.error('Error granting permission:', error);
      toast.error('Lỗi cấp quyền');
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (permissionKey) => {
    if (!window.confirm(`Bạn có chắc muốn thu hồi quyền "${permissionKey}"?`)) {
      return;
    }

    try {
      await revokePermissionFromUser({
        userId: selectedUser.userId,
        permissionKey: permissionKey,
      });
      toast.success('Thu hồi quyền thành công');
      await loadUserPermissions(selectedUser.userId);
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast.error('Lỗi thu hồi quyền');
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa TẤT CẢ expired permissions trong hệ thống?')) {
      return;
    }

    try {
      await cleanupExpiredPermissions();
      toast.success('Cleanup thành công');
      if (selectedUser) {
        await loadUserPermissions(selectedUser.userId);
      }
    } catch (error) {
      console.error('Error cleaning up permissions:', error);
      toast.error('Lỗi cleanup permissions');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-brand-blue" />
            User Permission Override
          </h1>
          <p className="text-slate-600 mt-1">Cấp hoặc thu hồi quyền tạm thời/vĩnh viễn cho user</p>
        </div>
        <button
          onClick={handleCleanup}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          title="Xóa tất cả expired permissions trong hệ thống"
        >
          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
          Cleanup Expired
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Tìm kiếm user</h3>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập email user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                Đang tìm...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                Tìm kiếm
              </>
            )}
          </button>
        </div>
      </div>

      {selectedUser && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-800">{selectedUser.fullName}</h3>
              <p className="text-sm text-slate-600">{selectedUser.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {selectedUser.roleDisplayName} ({selectedUser.roleName})
                </span>
              </div>
            </div>
            <button
              onClick={openGrantModal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Cấp quyền
            </button>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-lg text-slate-800">Override Permissions</h3>
            <p className="text-sm text-slate-600 mt-1">
              Các quyền được cấp đặc biệt cho user này (không bao gồm quyền từ role)
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
          )}

          {!loading && userPermissions.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faExclamationCircle} className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">User chưa có override permission nào</p>
            </div>
          )}

          {!loading && userPermissions.length > 0 && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Permission</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Expires At</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {userPermissions.map((perm) => (
                  <tr key={perm.permissionKey} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{perm.permissionName}</p>
                      <p className="text-sm text-slate-500 font-mono">{perm.permissionKey}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {perm.expiresAt ? (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-slate-400" />
                          {new Date(perm.expiresAt).toLocaleString('vi-VN')}
                        </div>
                      ) : (
                        <span className="text-slate-400">Vĩnh viễn</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          perm.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {perm.status === 'active' ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(perm.permissionKey)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Thu hồi"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showGrantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Cấp quyền cho user</h2>
              <button onClick={() => setShowGrantModal(false)} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleGrant}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Permission <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={grantFormData.permissionKey}
                    onChange={(e) => setGrantFormData({ ...grantFormData, permissionKey: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    required
                  >
                    <option value="">Chọn permission</option>
                    {allPermissions.map((perm) => (
                      <option key={perm.permissionId} value={perm.permissionKey}>
                        {perm.permissionName} ({perm.permissionKey})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantFormData.isPermanent}
                      onChange={(e) => setGrantFormData({ ...grantFormData, isPermanent: e.target.checked })}
                      className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue"
                    />
                    <span className="text-sm font-medium text-slate-700">Cấp quyền vĩnh viễn</span>
                  </label>
                </div>

                {!grantFormData.isPermanent && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expires At <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={grantFormData.expiresAt}
                      onChange={(e) => setGrantFormData({ ...grantFormData, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                      required={!grantFormData.isPermanent}
                    />
                    <p className="text-xs text-slate-500 mt-1">Thời gian hết hạn của quyền này</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={grantFormData.reason}
                    onChange={(e) => setGrantFormData({ ...grantFormData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    rows="3"
                    placeholder="Lý do cấp quyền này..."
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  disabled={granting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {granting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                      Đang cấp quyền...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                      Cấp quyền
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
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

export default UserPermissionManagement;

