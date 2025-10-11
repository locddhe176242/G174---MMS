import apiClient from './apiClient';

export const getAllRoles = async () => {
  try {
    const response = await apiClient.get('/roles');
    return response.data;
  } catch (error) {
    console.error('Lỗi tải danh sách roles:', error);
    throw error;
  }
};

export const getMenusByRole = async (roleId) => {
  try {
    const response = await apiClient.get(`/roles/${roleId}/menus`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải menus cho role ${roleId}:`, error);
    throw error;
  }
};

export const assignMenusToRole = async (data) => {
  try {
    await apiClient.post('/roles/menus/assign', data);
  } catch (error) {
    console.error('Lỗi gán menus cho role:', error);
    throw error;
  }
};

export const removeMenuFromRole = async (roleId, menuId) => {
  try {
    await apiClient.delete(`/roles/${roleId}/menus/${menuId}`);
  } catch (error) {
    console.error(`Lỗi xoá menu ${menuId} khỏi role ${roleId}:`, error);
    throw error;
  }
};

export const removeAllMenusFromRole = async (roleId) => {
  try {
    await apiClient.delete(`/roles/${roleId}/menus`);
  } catch (error) {
    console.error(`Lỗi xoá tất cả menus khỏi role ${roleId}:`, error);
    throw error;
  }
};

export const getPermissionsByRole = async (roleId) => {
  try {
    const response = await apiClient.get(`/roles/${roleId}/permissions`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải permissions cho role ${roleId}:`, error);
    throw error;
  }
};

export const getRoleDetail = async (roleId) => {
  try {
    const response = await apiClient.get(`/roles/${roleId}/detail`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải chi tiết role ${roleId}:`, error);
    throw error;
  }
};

export const assignPermissionsToRole = async (data) => {
  try {
    await apiClient.post('/roles/permissions/assign', data);
  } catch (error) {
    console.error('Lỗi gán permissions cho role:', error);
    throw error;
  }
};

export const removePermissionFromRole = async (roleId, permissionId) => {
  try {
    await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
  } catch (error) {
    console.error(`Lỗi xoá permission ${permissionId} khỏi role ${roleId}:`, error);
    throw error;
  }
};

export const removeAllPermissionsFromRole = async (roleId) => {
  try {
    await apiClient.delete(`/roles/${roleId}/permissions`);
  } catch (error) {
    console.error(`Lỗi xoá tất cả permissions khỏi role ${roleId}:`, error);
    throw error;
  }
};

export default {
  getAllRoles,
  getMenusByRole,
  assignMenusToRole,
  removeMenuFromRole,
  removeAllMenusFromRole,
  getPermissionsByRole,
  getRoleDetail,
  assignPermissionsToRole,
  removePermissionFromRole,
  removeAllPermissionsFromRole,
};
