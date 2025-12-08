import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShield, faBars, faKey, faUsers } from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../../store/authStore";
import { dashboardService } from "../../../api/dashboardService";
import { activityLogService } from "../../../api/activityLogService";
import { toast } from "react-toastify";

export default function Dashboard() {
  const { roles, user } = useAuthStore();
  const isManager = roles && roles.includes('MANAGER');
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    if (user?.userId) {
      fetchRecentActivities();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardStats();
      console.log("Dashboard data received:", data);
      console.log("Low stock products:", data?.lowStockProducts);
      console.log("Monthly data:", data?.monthlyImportExport);
      console.log("Warehouse revenue:", data?.warehouseRevenue);
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activities = await activityLogService.getRecentUserActivityLogs(user.userId, 5);
      setRecentActivities(activities || []);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
    }
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    return num.toLocaleString('vi-VN');
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    return `${(amount / 1000000000).toFixed(1)} tỷ đ`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const stats = dashboardData ? [
    {
      label: "Doanh thu bán hàng",
      value: formatCurrency(dashboardData.salesSummary?.totalRevenue || 0),
      change: `${formatNumber(dashboardData.salesSummary?.totalOrders || 0)} đơn hàng`,
      icon: "💰",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      changeColor: "text-slate-600"
    },
    {
      label: "Tổng tồn kho",
      value: formatNumber(dashboardData.inventorySummary?.totalQuantity || 0),
      change: "Sản phẩm",
      icon: "📦",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      changeColor: "text-slate-600"
    },
    {
      label: "Đơn mua hàng",
      value: formatNumber(dashboardData.purchaseSummary?.totalOrders || 0),
      change: `${formatNumber(dashboardData.purchaseSummary?.pendingOrders || 0)} chờ xử lý`,
      icon: "🛒",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      changeColor: "text-slate-600"
    },
    {
      label: "Đơn bán hàng",
      value: formatNumber(dashboardData.salesSummary?.totalOrders || 0),
      change: `${formatNumber(dashboardData.salesSummary?.deliveredOrders || 0)} đã giao`,
      icon: "📋",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      changeColor: "text-slate-600"
    }
  ] : [];

  const getActivityIcon = (activityType) => {
    const iconMap = {
      'CREATE': '✅',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'EXPORT': '📤',
      'IMPORT': '📥',
      'VIEW': '👁️',
      'LOGIN': '🔐',
      'LOGOUT': '🚪',
      'APPROVE': '✓',
      'REJECT': '✗'
    };
    return iconMap[activityType] || '📋';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  const lowStockProducts = dashboardData?.lowStockProducts || [];
  
  // Monthly data - use from API or fallback to empty for now
  const monthlyData = dashboardData?.monthlyImportExport || null;
  
  // Warehouse revenue - use from API or fallback to empty for now  
  const warehouseRevenue = dashboardData?.warehouseRevenue || null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</p>
              <p className={`text-sm ${stat.changeColor}`}>{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Nhập/Xuất hàng theo tháng
          </h2>
          {monthlyData && monthlyData.length > 0 ? (
            <div className="h-64 flex items-end justify-center gap-4 border-b border-slate-200 pb-2">
              <div className="flex-1 flex items-end justify-around h-full">
                {monthlyData.map((data, i) => {
                  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.importQuantity || 0, d.exportQuantity || 0)));
                  const importHeight = maxValue > 0 ? (data.importQuantity / maxValue) * 100 : 0;
                  const exportHeight = maxValue > 0 ? (data.exportQuantity / maxValue) * 100 : 0;
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex items-end gap-1 w-full justify-center h-full">
                        <div
                          className="w-2 bg-brand-blue rounded-t"
                          style={{ height: `${importHeight}%` }}
                          title={`Nhập: ${data.importQuantity || 0}`}
                        />
                        <div
                          className="w-2 bg-green-500 rounded-t"
                          style={{ height: `${exportHeight}%` }}
                          title={`Xuất: ${data.exportQuantity || 0}`}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{data.month || i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">Chưa có dữ liệu nhập/xuất</p>
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-blue rounded"></div>
              <span className="text-slate-600">Nhập hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-slate-600">Xuất hàng</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Top kho theo doanh thu
          </h2>
          <div className="space-y-4">
            {warehouseRevenue && warehouseRevenue.length > 0 ? (
              warehouseRevenue.slice(0, 5).map((warehouse, index) => {
                const maxRevenue = Math.max(...warehouseRevenue.map(w => w.revenue || 0));
                const percentage = maxRevenue > 0 ? (warehouse.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={warehouse.warehouseId || index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {warehouse.warehouseName || `Kho ${index + 1}`}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {(warehouse.revenue / 1000000).toFixed(0)}M
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-slate-800 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm text-slate-400">Chưa có dữ liệu doanh thu kho</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Hoạt động gần đây
          </h2>
          <div className="space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.logId}
                  className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">
                      {activity.activityType} - {activity.tableName}
                    </p>
                    <p className="text-slate-600 text-xs mt-0.5">
                      {activity.description || 'Không có mô tả'}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {formatTimeAgo(activity.logDate)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Chưa có hoạt động nào</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Sản phẩm sắp hết hàng
            </h2>
            <Link 
              to="/products" 
              className="px-3 py-1 text-sm font-medium text-brand-blue bg-blue-50 rounded hover:bg-blue-100 transition"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-4">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Không có sản phẩm sắp hết hàng</p>
            ) : (
              lowStockProducts.map((product) => {
                const percentage = product.stockPercentage || 0;
                const statusColor = 
                  product.status === "Cực thấp" 
                    ? "bg-red-100 text-red-700" 
                    : product.status === "Cần bổ sung" 
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700";
                
                const barColor = percentage < 30 ? "bg-red-500" : "bg-orange-500";
                
                return (
                  <div key={product.productId} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {product.productName}
                        </p>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {product.categoryName}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${statusColor} whitespace-nowrap ml-2`}
                      >
                        {product.status}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">
                          Tồn kho: <span className="font-semibold text-slate-800">{product.currentStock}</span>
                        </span>
                        <span className="text-slate-600">
                          Tối thiểu: <span className="font-semibold text-slate-800">{product.minStock}</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Admin Quick Links - Only for MANAGER */}
      {isManager && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faShield} className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Admin Panel</h2>
              <p className="text-sm text-slate-600">Quản lý phân quyền và permissions</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/roles"
              className="bg-white border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all group"
            >
              <FontAwesomeIcon icon={faShield} className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-slate-800 mb-1">Roles</h3>
              <p className="text-xs text-slate-600">Quản lý roles & assign menus/permissions</p>
            </Link>

            <Link
              to="/admin/menus"
              className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <FontAwesomeIcon icon={faBars} className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-slate-800 mb-1">Menus</h3>
              <p className="text-xs text-slate-600">Tạo, sửa, xóa menu items</p>
            </Link>

            <Link
              to="/admin/permissions"
              className="bg-white border-2 border-green-200 rounded-lg p-4 hover:border-green-400 hover:shadow-md transition-all group"
            >
              <FontAwesomeIcon icon={faKey} className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-slate-800 mb-1">Permissions</h3>
              <p className="text-xs text-slate-600">Quản lý permissions trong hệ thống</p>
            </Link>

            <Link
              to="/admin/user-permissions"
              className="bg-white border-2 border-orange-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-md transition-all group"
            >
              <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-slate-800 mb-1">User Permissions</h3>
              <p className="text-xs text-slate-600">Cấp/thu hồi quyền cho users</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
