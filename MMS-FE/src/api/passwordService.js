import apiClient from "./apiClient";

export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post("/auth/forgot-password/request", {
      email,
    });
    
    return {
      success: true,
      message: response.data.message || "Mã OTP đã được gửi đến email của bạn",
    };
  } catch (error) {
    console.error("Request password reset error:", error);
    throw {
      success: false,
      message: error.response?.data?.message || "Gửi mã OTP thất bại. Vui lòng thử lại.",
      status: error.response?.status,
    };
  }
};

export const verifyOtpOnly = async (email, otp) => {
  try {
    const response = await apiClient.post("/auth/forgot-password/verify-otp", {
      email,
      otp,
    });
    
    return {
      success: true,
      message: response.data.message || "Mã OTP chính xác",
      remainingAttempts: response.data.remainingAttempts,
    };
  } catch (error) {
    console.error("Verify OTP only error:", error);
    throw {
      success: false,
      message: error.response?.data?.message || "Mã OTP không chính xác. Vui lòng thử lại.",
      status: error.response?.status,
    };
  }
};

export const verifyOtpAndResetPassword = async (email, otp, newPassword) => {
  try {
    const response = await apiClient.post("/auth/forgot-password/verify", {
      email,
      otp,
      newPassword,
    });
    
    return {
      success: true,
      message: response.data.message || "Đặt lại mật khẩu thành công",
    };
  } catch (error) {
    console.error("Verify OTP and reset password error:", error);
    throw {
      success: false,
      message: error.response?.data?.message || "Xác thực OTP thất bại. Vui lòng thử lại.",
      status: error.response?.status,
    };
  }
};
