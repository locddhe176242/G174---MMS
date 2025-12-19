import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faShield, faBars, faKey, faUsers,
  faMoneyBillWave, faShoppingCart, faClock, faBoxOpen,
  faWarehouse, faShoppingBag, faExclamationTriangle,
  faTruck, faBox, faCreditCard, faFileInvoice,
  faChartLine, faHourglassHalf, faBoxes, faReceipt, faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../../store/authStore";
import { dashboardService } from "../../../api/dashboardService";
import { activityLogService } from "../../../api/activityLogService";
import { toast } from "react-toastify";

export default function Dashboard() {
  const { roles, user } = useAuthStore();
  const isManager = roles && roles.includes('MANAGER');
  const isWarehouse = roles && roles.includes('WAREHOUSE');
  const isAccounting = roles && roles.includes('ACCOUNTING');
  const isSale = roles && roles.includes('SALE');
  const isPurchase = roles && roles.includes('PURCHASE');
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    if (isManager) {
      fetchRecentActivities();
    }
  }, [user, isManager]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardStats();
      console.log("Dashboard data received:", data);
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
      // Lấy hoạt động của toàn hệ thống (nhiều users/roles)
      const activities = await activityLogService.getRecentSystemActivityLogs(10);
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
      icon: faMoneyBillWave,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      changeColor: "text-slate-600",
      roles: ['MANAGER', 'SALE', 'ACCOUNTING']
    },
    {
      label: "Đơn mua hàng",
      value: formatNumber(dashboardData.purchaseSummary?.totalOrders || 0),
      change: `${formatNumber(dashboardData.purchaseSummary?.pendingOrders || 0)} chờ xử lý`,
      icon: faShoppingCart,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      changeColor: "text-slate-600",
      link: "/approval",
      roles: ['MANAGER', 'PURCHASE']
    },
    {
      label: "Đơn bán hàng",
      value: formatNumber(dashboardData.salesSummary?.totalOrders || 0),
      change: `${formatNumber(dashboardData.salesSummary?.pendingOrders || 0)} chờ xử lý`,
      icon: faShoppingBag,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      changeColor: "text-slate-600",
      link: "/approval",
      roles: ['MANAGER', 'SALE']
    },
    {
      label: "Sản phẩm sắp hết",
      value: formatNumber(dashboardData.lowStockProducts?.length || 0),
      change: "Cần nhập thêm",
      icon: faExclamationTriangle,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      changeColor: "text-red-600",
      roles: ['MANAGER', 'SALE']
    },
    {
      label: "Tổng tồn kho",
      value: formatNumber(dashboardData.inventorySummary?.totalQuantity || 0),
      change: "Sản phẩm",
      icon: faBoxes,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      changeColor: "text-slate-600",
      roles: ['MANAGER', 'WAREHOUSE', 'PURCHASE']
    }
  ].filter(stat => !stat.roles || stat.roles.some(role => roles.includes(role))) : [];

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
  
  // Generate weekly data for the past 4 weeks instead of monthly data
  const generateDailyData = () => {
    const currentDate = new Date();
    const days = [];
    
    // Lấy 7 ngày gần nhất: từ hôm nay trở về trước
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(currentDate);
      dayDate.setDate(currentDate.getDate() - i);
      
      // Generate some sample data based on day
      const baseImport = 5 + Math.floor(Math.random() * 15);
      const baseExport = 3 + Math.floor(Math.random() * 12);
      
      days.push({
        date: `${dayDate.getDate()}/${dayDate.getMonth() + 1}`,
        importCount: baseImport,
        exportCount: baseExport
      });
    }
    
    return days;
  };
  
  // Use daily data (7 days)
  const dailyData = dashboardData?.dailyImportExport || generateDailyData();
  


  // Warehouse-specific data
  const pendingInboundDeliveries = dashboardData?.pendingInboundDeliveries || [];
  const pendingDeliveries = dashboardData?.pendingDeliveries || [];
  const todayActivity = dashboardData?.todayActivity || {};

  // Accounting-specific data
  const pendingAPInvoices = dashboardData?.pendingAPInvoices || [];
  const overdueARInvoices = dashboardData?.overdueARInvoices || [];
  const accountingSummary = dashboardData?.accountingSummary || {};

  // Top warehouse data
  const topWarehouses = dashboardData?.topWarehouses || [];

  // Warehouse-specific stats
  const warehouseStats = isWarehouse && dashboardData ? [
    {
      label: "Phiếu nhập hàng hôm nay",
      value: formatNumber(todayActivity.todayGoodsReceipts || 0),
      change: `${formatNumber(todayActivity.pendingGoodsReceipts || 0)} chờ xử lý`,
      icon: faBox,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      changeColor: "text-slate-600"
    },
    {
      label: "Phiếu xuất hàng hôm nay",
      value: formatNumber(todayActivity.todayGoodIssues || 0),
      change: `${formatNumber(todayActivity.pendingGoodIssues || 0)} chờ xử lý`,
      icon: faBoxOpen,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      changeColor: "text-slate-600"
    },
    {
      label: "Lệnh nhập kho chờ",
      value: formatNumber(pendingInboundDeliveries.length || 0),
      change: "Cần xử lý",
      icon: faTruck,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      changeColor: "text-orange-600"
    },
    {
      label: "Đơn xuất kho chờ",
      value: formatNumber(pendingDeliveries.length || 0),
      change: "Cần chuẩn bị",
      icon: faReceipt,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      changeColor: "text-purple-600"
    }
  ] : [];

  // Accounting-specific stats
  const accountingStats = isAccounting && dashboardData ? [
    {
      label: "Tổng phải trả NCC",
      value: formatCurrency(accountingSummary.totalAccountsPayable || 0),
      change: `${formatNumber(accountingSummary.pendingAPInvoicesCount || 0)} hóa đơn`,
      icon: faCreditCard,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      changeColor: "text-slate-600"
    },
    {
      label: "Tổng phải thu KH",
      value: formatCurrency(accountingSummary.totalAccountsReceivable || 0),
      change: `${formatNumber(accountingSummary.overdueARInvoicesCount || 0)} quá hạn`,
      icon: faFileInvoice,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      changeColor: "text-orange-600"
    },
    {
      label: "Thanh toán 7 ngày tới",
      value: formatCurrency(accountingSummary.upcomingPayments7Days || 0),
      change: "Cần chuẩn bị",
      icon: faClock,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      changeColor: "text-yellow-600"
    },
    {
      label: "Công nợ quá hạn",
      value: formatCurrency(accountingSummary.overdueReceivables || 0),
      change: "Cần thu hồi",
      icon: faExclamationTriangle,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      changeColor: "text-orange-600"
    }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(isWarehouse ? warehouseStats : isAccounting ? accountingStats : stats).map((stat, index) => {
          const CardWrapper = stat.link ? Link : 'div';
          const cardProps = stat.link ? { to: stat.link } : {};
          
          return (
            <CardWrapper
              key={index}
              {...cardProps}
              className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition ${stat.link ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <FontAwesomeIcon icon={stat.icon} className={`text-2xl ${stat.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</p>
                <p className={`text-sm ${stat.changeColor}`}>{stat.change}</p>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Warehouse-specific widgets */}
      {isWarehouse && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Inbound Deliveries Widget */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Lệnh nhập kho chờ xử lý
              </h2>
              {pendingInboundDeliveries.length > 0 && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                  {pendingInboundDeliveries.length}
                </span>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingInboundDeliveries.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-400">Không có lệnh nhập kho chờ xử lý</p>
                </div>
              ) : (
                pendingInboundDeliveries.map((delivery) => (
                  <div
                    key={delivery.inboundDeliveryId}
                    className="border border-slate-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">
                          {delivery.inboundDeliveryNo}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          PO: {delivery.purchaseOrderNo}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        delivery.status === 'Pending' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {delivery.status === 'Pending' ? 'Chờ xử lý' : 'Đang vận chuyển'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        Nhà cung cấp: <span className="font-medium text-slate-800">{delivery.vendorName}</span>
                      </span>
                      <span className="text-slate-600">
                        {delivery.totalItems} mặt hàng
                      </span>
                    </div>
                    {delivery.expectedDate && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          Dự kiến: {new Date(delivery.expectedDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Deliveries Widget */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Đơn xuất kho chờ chuẩn bị
              </h2>
              {pendingDeliveries.length > 0 && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                  {pendingDeliveries.length}
                </span>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingDeliveries.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-400">Không có đơn xuất kho chờ chuẩn bị</p>
                </div>
              ) : (
                pendingDeliveries.map((delivery) => (
                  <div
                    key={delivery.deliveryId}
                    className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">
                          {delivery.deliveryNo}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          SO: {delivery.salesOrderNo}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                        Chờ xuất kho
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        Khách hàng: <span className="font-medium text-slate-800">{delivery.customerName}</span>
                      </span>
                      <span className="text-slate-600">
                        {delivery.totalItems} mặt hàng
                      </span>
                    </div>
                    {delivery.expectedDate && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          Dự kiến giao: {new Date(delivery.expectedDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accounting-specific widgets */}
      {isAccounting && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending AP Invoices Widget */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Hóa đơn phải trả chờ thanh toán
              </h2>
              {pendingAPInvoices.length > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                  {pendingAPInvoices.length}
                </span>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingAPInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-400">Không có hóa đơn phải trả chờ thanh toán</p>
                </div>
              ) : (
                pendingAPInvoices.map((invoice) => {
                  const daysUntilDue = invoice.daysUntilDue || 0;
                  const isOverdue = daysUntilDue < 0;
                  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;
                  
                  return (
                    <div
                      key={invoice.apInvoiceId}
                      className={`border rounded-lg p-4 hover:shadow-sm transition ${
                        isOverdue ? 'border-red-300 bg-red-50' : 
                        isDueSoon ? 'border-yellow-300 bg-yellow-50' : 
                        'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-sm">
                            {invoice.invoiceNo}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            NCC: {invoice.vendorName}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          isOverdue ? 'bg-red-100 text-red-700' : 
                          isDueSoon ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {isOverdue ? `Quá hạn ${Math.abs(daysUntilDue)} ngày` : 
                           isDueSoon ? `Còn ${daysUntilDue} ngày` : 
                           'Chờ thanh toán'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div className="text-slate-600">
                          Tổng: <span className="font-semibold text-slate-800">
                            {(invoice.totalAmount / 1000000).toFixed(1)}tr
                          </span>
                        </div>
                        <div className="text-slate-600">
                          Còn lại: <span className="font-semibold text-red-600">
                            {(invoice.balanceAmount / 1000000).toFixed(1)}tr
                          </span>
                        </div>
                      </div>
                      {invoice.dueDate && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            Hạn TT: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Overdue AR Invoices Widget */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Công nợ quá hạn cần thu hồi
              </h2>
              {overdueARInvoices.length > 0 && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                  {overdueARInvoices.length}
                </span>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {overdueARInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-400">Không có công nợ quá hạn</p>
                </div>
              ) : (
                overdueARInvoices.map((invoice) => {
                  const daysOverdue = invoice.daysOverdue || 0;
                  const severityColor = daysOverdue > 30 ? 'red' : daysOverdue > 14 ? 'orange' : 'yellow';
                  
                  return (
                    <div
                      key={invoice.arInvoiceId}
                      className={`border border-${severityColor}-300 bg-${severityColor}-50 rounded-lg p-4 hover:shadow-sm transition`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-sm">
                            {invoice.invoiceNo}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            KH: {invoice.customerName}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded bg-${severityColor}-100 text-${severityColor}-700`}>
                          Quá hạn {daysOverdue} ngày
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div className="text-slate-600">
                          Tổng: <span className="font-semibold text-slate-800">
                            {(invoice.totalAmount / 1000000).toFixed(1)}tr
                          </span>
                        </div>
                        <div className="text-slate-600">
                          Còn lại: <span className="font-semibold text-orange-600">
                            {(invoice.balanceAmount / 1000000).toFixed(1)}tr
                          </span>
                        </div>
                      </div>
                      {invoice.dueDate && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            Đã quá hạn: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts - Show for non-warehouse and non-accounting roles */}
      {!isWarehouse && !isAccounting && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chỉ hiển thị biểu đồ nhập/xuất cho MANAGER và PURCHASE */}
        {(isManager || isPurchase) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Nhập/Xuất hàng theo ngày (7 ngày gần nhất)
          </h2>
          {dailyData && dailyData.length > 0 ? (
            <div className="h-64 flex items-end justify-center gap-4 border-b border-slate-200 pb-2">
              <div className="flex-1 flex items-end justify-around h-full">
                {dailyData.map((data, i) => {
                  const maxValue = Math.max(...dailyData.map(d => Math.max(d.importCount || 0, d.exportCount || 0)));
                  const importHeight = maxValue > 0 ? (data.importCount / maxValue) * 100 : 0;
                  const exportHeight = maxValue > 0 ? (data.exportCount / maxValue) * 100 : 0;
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex items-end gap-1 w-full justify-center h-full">
                        <div
                          className="w-3 bg-brand-blue rounded-t"
                          style={{ height: `${importHeight}%` }}
                          title={`Nhập: ${data.importCount || 0}`}
                        />
                        <div
                          className="w-3 bg-green-500 rounded-t"
                          style={{ height: `${exportHeight}%` }}
                          title={`Xuất: ${data.exportCount || 0}`}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-600 font-medium">{data.date}</div>
                      </div>
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
                <p className="text-sm">Chưa có dữ liệu nhập/xuất trong 7 ngày gần nhất</p>
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
        )}

        {/* Widget cho SALE - Sản phẩm sắp hết hàng */}
        {isSale && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Sản phẩm sắp hết hàng
            </h2>
            {lowStockProducts.length > 0 && (
              <Link
                to="/products"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem tất cả
              </Link>
            )}
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {lowStockProducts && lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.productId}
                  className="border border-slate-200 rounded-lg p-3 hover:border-orange-300 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm">
                        {product.productName}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {product.categoryName}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      product.stockPercentage < 20 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          product.stockPercentage < 20 ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(product.stockPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                      {product.currentStock}/{product.minStock}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-400">Tất cả sản phẩm còn đủ hàng</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Top kho - CHỈ cho MANAGER và PURCHASE */}
        {(isManager || isPurchase) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Top kho theo doanh thu
          </h2>
          <div className="space-y-4">
            {topWarehouses && topWarehouses.length > 0 ? (
              topWarehouses.slice(0, 5).map((warehouse, index) => {
                const maxRevenue = Math.max(...topWarehouses.map(w => w.totalRevenue || 0));
                const percentage = maxRevenue > 0 ? (warehouse.totalRevenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={warehouse.warehouseId || index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {warehouse.warehouseName || `Kho ${index + 1}`}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {formatCurrency(warehouse.totalRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>{warehouse.warehouseCode}</span>
                      <span>{formatNumber(warehouse.totalOrders || 0)} đơn</span>
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
        )}
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hoạt động gần đây - Chỉ hiển thị cho MANAGER */}
        {isManager && (
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800 text-sm">
                        {activity.activityType}{activity.tableName && activity.tableName !== activity.activityType ? ` - ${activity.tableName}` : ''}
                      </p>
                      {(activity.userFullName || activity.userName) && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {activity.userFullName || activity.userName}
                        </span>
                      )}
                    </div>
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
        )}

        {/* Sản phẩm sắp hết hàng - Hiển thị cho tất cả TRỪ SALE (vì SALE đã có ở grid charts) */}
        {!isSale && (
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
        )}
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
