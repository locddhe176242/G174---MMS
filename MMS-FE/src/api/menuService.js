import apiClient from './apiClient';

export const getMenuForCurrentUser = async () => {
  try {
    const response = await apiClient.get('/menu/current-user');
    return response.data;
  } catch (error) {
    console.error('Lỗi tải menu cho user hiện tại:', error);
    throw error;
  }
};

export const getMenuByRole = async (roleName) => {
  try {
    const response = await apiClient.get(`/menu/role/${roleName}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải menu cho role ${roleName}:`, error);
    throw error;
  }
};

export const getAllMenuItems = async () => {
  try {
    const response = await apiClient.get('/menu');
    return response.data;
  } catch (error) {
    console.error('Lỗi tải tất cả menu items:', error);
    throw error;
  }
};

export const getAllMenuItemsPaginated = async (page = 0, size = 10) => {
  try {
    const response = await apiClient.get('/menu/paginated', {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi tải menu items phân trang:', error);
    throw error;
  }
};

export const getMenuItemById = async (menuId) => {
  try {
    const response = await apiClient.get(`/menu/${menuId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải menu item ${menuId}:`, error);
    throw error;
  }
};

export const createMenuItem = async (data) => {
  try {
    const response = await apiClient.post('/menu', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi tạo menu item:', error);
    throw error;
  }
};

export const updateMenuItem = async (menuId, data) => {
  try {
    const response = await apiClient.put(`/menu/${menuId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Lỗi cập nhật menu item ${menuId}:`, error);
    throw error;
  }
};

export const deleteMenuItem = async (menuId) => {
  try {
    await apiClient.delete(`/menu/${menuId}`);
  } catch (error) {
    console.error(`Lỗi xoá menu item ${menuId}:`, error);
    throw error;
  }
};

export default {
  getMenuForCurrentUser,
  getMenuByRole,
  getAllMenuItems,
  getAllMenuItemsPaginated,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
