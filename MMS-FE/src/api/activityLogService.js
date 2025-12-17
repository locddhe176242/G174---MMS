import apiClient from './apiClient';

export const activityLogService = {
  getUserActivityLogs: async (userId, page = 0, size = 10, sortBy = 'logDate', sortDir = 'desc') => {
    try {
      const response = await apiClient.get(`/activity-logs/user/${userId}`, {
        params: { page, size, sortBy, sortDir }
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi lấy activity logs cho user ${userId}:`, error);
      throw error;
    }
  },

  getRecentUserActivityLogs: async (userId, limit = 10) => {
    try {
      const response = await apiClient.get(`/activity-logs/user/${userId}/recent`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi lấy recent activity logs cho user ${userId}:`, error);
      throw error;
    }
  },

  getUserActivityLogsByType: async (userId, activityType, page = 0, size = 10) => {
    try {
      const response = await apiClient.get(`/activity-logs/user/${userId}/type/${activityType}`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi lấy activity logs theo type cho user ${userId}:`, error);
      throw error;
    }
  },

  searchUserActivityLogs: async (userId, keyword, page = 0, size = 10) => {
    try {
      const response = await apiClient.get(`/activity-logs/user/${userId}/search`, {
        params: { keyword, page, size }
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi tìm kiếm activity logs cho user ${userId}:`, error);
      throw error;
    }
  },

  getUserActivityStats: async (userId) => {
    try {
      const response = await apiClient.get(`/activity-logs/stats/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi lấy thống kê activity cho user ${userId}:`, error);
      throw error;
    }
  },

  // Lấy hoạt động gần đây cỡa toàn hệ thống (nhiều users/roles)
  getRecentSystemActivityLogs: async (limit = 10) => {
    try {
      const response = await apiClient.get('/activity-logs/recent', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy recent system activity logs:', error);
      throw error;
    }
  }
};

export default activityLogService;