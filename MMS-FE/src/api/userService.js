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

export default {
  searchUsers,
  getUserById,
  getAllUsers,
  registerUser,
};
