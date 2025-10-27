import apiClient from "./apiClient";

export const getCurrentUserProfile = async () => {
  try {
    const response = await apiClient.get("/users/profile");
    return response.data;
  } catch (error) {
    console.error("Lỗi tải profile:", error);
    throw {
      message: error.response?.data?.message || "Không thể tải profile",
      status: error.response?.status,
    };
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put("/users/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error);
    throw {
      message: error.response?.data?.message || "Không thể cập nhật profile",
      status: error.response?.status,
    };
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await apiClient.put("/users/change-password", passwordData);
    return response.data;
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    throw {
      message: error.response?.data?.message || "Không thể đổi mật khẩu",
      status: error.response?.status,
    };
  }
};

export const uploadAvatar = async (formData) => {
  try {
    const response = await apiClient.post("/users/profile/avatar", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi upload avatar:", error);
    throw {
      message: error.response?.data?.message || "Không thể upload avatar",
      status: error.response?.status,
    };
  }
};