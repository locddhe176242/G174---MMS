import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getMenuForCurrentUser } from "../../api/menuService";

/**
 * Sidebar Component - Dynamic Menu Loading
 * Load menu configuration từ API theo role của user
 */

// Icon mapping - Map icon names from backend to actual SVG icons
const iconMap = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
    </svg>
  ),
    products: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 007.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 004.902-5.652l-1.3-1.299a1.875 1.875 0 00-1.325-.549H5.223z" />
        <path fillRule="evenodd" d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 009.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 002.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3zm3-6a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-3zm8.25-.75a.75.75 0 00-.75.75v5.25c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-5.25a.75.75 0 00-.75-.75h-3z" clipRule="evenodd" />
      </svg>
    ),
    warehouse: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
      </svg>
    ),
    import: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
      </svg>
    ),
    export: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
      </svg>
    ),
    customers: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
      </svg>
    ),
    vendors: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
        <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
      </svg>
    ),
    accounting: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
        <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
        <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
      </svg>
    ),
    approval: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
      </svg>
    ),
    reports: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
      </svg>
    ),
  staff: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
    </svg>
  ),
  // Thêm icon mặc định cho các menu items không có icon
  default: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Get icon JSX từ icon name (string từ backend)
 * @param {string} iconName - Tên icon (home, products, customers, ...)
 * @returns {JSX.Element}
 */
const getIcon = (iconName) => {
  return iconMap[iconName] || iconMap.default;
};

export default function Sidebar({ isCollapsed = false }) {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [menuConfig, setMenuConfig] = useState({
    mainMenu: [],
    operationMenu: [],
    managementMenu: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load menu từ API
  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getMenuForCurrentUser();
        
        // Transform menu data: thêm icon JSX vào menu items
        const transformMenu = (menuItems) => {
          return menuItems.map((item) => {

            const absolutePath = item.menuPath?.startsWith("/")
                ? item.menuPath
                : `/${item.menuPath}`;
            return {
              ...item,
              id: item.menuKey,
              path: absolutePath,
              label: item.menuLabel,
              icon: getIcon(item.iconName),
            };
          });
        };
        
        setMenuConfig({
          mainMenu: data.mainMenu ? transformMenu(data.mainMenu) : [],
          operationMenu: data.operationMenu ? transformMenu(data.operationMenu) : [],
          managementMenu: data.managementMenu ? transformMenu(data.managementMenu) : [],
        });
      } catch (err) {
        console.error('Error loading menu:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const toggleDropdown = (id) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const MenuItem = ({ item }) => {
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
            <span className="w-5 h-5 flex-shrink-0 text-brand-blue">{item.icon}</span>
            <span className="flex-1 font-medium text-sm text-left whitespace-nowrap">{item.label}</span>
            {item.badge && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.badge}</span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {isOpen && (
            <div className="mt-1 ml-8 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.id}
                  to={child.path}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition ${
                    location.pathname === child.path
                      ? "bg-brand-blue-50 text-brand-blue font-medium"
                      : "text-slate-600 hover:text-brand-blue hover:bg-brand-blue-50"
                  }`}
                >
                  <span>{child.label}</span>
                  {child.badge && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{child.badge}</span>
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
          <span className="w-5 h-5 flex-shrink-0 text-brand-blue">{item.icon}</span>

          <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            {item.label}
            {item.children && (
              <div className="mt-1 text-xs text-slate-300">{item.children.map((c) => c.label).join(", ")}</div>
            )}
          </div>
        </button>
      );
    }

    return (
      <Link
        to={item.path}
        className={`relative group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
          isActive ? "bg-brand-blue text-white shadow-sm" : "text-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue"
        }`}
        title={isCollapsed ? item.label : ""}
      >
        <span className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-brand-blue"}`}>{item.icon}</span>
        {!isCollapsed && <span className="flex-1 font-medium text-sm whitespace-nowrap">{item.label}</span>}
        {!isCollapsed && item.badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
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

  // Loading state
  if (loading) {
    return (
      <aside
        className={`relative border-r border-slate-200 bg-white overflow-y-auto overflow-x-hidden flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        style={{ fontFamily: "Roboto, sans-serif" }}
      >
        <div className="p-4 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
        </div>
      </aside>
    );
  }

  // Error state
  if (error) {
    return (
      <aside
        className={`relative border-r border-slate-200 bg-white overflow-y-auto overflow-x-hidden flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        style={{ fontFamily: "Roboto, sans-serif" }}
      >
        <div className="p-4">
          <div className="text-red-500 text-sm">
            <p className="font-semibold">Lỗi tải menu</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`relative border-r border-slate-200 bg-white overflow-y-auto overflow-x-hidden flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      style={{ fontFamily: "Roboto, sans-serif" }}
    >
      <div className="p-4">
        {/* Menu Chính */}
        {menuConfig.mainMenu && menuConfig.mainMenu.length > 0 && (
          <div className="mb-4">
            {!isCollapsed && (
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-3">Menu chính</div>
            )}
            <nav className="space-y-1">
              {menuConfig.mainMenu.map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </nav>
          </div>
        )}

        {/* Operation Menu (không có header) */}
        {menuConfig.operationMenu && menuConfig.operationMenu.length > 0 && (
          <div className="mb-4">
            <nav className="space-y-1">
              {menuConfig.operationMenu.map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </nav>
          </div>
        )}

        {/* Quản lý */}
        {menuConfig.managementMenu && menuConfig.managementMenu.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            {!isCollapsed && (
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-3">Quản lý</div>
            )}
            <nav className="space-y-1">
              {menuConfig.managementMenu.map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
