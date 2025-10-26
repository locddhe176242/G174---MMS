import apiClient from "./apiClient";

export const searchUsers = async (searchTerm) => {
  try {
    const response = await apiClient.get("/users/search", {
      params: { keyword: searchTerm }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi tìm kiếm users:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi tải user ${userId}:`, error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await apiClient.get("/users");
    return response.data;
  } catch (error) {
    console.error("Lỗi tải tất cả users:", error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Lỗi đăng ký user:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi cập nhật user ${userId}:`, error);
    throw error;
  }
};

export const resetUserPassword = async (userId, newPassword) => {
  try {
    const response = await apiClient.post(`/users/${userId}/reset-password`, {
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error(`Lỗi reset password user ${userId}:`, error);
    throw error;
  }
};

export const toggleUserStatus = async (userId) => {
  try {
    const response = await apiClient.patch(`/users/${userId}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi toggle status user ${userId}:`, error);
    throw error;
  }
};

export const softDeleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi xóa user ${userId}:`, error);
    throw error;
  }
};

export const restoreUser = async (userId) => {
  try {
    const response = await apiClient.patch(`/users/${userId}/restore`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khôi phục user ${userId}:`, error);
    throw error;
  }
};

export const getAllDeletedUsers = async () => {
  try {
    const response = await apiClient.get("/users/deleted");
    return response.data;
  } catch (error) {
    console.error("Lỗi tải users đã xóa:", error);
    throw error;
  }
};

export const searchDeletedUsers = async (keyword) => {
  try {
    const response = await apiClient.get("/users/deleted/search", {
      params: { keyword }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi tìm kiếm users đã xóa:", error);
    throw error;
  }
};

export default {
  searchUsers,
  getUserById,
  getAllUsers,
  registerUser,
  updateUser,
  resetUserPassword,
  toggleUserStatus,
};
