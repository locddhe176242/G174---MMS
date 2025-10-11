import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShield, faBars, faKey, faUsers } from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../../store/authStore";

export default function Dashboard() {
  const { roles } = useAuthStore();
  const isManager = roles && roles.includes('MANAGER');
  const stats = [
    {
      label: "Tổng giá trị kho",
      value: "2.4 tỷ đ",
      change: "+12.5%",
      icon: "💰",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      changeColor: "text-green-600"
    },
    {
      label: "Tổng sản phẩm",
      value: "8,524",
      change: "+3.2%",
      icon: "📦",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      changeColor: "text-blue-600"
    },
    {
      label: "Đơn nhập hàng",
      value: "145",
      change: "Tháng này",
      icon: "🛒",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      changeColor: "text-slate-600"
    },
    {
      label: "Sản xuất hàng",
      value: "23",
      change: "+2 đơn hôm nay",
      icon: "⚠️",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      changeColor: "text-slate-600"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      title: "Nhập kho PN00244-145",
      description: "200 sản phẩm mới nhập kho",
      time: "15 phút trước",
      type: "import",
      icon: "✅"
    },
    {
      id: 2,
      title: "Xuất hàng PN00204-492",
      description: "88 sản phẩm xuất kho thành công",
      time: "1 giờ trước",
      type: "export",
      icon: "📤"
    },
    {
      id: 3,
      title: "Cảnh báo tồn kho thấp",
      description: "iPhone 15 Pro còn dưới 5 sản phẩm",
      time: "3 giờ trước",
      type: "warning",
      icon: "⚠️"
    },
    {
      id: 4,
      title: "Nhập hàng PN00224-144",
      description: "288 sản phẩm mới nhập kho",
      time: "5 giờ trước",
      type: "import",
      icon: "✅"
    }
  ];

  const lowStockProducts = [
    {
      id: 1,
      name: "iPhone 15 Pro Max 256GB",
      category: "Điện tử",
      current: 8,
      target: 75,
      status: "Cực thấp",
      statusColor: "bg-red-100 text-red-700"
    },
    {
      id: 2,
      name: "Samsung Galaxy S24 Ultra",
      category: "Điện tử",
      current: 12,
      target: 80,
      status: "Cần bổ sung",
      statusColor: "bg-orange-100 text-orange-700"
    },
    {
      id: 3,
      name: "Áo sơ mi nam công sở",
      category: "Thời trang",
      current: 18,
      target: 100,
      statusColor: "bg-orange-100 text-orange-700"
    },
    {
      id: 4,
      name: "Bàn làm việc gỗ cao cấp",
      category: "Nội thất",
      current: 5,
      target: 20,
      status: "Cực thấp",
      statusColor: "bg-red-100 text-red-700"
    }
  ];

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
          <div className="h-64 flex items-end justify-center gap-4 border-b border-slate-200 pb-2">
            <div className="flex-1 flex items-end justify-around h-full">
              {[40, 60, 45, 75, 55, 80, 70, 85, 65, 90, 75, 60].map((height, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-4 bg-brand-blue rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-slate-500">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
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
            {[
              { name: "Kho A", value: 850, max: 1000 },
              { name: "Kho B", value: 720, max: 1000 },
              { name: "Kho C", value: 650, max: 1000 },
              { name: "Kho D", value: 580, max: 1000 },
              { name: "Kho E", value: 420, max: 1000 }
            ].map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {item.value}M
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-slate-800 h-2 rounded-full transition-all"
                    style={{ width: `${(item.value / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Hoạt động gần đây
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">
                    {activity.title}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Sản phẩm sắp hết hàng
            </h2>
            <button className="px-3 py-1 text-sm font-medium text-brand-blue bg-blue-50 rounded hover:bg-blue-100 transition">
              Xem tất cả
            </button>
          </div>
          <div className="space-y-4">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-slate-600 text-xs mt-0.5">
                      {product.category}
                    </p>
                  </div>
                  {product.status && (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${product.statusColor} whitespace-nowrap ml-2`}
                    >
                      {product.status}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">
                      Tồn kho: <span className="font-semibold text-slate-800">{product.current}</span>
                    </span>
                    <span className="text-slate-600">
                      Tối thiểu: <span className="font-semibold text-slate-800">{product.target}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (product.current / product.target) * 100 < 30
                          ? "bg-red-500"
                          : "bg-orange-500"
                      }`}
                      style={{
                        width: `${Math.min((product.current / product.target) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
