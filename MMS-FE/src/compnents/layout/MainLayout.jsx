import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { dashboardService } from "../../api/dashboardService";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const { user, logout, roles } = useAuthStore();
  console.log('MainLayout user:', user);
  const isWarehouse = roles && roles.includes('WAREHOUSE');

  useEffect(() => {
    // Fetch pending tasks count for warehouse role
    if (isWarehouse) {
      fetchPendingTasksCount();
      // Refresh every 5 minutes
      const interval = setInterval(fetchPendingTasksCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isWarehouse]);

  const fetchPendingTasksCount = async () => {
    try {
      const data = await dashboardService.getDashboardStats();
      const inboundCount = data?.pendingInboundDeliveries?.length || 0;
      const deliveryCount = data?.pendingDeliveries?.length || 0;
      setPendingTasksCount(inboundCount + deliveryCount);
    } catch (error) {
      console.error("Error fetching pending tasks:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        userEmail={user?.email || "Người dùng"}
        avatarUrl={user?.avatarUrl || null}
        onLogout={handleLogout}
        pendingTasksCount={pendingTasksCount}
      />

      <div className="flex flex-1 relative">
        <Sidebar isCollapsed={isSidebarCollapsed} />

        <button
          onClick={toggleSidebar}
          className={`fixed top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-brand-blue to-blue-600 text-white rounded-r-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center group z-50 ${
            isSidebarCollapsed ? "left-20" : "left-64"
          }`}
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

        <main className={`flex-1 overflow-y-auto p-6 bg-gray-50 transition-all duration-300 ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}