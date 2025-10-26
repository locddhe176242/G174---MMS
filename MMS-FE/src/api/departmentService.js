import apiClient from './apiClient';

export const getAllDepartments = async () => {
  try {
    const response = await apiClient.get('/departments');
    return response.data;
  } catch (error) {
    console.error('Lỗi tải danh sách phòng ban:', error);
    throw error;
  }
};

export const getDepartmentById = async (departmentId) => {
  try {
    const response = await apiClient.get(`/departments/${departmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải phòng ban ${departmentId}:`, error);
    throw error;
  }
};

export const createDepartment = async (departmentData) => {
  try {
    const response = await apiClient.post('/departments', departmentData);
    return response.data;
  } catch (error) {
    console.error('Lỗi tạo phòng ban:', error);
    throw error;
  }
};

export const updateDepartment = async (departmentId, departmentData) => {
  try {
    const response = await apiClient.put(`/departments/${departmentId}`, departmentData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi cập nhật phòng ban ${departmentId}:`, error);
    throw error;
  }
};

export const deleteDepartment = async (departmentId) => {
  try {
    const response = await apiClient.delete(`/departments/${departmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi dừng hoạt động phòng ban ${departmentId}:`, error);
    throw error;
  }
};

export const restoreDepartment = async (departmentId) => {
  try {
    const response = await apiClient.patch(`/departments/${departmentId}/restore`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khôi phục phòng ban ${departmentId}:`, error);
    throw error;
  }
};

export default {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  restoreDepartment,
};

