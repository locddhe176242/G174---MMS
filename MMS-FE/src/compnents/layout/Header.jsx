import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { AlertTriangle, XCircle, Info, CheckCircle, Bell } from 'lucide-react';
import logo from '../../assets/mms_logo.svg';
import useAuthStore from '../../store/authStore';
import notificationService from '../../api/notificationService';

export default function Header({
  userEmail = "User",
  avatarUrl = null,
  onLogout = () => {},
  pendingTasksCount = 0,
}) {
  console.log('Header avatarUrl:', avatarUrl);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const { roles } = useAuthStore();
  
  const getRoleDisplayName = () => {
    if (!roles || roles.length === 0) return "Người dùng";
    
    const roleNames = {
      'MANAGER': 'Quản lý',
      'SALE': 'Nhân viên bán hàng',
      'PURCHASE': 'Nhân viên mua hàng',
      'WAREHOUSE': 'Nhân viên kho',
      'ACCOUNTING': 'Nhân viên kế toán'
    };
    
    // Return the first role's display name
    const firstRole = roles[0];
    return roleNames[firstRole] || firstRole || "Người dùng";
  };
  
  const initials = userEmail
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  // Load notifications
  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      const fetchedNotifications = data.notifications || [];
      
      // Get read status from localStorage with user-specific key
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const userIdentifier = userObj.email || userObj.userId || 'default';
      const storageKey = `readNotifications_${userIdentifier}`;
      const readNotificationsData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      // Mark notifications as read if they're in localStorage
      // Use both ID and timestamp to handle cases where notifications change
      const notificationsWithReadStatus = fetchedNotifications.map(notification => {
        // Check if notification ID exists in read list
        const readData = readNotificationsData[notification.id];
        // Consider as read if: 
        // 1. ID is in read list AND
        // 2. Was read within last 24 hours (to reset daily for recurring notifications)
        const isRead = readData && 
          (Date.now() - readData.readAt < 24 * 60 * 60 * 1000); // 24 hours
        return { ...notification, isRead };
      });
      
      setNotifications(notificationsWithReadStatus);
      
      // Count unread notifications
      const unread = notificationsWithReadStatus.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }

    if (isDropdownOpen || isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isNotificationOpen]);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate("/profile");
  };

  const handleChangePasswordClick = () => {
    setIsDropdownOpen(false);
    navigate("/profile?tab=password");
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  const handleNotificationClick = (notification, index) => {
    // Mark as read
    const updatedNotifications = [...notifications];
    updatedNotifications[index] = { ...notification, isRead: true };
    setNotifications(updatedNotifications);
    
    // Save to localStorage with user-specific key and timestamp
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const userIdentifier = userObj.email || userObj.userId || 'default';
    const storageKey = `readNotifications_${userIdentifier}`;
    const readNotificationsData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Store with timestamp to track when it was read
    readNotificationsData[notification.id] = {
      readAt: Date.now(),
      title: notification.title
    };
    localStorage.setItem(storageKey, JSON.stringify(readNotificationsData));
    
    // Update unread count
    const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
    setUnreadCount(newUnreadCount);
    
    // Close dropdown with slight delay for visual feedback
    setTimeout(() => {
      setIsNotificationOpen(false);
    }, 150);
    
    // Navigate if has link
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    // Save all to localStorage with user-specific key and timestamps
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const userIdentifier = userObj.email || userObj.userId || 'default';
    const storageKey = `readNotifications_${userIdentifier}`;
    const readNotificationsData = {};
    
    notifications.forEach(n => {
      readNotificationsData[n.id] = {
        readAt: Date.now(),
        title: n.title
      };
    });
    localStorage.setItem(storageKey, JSON.stringify(readNotificationsData));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    
    // Clear from localStorage with user-specific key
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const userIdentifier = userObj.email || userObj.userId || 'default';
    const storageKey = `readNotifications_${userIdentifier}`;
    localStorage.removeItem(storageKey);
  };

  const getNotificationIcon = (type) => {
    const iconProps = { className: "w-5 h-5", strokeWidth: 2.5 };
    
    const icons = {
      'warning': <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-600" />,
      'error': <XCircle {...iconProps} className="w-5 h-5 text-red-600" />,
      'info': <Info {...iconProps} className="w-5 h-5 text-blue-600" />,
      'success': <CheckCircle {...iconProps} className="w-5 h-5 text-green-600" />
    };
    return icons[type] || <Info {...iconProps} className="w-5 h-5 text-blue-600" />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      'warning': 'bg-yellow-50 border-yellow-200',
      'error': 'bg-red-50 border-red-200',
      'info': 'bg-blue-50 border-blue-200',
      'success': 'bg-green-50 border-green-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <header className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MMS" className="w-10 h-10 object-contain" />
          <div>
            <div className="text-base font-bold text-brand-blue">MMS</div>
            <div className="text-xs text-slate-600">Management System</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell - For all roles */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Thông báo"
            >
              <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white text-base">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-white hover:text-blue-100 underline transition-colors"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-white hover:text-blue-100 underline transition-colors ml-auto"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-y-auto flex-1" style={{ maxHeight: '500px' }}>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
                      <p className="text-sm">Không có thông báo mới</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification, index) => (
                        <button
                          key={index}
                          onClick={() => handleNotificationClick(notification, index)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-all duration-200 border-l-4 ${
                            notification.priority === 'high' ? 'border-red-500' :
                            notification.priority === 'medium' ? 'border-yellow-500' :
                            'border-blue-500'
                          } ${!notification.isRead ? 'bg-blue-50' : 'opacity-75'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                  {formatTime(notification.timestamp)}
                                </span>
                                {notification.priority === 'high' && (
                                  <span className="text-xs font-medium text-red-600">
                                    Ưu tiên cao
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate('/notifications');
                      }}
                      className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors py-1"
                    >
                      Xem tất cả thông báo →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">{userEmail}</div>
                <div className="text-xs text-gray-500">{getRoleDisplayName()}</div>
              </div>

              {avatarUrl && avatarUrl.trim() !== '' ? (
                <img
                  src={`http://localhost:8080${avatarUrl}`}
                  alt="Ảnh đại diện"
                  className="w-10 h-10 rounded-full object-cover shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              
              <div 
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow-md"
                style={{ display: avatarUrl && avatarUrl.trim() !== '' ? 'none' : 'flex' }}
              >
                {initials}
              </div>

              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="font-semibold text-gray-800">{userEmail}</div>
                  <div className="text-xs text-gray-500 mt-1">Quản lý tài khoản của bạn</div>
                </div>

                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-800">Hồ sơ của tôi</div>
                      <div className="text-xs text-gray-500">Xem và chỉnh sửa thông tin</div>
                    </div>
                  </button>

                  <button
                    onClick={handleChangePasswordClick}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-800">Đổi mật khẩu</div>
                      <div className="text-xs text-gray-500">Cập nhật mật khẩu mới</div>
                    </div>
                  </button>

                  <div className="border-t border-gray-100 my-2"></div>

                  <button
                    onClick={handleLogoutClick}
                    className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium">Đăng xuất</div>
                      <div className="text-xs opacity-75">Thoát khỏi tài khoản</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}