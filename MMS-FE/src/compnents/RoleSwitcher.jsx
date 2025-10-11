import React from "react";
import { ROLES } from "../config/menuConfig";

/**
 * Component để test chuyển đổi role (chỉ dùng trong development)
 * Sau này sẽ xóa component này và lấy role từ JWT token
 */
export default function RoleSwitcher({ currentRole, onRoleChange }) {
  const roles = [
    { value: ROLES.MANAGER, label: "👔 Manager", color: "bg-purple-100 text-purple-700" },
    { value: ROLES.SALE, label: "💼 Sale", color: "bg-blue-100 text-blue-700" },
    { value: ROLES.WAREHOUSE, label: "📦 Warehouse", color: "bg-green-100 text-green-700" },
    { value: ROLES.PURCHASE, label: "🛒 Purchase", color: "bg-orange-100 text-orange-700" },
    { value: ROLES.ACCOUNTING, label: "💰 Accounting", color: "bg-pink-100 text-pink-700" },
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-2xl rounded-lg p-4 border-2 border-slate-200 z-50">
      <div className="text-xs font-bold text-slate-500 uppercase mb-2">
        🔧 Dev Mode - Switch Role
      </div>
      <div className="space-y-2">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => onRoleChange(role.value)}
            className={`
              w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${currentRole === role.value 
                ? `${role.color} ring-2 ring-offset-2 ring-brand-blue` 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }
            `}
          >
            {role.label}
            {currentRole === role.value && " ✓"}
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-slate-500">
        Current: <span className="font-semibold">{currentRole}</span>
      </div>
    </div>
  );
}

