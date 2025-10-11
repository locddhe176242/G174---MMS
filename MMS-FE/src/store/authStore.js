import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import * as authService from "../api/authService";

// ============================================
// AUTH STORE (Zustand)
// ============================================

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ============================================
        // STATE
        // ============================================
        user: null,
        accessToken: null,
        refreshToken: null,
        permissions: [],
        roles: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // ============================================
        // ACTIONS
        // ============================================

        /**
         * Login action
         */
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

        /**
         * Logout action
         */
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
            // Clear state anyway
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

        /**
         * Refresh token action
         */
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

        /**
         * Initialize auth state from localStorage
         */
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

        /**
         * Clear error
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Update user info
         */
        updateUser: (userData) => {
          set((state) => ({
            user: { ...state.user, ...userData },
          }));
          
          // Update localStorage
          const updatedUser = get().user;
          localStorage.setItem("user", JSON.stringify(updatedUser));
        },

        // ============================================
        // SELECTORS/GETTERS
        // ============================================

        /**
         * Check if user has permission
         */
        hasPermission: (permission) => {
          const { permissions } = get();
          return permissions.includes(permission);
        },

        /**
         * Check if user has role
         */
        hasRole: (role) => {
          const { roles } = get();
          return roles.includes(role);
        },

        /**
         * Check if user has any of the roles
         */
        hasAnyRole: (rolesList) => {
          const { roles } = get();
          return rolesList.some((role) => roles.includes(role));
        },

        /**
         * Check if user has all of the permissions
         */
        hasAllPermissions: (permissionsList) => {
          const { permissions } = get();
          return permissionsList.every((perm) => permissions.includes(perm));
        },

        /**
         * Get user's primary role (first role)
         */
        getPrimaryRole: () => {
          const { roles } = get();
          return roles[0] || null;
        },
      }),
      {
        name: "auth-storage", // localStorage key
        partialize: (state) => ({
          // Only persist these fields
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
      name: "AuthStore", // DevTools name
    }
  )
);

export default useAuthStore;

