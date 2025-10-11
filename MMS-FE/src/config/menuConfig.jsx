// Menu configuration with Permission-based system

// ============================================
// ROLES DEFINITION
// ============================================
export const ROLES = {
  MANAGER: 'MANAGER',
  SALE: 'SALE',
  WAREHOUSE: 'WAREHOUSE',
  PURCHASE: 'PURCHASE',
  ACCOUNTING: 'ACCOUNTING',
};

// ============================================
// PERMISSIONS DEFINITION
// ============================================
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCT_TYPES_VIEW: 'product_types.view',
  PRODUCT_TYPES_MANAGE: 'product_types.manage',
  
  // Warehouse
  WAREHOUSE_VIEW: 'warehouse.view',
  WAREHOUSE_MANAGE: 'warehouse.manage',
  WAREHOUSE_ADJUST_STOCK: 'warehouse.adjust_stock',
  
  // Import Orders
  IMPORT_ORDERS_VIEW: 'import_orders.view',
  IMPORT_ORDERS_CREATE: 'import_orders.create',
  IMPORT_ORDERS_EDIT: 'import_orders.edit',
  IMPORT_ORDERS_APPROVE: 'import_orders.approve',
  IMPORT_ORDERS_DELETE: 'import_orders.delete',
  
  // Export Orders
  EXPORT_ORDERS_VIEW: 'export_orders.view',
  EXPORT_ORDERS_CREATE: 'export_orders.create',
  EXPORT_ORDERS_EDIT: 'export_orders.edit',
  EXPORT_ORDERS_APPROVE: 'export_orders.approve',
  EXPORT_ORDERS_DELETE: 'export_orders.delete',
  
  // Partners (Customers & Suppliers)
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',
  SUPPLIERS_VIEW: 'suppliers.view',
  SUPPLIERS_MANAGE: 'suppliers.manage',
  PARTNERS_VIEW: 'partners.view',
  PARTNERS_MANAGE: 'partners.manage',
  
  // Accounting
  ACCOUNTING_VIEW: 'accounting.view',
  ACCOUNTING_MANAGE: 'accounting.manage',
  
  // Approvals
  APPROVALS_VIEW: 'approvals.view',
  APPROVALS_MANAGE: 'approvals.manage',
  APPROVALS_PAYMENT: 'approvals.payment',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_SALES: 'reports.sales',
  REPORTS_WAREHOUSE: 'reports.warehouse',
  REPORTS_PURCHASE: 'reports.purchase',
  REPORTS_FINANCIAL: 'reports.financial',
  
  // Personnel
  PERSONNEL_VIEW: 'personnel.view',
  PERSONNEL_MANAGE: 'personnel.manage',
};

// ============================================
// ICONS (Heroicons Solid)
// ============================================
export const ICONS = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a1.5 1.5 0 01.41 1.06V19.5a2.25 2.25 0 01-2.25 2.25H15a2.25 2.25 0 01-2.25-2.25V15a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5V13.5a1.5 1.5 0 01.41-1.06l8.69-8.69z" />
    </svg>
  ),
  product: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
      <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
  warehouse: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zm3.75-1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V12zm2.25-3a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0V10.5a.75.75 0 01.75-.75zm3.75 1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V12z" clipRule="evenodd" />
    </svg>
  ),
  import: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
  ),
  export: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
  ),
  partners: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
    </svg>
  ),
  accounting: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM1.5 19.125c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v.375c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 19.5v-.375z" clipRule="evenodd" />
    </svg>
  ),
  approval: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  ),
  report: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
    </svg>
  ),
  personnel: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
      <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
    </svg>
  ),
  customer: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  ),
  supplier: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3a.75.75 0 00.75-.75V15z" />
      <path d="M8.25 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM15.75 6.75a.75.75 0 00-.75.75v11.25c0 .087.015.17.042.248a3 3 0 015.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 00-3.732-10.104 1.837 1.837 0 00-1.47-.725H15.75z" />
      <path d="M19.5 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
    </svg>
  ),
};

