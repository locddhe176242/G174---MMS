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

export default {
  getAllDepartments,
  getDepartmentById,
};

