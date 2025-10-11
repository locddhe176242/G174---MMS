import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import Header from "./Header";
import Sidebar from "./SideBar";
import RoleSwitcher from "../RoleSwitcher";

export default function MainLayout() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { user, roles, getPrimaryRole, logout: authLogout, initializeAuth } = useAuthStore();
  
  const [userRole, setUserRole] = useState(() => {
    const primaryRole = getPrimaryRole();
    return primaryRole || "MANAGER";
  });
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  useEffect(() => {
    const primaryRole = getPrimaryRole();
    if (primaryRole) {
      setUserRole(primaryRole);
    }
  }, [getPrimaryRole]);

  const handleLogout = async () => {
    await authLogout();
    navigate("/login", { replace: true });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        userName={user?.fullName || user?.email || "User"}
        role={userRole}
        notifications={3}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isCollapsed={isSidebarCollapsed} userRole={userRole} />

        <button
          onClick={toggleSidebar}
          className={`
            fixed top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-brand-blue to-blue-600 text-white rounded-r-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center group z-50
            ${isSidebarCollapsed ? "left-20" : "left-64"}
          `}
          aria-label={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {isSidebarCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transition-transform group-hover:scale-110">
              <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transition-transform group-hover:scale-110">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>

      <RoleSwitcher currentRole={userRole} onRoleChange={setUserRole} />
    </div>
  );
}
