import apiClient, { setAuthToken, clearAuth } from "./apiClient";
import { jwtDecode } from "jwt-decode";

export const login = async (credentials) => {
  try {
    const response = await apiClient.post("/auth/login", {
      email: credentials.identifier,
      password: credentials.password,
    });
    
    const { accessToken, refreshToken, user } = response.data;
    
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    
    setAuthToken(accessToken);
    
    const decodedToken = jwtDecode(accessToken);
    
    let roles = decodedToken.roles || decodedToken.role || [];
    if (typeof roles === 'string') {
      roles = [roles];
    }
    
    let permissions = decodedToken.permissions || [];
    
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("permissions", JSON.stringify(permissions));
    localStorage.setItem("roles", JSON.stringify(roles));
    
    if (credentials.remember) {
      localStorage.setItem("rememberMe", "true");
    }
    
    return {
      success: true,
      accessToken,
      refreshToken,
      user,
      permissions,
      roles,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw {
      success: false,
      message: error.response?.data?.message || "Đăng nhập thất bại",
      status: error.response?.status,
    };
  }
};

export const register = async (userData) => {
  try {
    const response = await apiClient.post("/auth/register", userData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Register error:", error);
    throw {
      success: false,
      message: error.response?.data?.message || "Đăng ký thất bại",
      status: error.response?.status,
    };
  }
};

export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (refreshToken) {
      await apiClient.post("/auth/logout", {
        refreshToken,
      });
    }
    
    clearAuth();
    
    return {
      success: true,
      message: "Đăng xuất thành công",
    };
  } catch (error) {
    console.error("Logout error:", error);
    
    clearAuth();
    
    return {
      success: true,
      message: "Đăng xuất thành công",
    };
  }
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await apiClient.post("/auth/refresh", {
      refreshToken,
    });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    localStorage.setItem("accessToken", accessToken);
    if (newRefreshToken) {
      localStorage.setItem("refreshToken", newRefreshToken);
    }
    
    setAuthToken(accessToken);
    
    const decodedToken = jwtDecode(accessToken);
    const permissions = decodedToken.permissions || [];
    const roles = decodedToken.roles || [];
    
    localStorage.setItem("permissions", JSON.stringify(permissions));
    localStorage.setItem("roles", JSON.stringify(roles));
    
    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken || refreshToken,
      permissions,
      roles,
    };
  } catch (error) {
    console.error("Refresh token error:", error);
    
    clearAuth();
    window.location.href = "/login";
    
    throw {
      success: false,
      message: error.response?.data?.message || "Phiên đăng nhập hết hạn",
    };
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const getCurrentPermissions = () => {
  const permissionsStr = localStorage.getItem("permissions");
  return permissionsStr ? JSON.parse(permissionsStr) : [];
};

export const getCurrentRoles = () => {
  const rolesStr = localStorage.getItem("roles");
  return rolesStr ? JSON.parse(rolesStr) : [];
};

export const hasPermission = (permission) => {
  const permissions = getCurrentPermissions();
  return permissions.includes(permission);
};

export const hasRole = (role) => {
  const roles = getCurrentRoles();
  return roles.includes(role);
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};
