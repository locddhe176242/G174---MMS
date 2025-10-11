import apiClient from './apiClient';

export const getUserPermissions = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/permissions`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải permissions cho user ${userId}:`, error);
    throw error;
  }
};

export const getUserOverridePermissions = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/permissions/override`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải override permissions cho user ${userId}:`, error);
    throw error;
  }
};

export const grantPermissionToUser = async (data) => {
  try {
    const response = await apiClient.post('/users/permissions/grant', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi cấp quyền cho user:', error);
    throw error;
  }
};

export const revokePermissionFromUser = async (data) => {
  try {
    const response = await apiClient.delete('/users/permissions/revoke', { data });
    return response.data;
  } catch (error) {
    console.error('Lỗi thu hồi quyền từ user:', error);
    throw error;
  }
};

export const cleanupExpiredPermissions = async () => {
  try {
    const response = await apiClient.delete('/users/permissions/cleanup');
    return response.data;
  } catch (error) {
    console.error('Lỗi xoá expired permissions:', error);
    throw error;
  }
};

export default {
  getUserPermissions,
  getUserOverridePermissions,
  grantPermissionToUser,
  revokePermissionFromUser,
  cleanupExpiredPermissions,
};
