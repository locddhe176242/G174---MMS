import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../assets/mms_logo.svg';

export default function Header({
  userEmail = "User",
  avatarUrl = null,
  onLogout = () => {},
}) {
  console.log('Header avatarUrl:', avatarUrl);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const initials = userEmail
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">{userEmail}</div>
                <div className="text-xs text-gray-500">Xem hồ sơ</div>
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