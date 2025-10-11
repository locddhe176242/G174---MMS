import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMenuByRole, getPermissionBadge, PERMISSIONS } from "../../config/menuConfig";

export default function Sidebar({ isCollapsed = false, userRole = "MANAGER" }) {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState({});
  
  const menuConfig = getMenuByRole(userRole);

  const toggleDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const MenuItem = ({ item, level = 0 }) => {
    const isActive = item.path && location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns[item.id];

    if (hasChildren && !isCollapsed) {
      return (
        <div>
          <button
            onClick={() => toggleDropdown(item.id)}
            className="relative group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue transition-all duration-200"
          >
            <span className="w-5 h-5 flex-shrink-0 text-brand-blue">
              {item.icon}
            </span>
            <span className="flex-1 font-medium text-sm text-left whitespace-nowrap">
              {item.label}
            </span>
            {item.badge && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {item.badge}
              </span>
            )}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {isOpen && (
            <div className="mt-1 ml-8 space-y-1">
              {item.children.map(child => (
                <Link
                  key={child.id}
                  to={child.path}
                  className={`
                    flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition
                    ${location.pathname === child.path
                      ? "bg-brand-blue-50 text-brand-blue font-medium"
                      : "text-slate-600 hover:text-brand-blue hover:bg-brand-blue-50"
                    }
                  `}
                >
                  <span>{child.label}</span>
                  {child.badge && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {child.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (hasChildren && isCollapsed) {
      return (
        <button
          onClick={() => {}}
          className="relative group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue transition-all duration-200"
          title={item.label}
        >
          <span className="w-5 h-5 flex-shrink-0 text-brand-blue">
            {item.icon}
          </span>
          
          <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            {item.label}
            {item.children && (
              <div className="mt-1 text-xs text-slate-300">
                {item.children.map(c => c.label).join(', ')}
              </div>
            )}
          </div>
        </button>
      );
    }

    return (
      <Link
        to={item.path}
        className={`
          relative group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
          ${isActive 
            ? "bg-brand-blue text-white shadow-sm" 
            : "text-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue"
          }
        `}
        title={isCollapsed ? item.label : ""}
      >
        <span className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-brand-blue"}`}>
          {item.icon}
        </span>
        {!isCollapsed && (
          <span className="flex-1 font-medium text-sm whitespace-nowrap">
            {item.label}
          </span>
        )}
        {!isCollapsed && item.badge && (
          <span className={`text-xs px-2 py-0.5 rounded ${
            isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {item.badge}
          </span>
        )}
        
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            {item.label}
            {item.badge && <span className="ml-2 text-xs text-slate-300">({item.badge})</span>}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`
        relative border-r border-slate-200 bg-white overflow-y-auto overflow-x-hidden flex-shrink-0 transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"}
      `}
      style={{ fontFamily: "Roboto, sans-serif" }}
    >
      <div className="p-4">
        {menuConfig.mainMenu && menuConfig.mainMenu.length > 0 && (
          <div className="mb-6">
            {!isCollapsed && (
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-3">
                Menu chính
              </div>
            )}
            <nav className="space-y-1">
              {menuConfig.mainMenu.map(item => (
                <MenuItem key={item.id} item={item} />
              ))}
            </nav>
          </div>
        )}

        {menuConfig.managementMenu && menuConfig.managementMenu.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            {!isCollapsed && (
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-3">
                Quản lý
              </div>
            )}
            <nav className="space-y-1">
              {menuConfig.managementMenu.map(item => (
                <MenuItem key={item.id} item={item} />
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
