import React from "react";
import logo from '../../assets/mms_logo.svg';

export default function Header({
  title = "Material Management System",
  userName = "Nguyen Van A",
  role = "Nhân viên kho",
  notifications = 3,
  onLogout = () => {},
}) {
  const initials = userName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white shadow-sm">
      <header className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MMS logo" className="w-10 h-10 object-contain" />
          <div>
            <div className="text-sm font-semibold text-gray-800">{title}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-2 rounded hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
            </svg>

            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {notifications}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-800">{userName}</div>
              <div className="text-xs text-gray-500">{role}</div>
            </div>

            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-medium text-gray-700">
              {initials}
            </div>

            <button
              onClick={onLogout}
              type="button"
              aria-label="Đăng xuất"
              className="ml-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}