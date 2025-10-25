import apiClient from './apiClient';

export const getAllPermissions = async () => {
  try {
    const response = await apiClient.get('/permissions');
    return response.data;
  } catch (error) {
    console.error('Lỗi tải tất cả permissions:', error);
    throw error;
  }
};

export const getPermissionsByResource = async (resource) => {
  try {
    const response = await apiClient.get(`/permissions/resource/${resource}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải permissions cho resource ${resource}:`, error);
    throw error;
  }
};

export const getPermissionById = async (permissionId) => {
  try {
    const response = await apiClient.get(`/permissions/${permissionId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải permission ${permissionId}:`, error);
    throw error;
  }
};

export const createPermission = async (data) => {
  try {
    const response = await apiClient.post('/permissions', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi tạo permission:', error);
    throw error;
  }
};

export const deletePermission = async (permissionId) => {
  try {
    await apiClient.delete(`/permissions/${permissionId}`);
  } catch (error) {
    console.error(`Lỗi xoá permission ${permissionId}:`, error);
    throw error;
  }
};

export const checkPermission = async (email, permission) => {
  try {
    const response = await apiClient.get('/permissions/check', {
      params: { email, permission }
    });
    return response.data;
  } catch (error) {
    console.error(`Lỗi kiểm tra permission ${permission} cho ${email}:`, error);
    throw error;
  }
};

export default {
  getAllPermissions,
  getPermissionsByResource,
  getPermissionById,
  createPermission,
  deletePermission,
  checkPermission,
};