// ============================================
// ALL POSSIBLE MENU ITEMS (Structure Definition)
// ============================================
export const ALL_MENU_ITEMS = {
  dashboard: {
    id: 'dashboard',
    label: 'Trang chủ',
    path: '/dashboard',
    icon: ICONS.home,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    section: 'main',
  },
  
  products: {
    id: 'products',
    label: 'Sản phẩm',
    icon: ICONS.product,
    permission: PERMISSIONS.PRODUCTS_VIEW,
    section: 'main',
    children: [
      {
        id: 'product-list',
        label: 'Danh sách sản phẩm',
        path: '/products',
        permission: PERMISSIONS.PRODUCTS_VIEW,
      },
      {
        id: 'product-types',
        label: 'Nhóm / Loại',
        path: '/product-types',
        permission: PERMISSIONS.PRODUCT_TYPES_VIEW,
      },
    ],
  },
  
  warehouse: {
    id: 'warehouse',
    label: 'Kho',
    path: '/warehouse',
    icon: ICONS.warehouse,
    permission: PERMISSIONS.WAREHOUSE_VIEW,
    section: 'main',
  },
  
  importOrders: {
    id: 'import',
    label: 'Nhập hàng',
    path: '/import-orders',
    icon: ICONS.import,
    permission: PERMISSIONS.IMPORT_ORDERS_VIEW,
    section: 'main',
  },
  
  exportOrders: {
    id: 'export',
    label: 'Xuất hàng',
    path: '/export-orders',
    icon: ICONS.export,
    permission: PERMISSIONS.EXPORT_ORDERS_VIEW,
    section: 'main',
  },
  
  customers: {
    id: 'customers',
    label: 'Khách hàng',
    path: '/customers',
    icon: ICONS.customer,
    permission: PERMISSIONS.CUSTOMERS_VIEW,
    section: 'main',
  },
  
  suppliers: {
    id: 'suppliers',
    label: 'Nhà cung cấp',
    path: '/suppliers',
    icon: ICONS.supplier,
    permission: PERMISSIONS.SUPPLIERS_VIEW,
    section: 'main',
  },
  
  partners: {
    id: 'partners',
    label: 'Khách hàng/NCC',
    path: '/partners',
    icon: ICONS.partners,
    permission: PERMISSIONS.PARTNERS_VIEW,
    section: 'main',
  },
  
  accounting: {
    id: 'accounting',
    label: 'Kế toán',
    path: '/accounting',
    icon: ICONS.accounting,
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    section: 'main',
  },
  
  approvals: {
    id: 'approvals',
    label: 'Phê duyệt',
    path: '/approvals',
    icon: ICONS.approval,
    permission: PERMISSIONS.APPROVALS_VIEW,
    section: 'management',
  },
  
  approvalsPayment: {
    id: 'approvals-payment',
    label: 'Phê duyệt thanh toán',
    path: '/approvals/payment',
    icon: ICONS.approval,
    permission: PERMISSIONS.APPROVALS_PAYMENT,
    section: 'management',
  },
  
  reports: {
    id: 'reports',
    label: 'Báo cáo',
    path: '/reports',
    icon: ICONS.report,
    permission: PERMISSIONS.REPORTS_VIEW,
    section: 'management',
  },
  
  reportsSales: {
    id: 'reports-sales',
    label: 'Báo cáo bán hàng',
    path: '/reports/sales',
    icon: ICONS.report,
    permission: PERMISSIONS.REPORTS_SALES,
    section: 'management',
  },
  
  reportsWarehouse: {
    id: 'reports-warehouse',
    label: 'Báo cáo kho',
    path: '/reports/warehouse',
    icon: ICONS.report,
    permission: PERMISSIONS.REPORTS_WAREHOUSE,
    section: 'management',
  },
  
  reportsPurchase: {
    id: 'reports-purchase',
    label: 'Báo cáo mua hàng',
    path: '/reports/purchase',
    icon: ICONS.report,
    permission: PERMISSIONS.REPORTS_PURCHASE,
    section: 'management',
  },
  
  reportsFinancial: {
    id: 'reports-financial',
    label: 'Báo cáo tài chính',
    path: '/reports/financial',
    icon: ICONS.report,
    permission: PERMISSIONS.REPORTS_FINANCIAL,
    section: 'management',
  },
  
  personnel: {
    id: 'personnel',
    label: 'Nhân sự',
    path: '/personnel',
    icon: ICONS.personnel,
    permission: PERMISSIONS.PERSONNEL_VIEW,
    section: 'management',
  },
};

