import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFloppyDisk, faSpinner, faBars, faKey, faCheckCircle, faTimesCircle, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { getRoleDetail, assignMenusToRole, assignPermissionsToRole } from '../../../api/roleService';
import { getAllMenuItems } from '../../../api/menuService';
import { getAllPermissions } from '../../../api/permissionService';
import { toast } from 'react-toastify';

const ROLES = {
  1: { name: 'MANAGER', displayName: 'Quản lý', color: 'purple' },
  2: { name: 'SALE', displayName: 'Bán hàng', color: 'blue' },
  3: { name: 'PURCHASE', displayName: 'Mua hàng', color: 'green' },
  4: { name: 'ACCOUNTING', displayName: 'Kế toán', color: 'yellow' },
  5: { name: 'WAREHOUSE', displayName: 'Kho', color: 'orange' },
};

const RoleDetail = () => {
  const { roleId } = useParams();
  const role = ROLES[roleId];
  
  const [activeTab, setActiveTab] = useState('menus');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [roleDetail, setRoleDetail] = useState(null);
  
  const [allMenus, setAllMenus] = useState([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState([]);
  const [permissionsByResource, setPermissionsByResource] = useState({});

  useEffect(() => {
    if (roleId) {
      loadData();
    }
  }, [roleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const detail = await getRoleDetail(parseInt(roleId));
      setRoleDetail(detail);
      
      const [menusData, permissionsData] = await Promise.all([
        getAllMenuItems(),
        getAllPermissions(),
      ]);
      
      setAllMenus(menusData);
      setAllPermissions(permissionsData);
      
      const currentMenuIds = detail.menus.map((m) => m.menuId);
      setSelectedMenuIds(currentMenuIds);
      
      const currentPermissionKeys = detail.permissions.map((p) => p.permissionKey);
      setSelectedPermissionKeys(currentPermissionKeys);
      
      const grouped = permissionsData.reduce((acc, perm) => {
        const resource = perm.resource || 'other';
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
      }, {});
      setPermissionsByResource(grouped);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const toggleMenuSelection = (menuId) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const selectAllMenus = () => {
    setSelectedMenuIds(allMenus.map((m) => m.menuId));
  };

  const deselectAllMenus = () => {
    setSelectedMenuIds([]);
  };

  const togglePermissionSelection = (permissionKey) => {
    setSelectedPermissionKeys((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((key) => key !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissionKeys(allPermissions.map((p) => p.permissionKey));
  };

  const deselectAllPermissions = () => {
    setSelectedPermissionKeys([]);
  };

  const selectResourcePermissions = (resource) => {
    const resourcePerms = permissionsByResource[resource] || [];
    const resourceKeys = resourcePerms.map((p) => p.permissionKey);
    setSelectedPermissionKeys((prev) => {
      const newKeys = [...prev];
      resourceKeys.forEach((key) => {
        if (!newKeys.includes(key)) {
          newKeys.push(key);
        }
      });
      return newKeys;
    });
  };

  const saveMenuChanges = async () => {
    try {
      setSaving(true);
      await assignMenusToRole({
        roleId: parseInt(roleId),
        menuIds: selectedMenuIds,
      });
      toast.success('Cập nhật menus thành công');
      await loadData();
    } catch (error) {
      console.error('Error saving menus:', error);
      toast.error('Lỗi cập nhật menus');
    } finally {
      setSaving(false);
    }
  };

  const savePermissionChanges = async () => {
    try {
      setSaving(true);
      await assignPermissionsToRole({
        roleId: parseInt(roleId),
        permissionKeys: selectedPermissionKeys,
      });
      toast.success('Cập nhật permissions thành công');
      await loadData();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Lỗi cập nhật permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!role) {
    return (
      <div className="p-6">
        <p className="text-red-500">Role không tồn tại</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/admin/roles" className="inline-flex items-center gap-2 text-brand-blue hover:underline mb-4">
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
          Quay lại danh sách roles
        </Link>
        
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-lg bg-${role.color}-100`}>
            <FontAwesomeIcon icon={faShieldAlt} className={`w-8 h-8 text-${role.color}-600`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{role.displayName}</h1>
            <p className="text-slate-600">{role.name}</p>
          </div>
          
          {roleDetail && (
            <div className="ml-auto flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{roleDetail.totalMenus}</p>
                <p className="text-xs text-slate-600">Menus</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{roleDetail.totalPermissions}</p>
                <p className="text-xs text-slate-600">Permissions</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('menus')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'menus'
                ? 'text-brand-blue'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
              Menus
            </div>
            {activeTab === 'menus' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'permissions'
                ? 'text-brand-blue'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faKey} className="w-4 h-4" />
              Permissions
            </div>
            {activeTab === 'permissions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue" />
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      )}

      {!loading && activeTab === 'menus' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600">
                Đã chọn <span className="font-semibold text-brand-blue">{selectedMenuIds.length}</span> / {allMenus.length} menus
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllMenus}
                className="text-sm text-brand-blue hover:underline"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={deselectAllMenus}
                className="text-sm text-red-500 hover:underline"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {allMenus.map((menu) => {
              const isSelected = selectedMenuIds.includes(menu.menuId);
              return (
                <button
                  key={menu.menuId}
                  onClick={() => toggleMenuSelection(menu.menuId)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-brand-blue bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{menu.menuLabel}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{menu.menuPath}</p>
                      <p className="text-xs text-slate-400 mt-1">Order: {menu.displayOrder}</p>
                    </div>
                    {isSelected ? (
                      <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-brand-blue flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={saveMenuChanges}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      )}

      {!loading && activeTab === 'permissions' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600">
                Đã chọn <span className="font-semibold text-brand-blue">{selectedPermissionKeys.length}</span> / {allPermissions.length} permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllPermissions}
                className="text-sm text-brand-blue hover:underline"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={deselectAllPermissions}
                className="text-sm text-red-500 hover:underline"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          </div>

          <div className="space-y-6 mb-6">
            {Object.entries(permissionsByResource).map(([resource, permissions]) => (
              <div key={resource} className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-800 capitalize">{resource}</h3>
                  <button
                    onClick={() => selectResourcePermissions(resource)}
                    className="text-sm text-brand-blue hover:underline"
                  >
                    Chọn tất cả {resource}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissions.map((perm) => {
                    const isSelected = selectedPermissionKeys.includes(perm.permissionKey);
                    return (
                      <button
                        key={perm.permissionId}
                        onClick={() => togglePermissionSelection(perm.permissionKey)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-slate-800">{perm.permissionName}</p>
                            <p className="text-xs text-slate-500 font-mono">{perm.permissionKey}</p>
                            <p className="text-xs text-slate-400 mt-1">{perm.action}</p>
                          </div>
                          {isSelected ? (
                            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={savePermissionChanges}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default RoleDetail;

