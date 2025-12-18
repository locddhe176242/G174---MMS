import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, XCircle, Info, CheckCircle, Bell } from 'lucide-react';
import notificationService from '../../api/notificationService';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      const fetchedNotifications = data.notifications || [];
      
      // Get read status from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      
      // Mark notifications as read if they're in localStorage
      const notificationsWithReadStatus = fetchedNotifications.map(notification => {
        const isRead = readNotifications.includes(notification.id);
        return { ...notification, isRead };
      });
      
      setNotifications(notificationsWithReadStatus);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { className: "w-6 h-6", strokeWidth: 2.5 };
    
    const icons = {
      'warning': <AlertTriangle {...iconProps} className="w-6 h-6 text-yellow-600" />,
      'error': <XCircle {...iconProps} className="w-6 h-6 text-red-600" />,
      'info': <Info {...iconProps} className="w-6 h-6 text-blue-600" />,
      'success': <CheckCircle {...iconProps} className="w-6 h-6 text-green-600" />
    };
    return icons[type] || <Info {...iconProps} className="w-6 h-6 text-blue-600" />;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification, index) => {
    const updatedNotifications = [...notifications];
    updatedNotifications[index] = { ...notification, isRead: true };
    setNotifications(updatedNotifications);
    
    // Save to localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifications.includes(notification.id)) {
      readNotifications.push(notification.id);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updatedNotifications);
    
    // Save all to localStorage
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
  };

  const clearAll = () => {
    setNotifications([]);
    
    // Clear from localStorage
    localStorage.removeItem('readNotifications');
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Bell className="w-7 h-7 text-blue-600" />
                  Thông báo
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
                </p>
              </div>
              
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'unread' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'read' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Đã đọc ({notifications.length - unreadCount})
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Đang tải...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              <p className="text-gray-500">
                {filter === 'unread' ? 'Không có thông báo chưa đọc' :
                 filter === 'read' ? 'Không có thông báo đã đọc' :
                 'Không có thông báo'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification, index) => (
                <button
                  key={index}
                  onClick={() => handleNotificationClick(notification, index)}
                  className={`w-full p-5 text-left hover:bg-gray-50 transition-all duration-200 border-l-4 ${
                    notification.priority === 'high' ? 'border-red-500' :
                    notification.priority === 'medium' ? 'border-yellow-500' :
                    'border-blue-500'
                  } ${!notification.isRead ? 'bg-blue-50' : 'opacity-75'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-base text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatTime(notification.timestamp)}
                        </span>
                        <div className="flex items-center gap-3">
                          {notification.priority === 'high' && (
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                              Ưu tiên cao
                            </span>
                          )}
                          {notification.priority === 'medium' && (
                            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                              Trung bình
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