// ============================================
// ROLE-PERMISSION MAPPING (For testing/MVP)
// TODO: Replace with API call to backend
// ============================================
export const ROLE_PERMISSIONS_MAP = {
  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCT_TYPES_VIEW,
    PERMISSIONS.PRODUCT_TYPES_MANAGE,
    PERMISSIONS.WAREHOUSE_VIEW,
    PERMISSIONS.WAREHOUSE_MANAGE,
    PERMISSIONS.WAREHOUSE_ADJUST_STOCK,
    PERMISSIONS.IMPORT_ORDERS_VIEW,
    PERMISSIONS.IMPORT_ORDERS_CREATE,
    PERMISSIONS.IMPORT_ORDERS_EDIT,
    PERMISSIONS.IMPORT_ORDERS_APPROVE,
    PERMISSIONS.IMPORT_ORDERS_DELETE,
    PERMISSIONS.EXPORT_ORDERS_VIEW,
    PERMISSIONS.EXPORT_ORDERS_CREATE,
    PERMISSIONS.EXPORT_ORDERS_EDIT,
    PERMISSIONS.EXPORT_ORDERS_APPROVE,
    PERMISSIONS.EXPORT_ORDERS_DELETE,
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.PARTNERS_MANAGE,
    PERMISSIONS.ACCOUNTING_VIEW,
    PERMISSIONS.ACCOUNTING_MANAGE,
    PERMISSIONS.APPROVALS_VIEW,
    PERMISSIONS.APPROVALS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_WAREHOUSE,
    PERMISSIONS.REPORTS_PURCHASE,
    PERMISSIONS.REPORTS_FINANCIAL,
    PERMISSIONS.PERSONNEL_VIEW,
    PERMISSIONS.PERSONNEL_MANAGE,
  ],
  
  [ROLES.SALE]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.EXPORT_ORDERS_VIEW,
    PERMISSIONS.EXPORT_ORDERS_CREATE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.REPORTS_SALES,
  ],
  
  [ROLES.WAREHOUSE]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCT_TYPES_VIEW,
    PERMISSIONS.WAREHOUSE_VIEW,
    PERMISSIONS.WAREHOUSE_MANAGE,
    PERMISSIONS.WAREHOUSE_ADJUST_STOCK,
    PERMISSIONS.IMPORT_ORDERS_VIEW,
    PERMISSIONS.EXPORT_ORDERS_VIEW,
    PERMISSIONS.REPORTS_WAREHOUSE,
  ],
  
  [ROLES.PURCHASE]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.WAREHOUSE_VIEW,
    PERMISSIONS.IMPORT_ORDERS_VIEW,
    PERMISSIONS.IMPORT_ORDERS_CREATE,
    PERMISSIONS.IMPORT_ORDERS_EDIT,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_MANAGE,
    PERMISSIONS.REPORTS_PURCHASE,
  ],
  
  [ROLES.ACCOUNTING]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ACCOUNTING_VIEW,
    PERMISSIONS.ACCOUNTING_MANAGE,
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.IMPORT_ORDERS_VIEW,
    PERMISSIONS.EXPORT_ORDERS_VIEW,
    PERMISSIONS.APPROVALS_PAYMENT,
    PERMISSIONS.REPORTS_FINANCIAL,
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get permissions by role (for testing/MVP)
 * @param {string} role - User role
 * @returns {Array<string>} Array of permissions
 */
export const getPermissionsByRole = (role) => {
  return ROLE_PERMISSIONS_MAP[role] || [];
};

/**
 * Check if user has permission
 * @param {Array<string>} userPermissions - User's permissions
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, permission) => {
  return userPermissions.includes(permission);
};

/**
 * Filter menu items by user permissions
 * @param {Array<string>} userPermissions - User's permissions
 * @returns {Object} Filtered menu items grouped by section
 */
export const getMenuByPermissions = (userPermissions) => {
  const filteredItems = Object.values(ALL_MENU_ITEMS)
    .filter(item => hasPermission(userPermissions, item.permission))
    .map(item => {
      // If item has children, filter them too
      if (item.children) {
        const filteredChildren = item.children.filter(child =>
          hasPermission(userPermissions, child.permission)
        );
        
        // Only include item if it has at least one accessible child
        if (filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren,
          };
        }
        return null;
      }
      
      return item;
    })
    .filter(Boolean); // Remove null items
  
  // Group by section
  const mainMenu = filteredItems.filter(item => item.section === 'main');
  const managementMenu = filteredItems.filter(item => item.section === 'management');
  
  return {
    mainMenu,
    managementMenu,
  };
};

/**
 * Get menu by role (for testing/MVP)
 * @param {string} role - User role
 * @returns {Object} Menu items grouped by section
 */
export const getMenuByRole = (role) => {
  const permissions = getPermissionsByRole(role);
  return getMenuByPermissions(permissions);
};

/**
 * Add permission badge for read-only items
 * @param {Array<string>} userPermissions - User's permissions
 * @param {string} viewPermission - View permission
 * @param {string} managePermission - Manage permission
 * @returns {string|null} Badge text or null
 */
export const getPermissionBadge = (userPermissions, viewPermission, managePermission) => {
  const canView = hasPermission(userPermissions, viewPermission);
  const canManage = hasPermission(userPermissions, managePermission);
  
  if (canView && !canManage) {
    return 'Xem';
  }
  
  return null;
};

