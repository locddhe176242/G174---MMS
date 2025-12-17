import apiClient from './apiClient';

const notificationService = {
  // Get all notifications for current user
  getNotifications: async () => {
    const response = await apiClient.get('/dashboard/notifications');
    return response.data;
  }
};

export default notificationService;
