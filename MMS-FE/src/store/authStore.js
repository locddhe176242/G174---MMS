import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import * as authService from "../api/authService";


const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({

        user: null,
        accessToken: null,
        refreshToken: null,
        permissions: [],
        roles: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (credentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.login(credentials);
            
            set({
              user: response.user,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              permissions: response.permissions,
              roles: response.roles,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return { success: true };
          } catch (error) {
            set({
              isLoading: false,
              error: error.message || "Đăng nhập thất bại",
            });
            
            return { success: false, error: error.message };
          }
        },

        logout: async () => {
          set({ isLoading: true });
          
          try {
            await authService.logout();
            
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              permissions: [],
              roles: [],
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            
            return { success: true };
          } catch (error) {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              permissions: [],
              roles: [],
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            
            return { success: true };
          }
        },

        refreshToken: async () => {
          const currentRefreshToken = get().refreshToken;
          
          if (!currentRefreshToken) {
            return { success: false, error: "No refresh token" };
          }
          
          try {
            const response = await authService.refreshAccessToken(currentRefreshToken);
            
            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              permissions: response.permissions,
              roles: response.roles,
            });
            
            return { success: true };
          } catch (error) {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              permissions: [],
              roles: [],
              isAuthenticated: false,
              error: error.message,
            });
            
            return { success: false, error: error.message };
          }
        },

        initializeAuth: () => {
          const user = authService.getCurrentUser();
          const permissions = authService.getCurrentPermissions();
          const roles = authService.getCurrentRoles();
          const accessToken = localStorage.getItem("accessToken");
          const refreshToken = localStorage.getItem("refreshToken");
          
          if (user && accessToken) {
            set({
              user,
              accessToken,
              refreshToken,
              permissions,
              roles,
              isAuthenticated: true,
            });
          }
        },

        clearError: () => {
          set({ error: null });
        },

        updateUser: (userData) => {
          set((state) => ({
            user: { ...state.user, ...userData },
          }));
          
          const updatedUser = get().user;
          localStorage.setItem("user", JSON.stringify(updatedUser));
        },

        hasPermission: (permission) => {
          const { permissions } = get();
          return permissions.includes(permission);
        },

        hasRole: (role) => {
          const { roles } = get();
          return roles.includes(role);
        },

        hasAnyRole: (rolesList) => {
          const { roles } = get();
          return rolesList.some((role) => roles.includes(role));
        },

        hasAllPermissions: (permissionsList) => {
          const { permissions } = get();
          return permissionsList.every((perm) => permissions.includes(perm));
        },

        getPrimaryRole: () => {
          const { roles } = get();
          return roles[0] || null;
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          permissions: state.permissions,
          roles: state.roles,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: "AuthStore",
    }
  )
);

export default useAuthStore;
