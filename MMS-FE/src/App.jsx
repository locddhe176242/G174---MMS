import React from "react";
import {Routes, Route, Navigate} from "react-router-dom";
import Landing from "./compnents/pages/Home-Page/Landing";
import Login from "./compnents/pages/Auth/Login";
import ForgotPassword from "./compnents/pages/Auth/ForgotPassword";
import VerifyOtp from "./compnents/pages/Auth/VerifyOtp";
import ResetPassword from "./compnents/pages/Auth/ResetPassword";
import MainLayout from "./compnents/layout/MainLayout";
import Dashboard from "./compnents/pages/Home-page/Dashboard";
import CustomerList from "./compnents/pages/CustomerList";
import UserProfile from "./compnents/pages/UserProfile";
import ProtectedRoute from "./compnents/ProtectedRoute";
import WarehouseList from "./compnents/pages/Warehouse/WarehouseList.jsx";
import AddWarehouse from "./compnents/pages/Warehouse/AddWarehouse.jsx";
import EditWarehouse from "./compnents/pages/Warehouse/EditWarehouse.jsx";
import WarehouseDetail from "./compnents/pages/Warehouse/WarehouseDetail.jsx";
import VendorList from "./compnents/pages/VendorList";
import VendorForm from "./compnents/pages/VendorForm";
import VendorDetail from "./compnents/pages/VendorDetail"
import CustomerDetail from "./compnents/pages/CustomerDetail";
import CustomerForm from "./compnents/pages/CustomerForm";
import PurchaseRequisitionForm from './compnents/pages/PurchaseRequisitionForm';


// Admin Pages
import RoleManagement from "./compnents/pages/Admin/RoleManagement";
import RoleDetail from "./compnents/pages/Admin/RoleDetail";
import MenuManagement from "./compnents/pages/Admin/MenuManagement";
import PermissionManagement from "./compnents/pages/Admin/PermissionManagement";
import UserPermissionManagement from "./compnents/pages/Admin/UserPermissionManagement";
import UserManagement from "./compnents/pages/Admin/UserManagement";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/forgot-password" element={<ForgotPassword/>}/>
            <Route path="/verify-otp" element={<VerifyOtp/>}/>
            <Route path="/reset-password" element={<ResetPassword/>}/>

            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout/>
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard/>}/>
                <Route path="/profile" element={<UserProfile/>}/>
                <Route path="/customers" element={<CustomerList/>}/>
                <Route path="/warehouse" element={<WarehouseList/>}/>
                <Route path="/warehouse/new" element={<AddWarehouse/>}/>
                <Route path="/warehouse/:id/edit" element={<EditWarehouse/>}/>
                <Route path="/warehouse/:id" element={<WarehouseDetail/>} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/vendors" element={<VendorList />} />
        <Route path="/vendors/new" element={<VendorForm />} />
        <Route path="/vendors/:id/edit" element={<VendorForm />} />
        <Route path="/vendors/:id" element={<VendorDetail />} />

        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />

        <Route path="/purchase-requisitions/create" element={<PurchaseRequisitionForm />} />
         main
        {/* Admin Routes */}
        <Route path="/admin/roles" element={<RoleManagement />} />
        <Route path="/admin/roles/:roleId" element={<RoleDetail />} />
        <Route path="/admin/menus" element={<MenuManagement />} />
        <Route path="/admin/permissions" element={<PermissionManagement />} />
        <Route path="/admin/user-permissions" element={<UserPermissionManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
      </Route>

                    {/* Admin Routes */}
                <Route path="/admin/roles" element={<RoleManagement/>}/>
                <Route path="/admin/roles/:roleId" element={<RoleDetail/>}/>
                <Route path="/admin/menus" element={<MenuManagement/>}/>
                <Route path="/admin/permissions" element={<PermissionManagement/>}/>
                <Route path="/admin/user-permissions" element={<UserPermissionManagement/>}/>
                <Route path="/admin/users" element={<UserManagement/>}/>
            </Route>

            <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
    );
}

export default App;
