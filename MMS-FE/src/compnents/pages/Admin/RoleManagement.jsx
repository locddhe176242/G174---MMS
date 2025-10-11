import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRoleDetail } from '../../../api/roleService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faUsers, faBars, faKey, faArrowRight, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ROLES = [
  { id: 1, name: 'MANAGER', displayName: 'Quản lý', color: 'purple', description: 'Toàn quyền quản trị hệ thống' },
  { id: 2, name: 'SALE', displayName: 'Bán hàng', color: 'blue', description: 'Quản lý khách hàng và bán hàng' },
  { id: 3, name: 'PURCHASE', displayName: 'Mua hàng', color: 'green', description: 'Quản lý nhà cung cấp và mua hàng' },
  { id: 4, name: 'ACCOUNTING', displayName: 'Kế toán', color: 'yellow', description: 'Quản lý tài chính và kế toán' },
  { id: 5, name: 'WAREHOUSE', displayName: 'Kho', color: 'orange', description: 'Quản lý kho và tồn kho' },
];

const RoleManagement = () => {
  const [roleStats, setRoleStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRoleStats();
  }, []);

  const loadRoleStats = async () => {
    try {
      setLoading(true);
      const stats = {};

      for (const role of ROLES) {
        try {
          const detail = await getRoleDetail(role.id);
          stats[role.id] = {
            totalMenus: detail.totalMenus || 0,
            totalPermissions: detail.totalPermissions || 0,
          };
        } catch (error) {
          console.error(`Error loading stats for role ${role.name}:`, error);
          stats[role.id] = {
            totalMenus: 0,
            totalPermissions: 0,
          };
        }
      }

      setRoleStats(stats);
    } catch (error) {
      console.error('Error loading role stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = ROLES.filter((role) =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colorMap = {
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  const colorMapHover = {
    purple: 'hover:border-purple-300',
    blue: 'hover:border-blue-300',
    green: 'hover:border-green-300',
    yellow: 'hover:border-yellow-300',
    orange: 'hover:border-orange-300',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FontAwesomeIcon icon={faShield} className="w-6 h-6 text-brand-blue" />
          Quản lý Phân quyền
        </h1>
        <p className="text-slate-600 mt-1">
          Quản lý roles, menus và permissions cho từng nhóm người dùng
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm role..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => {
            const stats = roleStats[role.id] || { totalMenus: 0, totalPermissions: 0 };

              return (
                <div
                  key={role.id}
                  className={`bg-white border-2 rounded-lg p-6 transition-all duration-200 ${colorMapHover[role.color]} hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${colorMap[role.color]}`}>
                      <FontAwesomeIcon icon={faShield} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{role.displayName}</h3>
                      <p className="text-xs text-slate-500 font-mono">{role.name}</p>
                    </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-4">{role.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FontAwesomeIcon icon={faBars} className="w-4 h-4 text-slate-600" />
                      <span className="text-xs text-slate-600 font-medium">Menus</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalMenus}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FontAwesomeIcon icon={faKey} className="w-4 h-4 text-slate-600" />
                      <span className="text-xs text-slate-600 font-medium">Permissions</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalPermissions}</p>
                    </div>
                  </div>

                  <Link
                  to={`/admin/roles/${role.id}`}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${colorMap[role.color]} border-2`}
                >
                  Xem chi tiết
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faUsers} className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Không tìm thấy role nào</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/menus"
          className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
        >
          <FontAwesomeIcon icon={faBars} className="w-6 h-6 text-blue-600 mb-2" />
          <h4 className="font-semibold text-blue-900">Quản lý Menu Items</h4>
          <p className="text-sm text-blue-700 mt-1">Tạo, sửa, xóa menu items</p>
        </Link>

        <Link
          to="/admin/permissions"
          className="bg-green-50 border-2 border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
        >
          <FontAwesomeIcon icon={faKey} className="w-6 h-6 text-green-600 mb-2" />
          <h4 className="font-semibold text-green-900">Quản lý Permissions</h4>
          <p className="text-sm text-green-700 mt-1">Tạo, xóa permissions</p>
        </Link>

        <Link
          to="/admin/user-permissions"
          className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors"
        >
          <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-purple-600 mb-2" />
          <h4 className="font-semibold text-purple-900">User Permissions</h4>
          <p className="text-sm text-purple-700 mt-1">Cấp/thu hồi quyền user</p>
        </Link>
      </div>
    </div>
  );
};

export default RoleManagement;

