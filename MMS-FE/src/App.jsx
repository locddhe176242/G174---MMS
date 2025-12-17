import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./compnents/pages/Home-Page/Landing";
import Login from "./compnents/pages/Auth/Login";
import ForgotPassword from "./compnents/pages/Auth/ForgotPassword";
import VerifyOtp from "./compnents/pages/Auth/VerifyOtp";
import ResetPassword from "./compnents/pages/Auth/ResetPassword";
import MainLayout from "./compnents/layout/MainLayout";
import Dashboard from "./compnents/pages/Home-page/Dashboard";
import CustomerList from "./compnents/pages/CustomerList";
import UserProfile from "./compnents/pages/UserProfile";
import Notifications from "./compnents/pages/Notifications";
import ProtectedRoute from "./compnents/ProtectedRoute";
import WarehouseList from "./compnents/pages/Warehouse/WarehouseList.jsx";
import AddWarehouse from "./compnents/pages/Warehouse/AddWarehouse.jsx";
import EditWarehouse from "./compnents/pages/Warehouse/EditWarehouse.jsx";
import WarehouseDetail from "./compnents/pages/Warehouse/WarehouseDetail.jsx";
import VendorList from "./compnents/pages/VendorList";
import VendorForm from "./compnents/pages/VendorForm";
import VendorDetail from "./compnents/pages/VendorDetail";
import CustomerDetail from "./compnents/pages/CustomerDetail";
import CustomerForm from "./compnents/pages/CustomerForm";
import ProductList from "./compnents/pages/product/ProductList";
import CategoryList from "./compnents/pages/Category/CategoryList";

//page for purchase module
import PurchaseRequisitionForm from "./compnents/pages/Purchase/PurchaseRequisitionForm";
import PurchaseRequisitionDetail from "./compnents/pages/Purchase/PurchaseRequisitionDetail";
import PurchaseRequisitionList from "./compnents/pages/Purchase/PurchaseRequisitionList";
import RFQList from "./compnents/pages/Purchase/RFQList.jsx";
import RFQDetail from "./compnents/pages/Purchase/RFQDetail.jsx";
import RFQForm from "./compnents/pages/Purchase/RFQForm.jsx";
import ApprovalList from "./compnents/pages/Admin/ApprovalList.jsx";
import PurchaseOrderList from "./compnents/pages/Purchase/PurchaseOrderList.jsx";
import PurchaseOrderForm from "./compnents/pages/Purchase/PurchaseOrderForm.jsx";
import PurchaseOrderDetail from "./compnents/pages/Purchase/PurchaseOrderDetail.jsx";
import GoodsReceiptList from "./compnents/pages/Purchase/GoodsReceiptList.jsx";
import GoodsReceiptForm from "./compnents/pages/Purchase/GoodsReceiptForm.jsx";
import GoodsReceiptDetail from "./compnents/pages/Purchase/GoodsReceiptDetail.jsx";
import VendorQuotationForm from "./compnents/pages/Purchase/VendorQuotationForm.jsx";
import VendorQuotationList from "./compnents/pages/Purchase/VendorQuotationList.jsx";
import CompareSupplierQuotations from "./compnents/pages/Purchase/CompareSupplierQuotations.jsx";
import APaymentList from "./compnents/pages/Purchase/APaymentList.jsx";
import APaymentForm from "./compnents/pages/Purchase/APaymentForm.jsx";
import APaymentDetail from "./compnents/pages/Purchase/APaymentDetail.jsx";
import APInvoiceDetail from "./compnents/pages/Purchase/APInvoiceDetail.jsx";
import APInvoiceForm from "./compnents/pages/Purchase/APInvoiceForm.jsx";
import APInvoiceList from "./compnents/pages/Purchase/APInvoiceList.jsx";
import InboundDeliveryForm from "./compnents/pages/Purchase/InboundDeliveryForm.jsx";
import InboundDeliveryList from "./compnents/pages/Purchase/InboundDeliveryList.jsx";
import InboundDeliveryDetail from "./compnents/pages/Purchase/InboundDeliveryDetail.jsx";

//pages for sales module
import SalesQuotationList from "./compnents/pages/Sale/SalesQuotation/SalesQuotationList.jsx";
import SalesQuotationForm from "./compnents/pages/Sale/SalesQuotation/SalesQuotationForm.jsx";
import SalesQuotationDetail from "./compnents/pages/Sale/SalesQuotation/SalesQuotationDetail.jsx";
import SalesOrderList from "./compnents/pages/Sale/SalesOrder/SalesOrderList.jsx";
import SalesOrderForm from "./compnents/pages/Sale/SalesOrder/SalesOrderForm.jsx";
import SalesOrderDetail from "./compnents/pages/Sale/SalesOrder/SalesOrderDetail.jsx";
import DeliveryList from "./compnents/pages/Sale/Delivery/DeliveryList.jsx";
import DeliveryForm from "./compnents/pages/Sale/Delivery/DeliveryForm.jsx";
import DeliveryDetail from "./compnents/pages/Sale/Delivery/DeliveryDetail.jsx";
import GoodIssueList from "./compnents/pages/Sale/GoodIssue/GoodIssueList.jsx";
import GoodIssueForm from "./compnents/pages/Sale/GoodIssue/GoodIssueForm.jsx";
import GoodIssueDetail from "./compnents/pages/Sale/GoodIssue/GoodIssueDetail.jsx";
import ReturnOrderList from "./compnents/pages/Sale/ReturnOrder/ReturnOrderList.jsx";
import ReturnOrderForm from "./compnents/pages/Sale/ReturnOrder/ReturnOrderForm.jsx";
import ReturnOrderDetail from "./compnents/pages/Sale/ReturnOrder/ReturnOrderDetail.jsx";
import CreditNoteList from "./compnents/pages/Sale/CreditNote/CreditNoteList.jsx";
import CreditNoteForm from "./compnents/pages/Sale/CreditNote/CreditNoteForm.jsx";
import CreditNoteDetail from "./compnents/pages/Sale/CreditNote/CreditNoteDetail.jsx";
import InvoiceList from "./compnents/pages/Sale/Invoice/InvoiceList.jsx";
import InvoiceForm from "./compnents/pages/Sale/Invoice/InvoiceForm.jsx";
import InvoiceDetail from "./compnents/pages/Sale/Invoice/InvoiceDetail.jsx";
import SalesReturnInboundOrderList from "./compnents/pages/Sale/SalesReturnInboundOrder/SalesReturnInboundOrderList.jsx";
import SalesReturnInboundOrderDetail from "./compnents/pages/Sale/SalesReturnInboundOrder/SalesReturnInboundOrderDetail.jsx";
import SalesReturnInboundOrderForm from "./compnents/pages/Sale/SalesReturnInboundOrder/SalesReturnInboundOrderForm.jsx";

//pages for Report module
import ReportList from "./compnents/pages/Report/ReportList.jsx";
import ReportDetail from "./compnents/pages/Report/ReportDetail.jsx";
import GenerateReport from "./compnents/pages/Report/GenerateReport.jsx";

import RoleManagement from "./compnents/pages/Admin/RoleManagement";
import RoleDetail from "./compnents/pages/Admin/RoleDetail";
import MenuManagement from "./compnents/pages/Admin/MenuManagement";
import PermissionManagement from "./compnents/pages/Admin/PermissionManagement";
import UserPermissionManagement from "./compnents/pages/Admin/UserPermissionManagement";
import UserManagement from "./compnents/pages/Admin/UserManagement";
import DepartmentManagement from "./compnents/pages/Admin/DepartmentManagement.jsx";



function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/categories" element={<CategoryList />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/customers/new" element={<CustomerForm />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/customers/:id/edit" element={<CustomerForm />} />

                <Route path="/products" element={<ProductList />} />

                <Route path="/vendors" element={<VendorList />} />
                <Route path="/vendors/new" element={<VendorForm />} />
                <Route path="/vendors/:id/edit" element={<VendorForm />} />
                <Route path="/vendors/:id" element={<VendorDetail />} />

                <Route path="/warehouse" element={<WarehouseList />} />
                <Route path="/warehouse/new" element={<AddWarehouse />} />
                <Route path="/warehouse/:id/edit" element={<EditWarehouse />} />
                <Route path="/warehouse/:id" element={<WarehouseDetail />} />


                {/**Purchase Module Routes */}
                <Route path="/purchase/purchase-requisitions/new" element={<PurchaseRequisitionForm />} />
                <Route path="/purchase/purchase-requisitions/:id/edit" element={<PurchaseRequisitionForm />} />
                <Route path="/purchase/purchase-requisitions/:id" element={<PurchaseRequisitionDetail />} />
                <Route path="/purchase/purchase-requisitions" element={<PurchaseRequisitionList />} />

                <Route path="/purchase/rfqs" element={<RFQList />} />
                <Route path="/purchase/rfqs/new" element={<RFQForm />} />
                <Route path="/purchase/rfqs/:id" element={<RFQDetail />} />
                <Route path="/purchase/rfqs/:id/edit" element={<RFQForm />} />
                <Route path="/purchase/rfqs/:id/compare-quotations" element={<CompareSupplierQuotations />} />

                <Route path="/purchase/purchase-quotations" element={<VendorQuotationList />} />
                <Route path="/purchase/purchase-quotations/new" element={<VendorQuotationForm />} />
                <Route path="/purchase/purchase-quotations/:id" element={<VendorQuotationForm />} />
                <Route path="/purchase/purchase-quotations/:rfqId/:vendorId" element={<VendorQuotationForm />} />
                
                <Route path="/purchase/purchase-orders" element={<PurchaseOrderList />} />
                <Route path="/purchase/purchase-orders/new" element={<PurchaseOrderForm />} />
                <Route path="/purchase/purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
                <Route path="/purchase/purchase-orders/:id" element={<PurchaseOrderDetail />} />

                <Route path="/purchase/inbound-deliveries" element={<InboundDeliveryList />} />
                <Route path="/purchase/inbound-deliveries/new" element={<InboundDeliveryForm />} />
                <Route path="/purchase/inbound-deliveries/:id/edit" element={<InboundDeliveryForm />} />
                <Route path="/purchase/inbound-deliveries/:id" element={<InboundDeliveryDetail />} />

                <Route path="/purchase/goods-receipts" element={<GoodsReceiptList />} />
                <Route path="/purchase/goods-receipts/new" element={<GoodsReceiptForm />} />
                <Route path="/purchase/goods-receipts/:id/edit" element={<GoodsReceiptForm />} />
                <Route path="/purchase/goods-receipts/:id" element={<GoodsReceiptDetail />} />

                <Route path="/purchase/ap-payments" element={<APaymentList />} />
                <Route path="/purchase/ap-payments/:id" element={<APaymentDetail />} />

                <Route path="/purchase/ap-invoices" element={<APInvoiceList />} />
                <Route path="/purchase/ap-invoices/new" element={<APInvoiceForm />} />
                <Route path="/purchase/ap-invoices/:id" element={<APInvoiceDetail />} />
                <Route path="/purchase/ap-invoices/:id/edit" element={<APInvoiceForm />} />
                <Route path="/purchase/ap-invoices/:invoiceId/add-payment" element={<APaymentForm />} />

                {/**Sales Module Routes */}
                <Route path="/sales/quotations" element={<SalesQuotationList />} />
                <Route path="/sales/quotations/new" element={<SalesQuotationForm />} />
                <Route path="/sales/quotations/:id" element={<SalesQuotationDetail />} />
                <Route path="/sales/quotations/:id/edit" element={<SalesQuotationForm />} />
                <Route path="/sales/orders" element={<SalesOrderList />} />
                <Route path="/sales/orders/new" element={<SalesOrderForm />} />
                <Route path="/sales/orders/:id" element={<SalesOrderDetail />} />
                <Route path="/sales/orders/:id/edit" element={<SalesOrderForm />} />
                <Route path="/sales/deliveries" element={<DeliveryList />} />
                <Route path="/sales/deliveries/new" element={<DeliveryForm />} />
                <Route path="/sales/deliveries/:id" element={<DeliveryDetail />} />
                <Route path="/sales/deliveries/:id/edit" element={<DeliveryForm />} />
                <Route path="/sales/good-issues" element={<GoodIssueList />} />
                <Route path="/sales/good-issues/new" element={<GoodIssueForm />} />
                <Route path="/sales/good-issues/:id" element={<GoodIssueDetail />} />
                <Route path="/sales/good-issues/:id/edit" element={<GoodIssueForm />} />
                <Route path="/sales/return-orders" element={<ReturnOrderList />} />
                <Route path="/sales/return-orders/new" element={<ReturnOrderForm />} />
                <Route path="/sales/return-orders/:id" element={<ReturnOrderDetail />} />
                <Route path="/sales/return-orders/:id/edit" element={<ReturnOrderForm />} />
                <Route path="/sales/credit-notes" element={<CreditNoteList />} />
                <Route path="/sales/credit-notes/new" element={<CreditNoteForm />} />
                <Route path="/sales/credit-notes/:id" element={<CreditNoteDetail />} />
                <Route path="/sales/credit-notes/:id/edit" element={<CreditNoteForm />} />
                <Route path="/sales/invoices" element={<InvoiceList />} />
                <Route path="/sales/invoices/new" element={<InvoiceForm />} />
                <Route path="/sales/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/sales/invoices/:id/edit" element={<InvoiceForm />} />
                <Route path="/sales/return-inbound-orders" element={<SalesReturnInboundOrderList />} />
                <Route path="/sales/return-inbound-orders/new" element={<SalesReturnInboundOrderForm />} />
                <Route path="/sales/return-inbound-orders/:id" element={<SalesReturnInboundOrderDetail />} />

                {/**Report Module Routes */}
                <Route path="/reports" element={<ReportList />} />
                <Route path="/reports/generate" element={<GenerateReport />} />
                <Route path="/reports/:id" element={<ReportDetail />} />

                <Route path="/approval" element={<ApprovalList />} />

                <Route path="/admin/roles" element={<RoleManagement />} />
                <Route path="/admin/roles/:roleId" element={<RoleDetail />} />
                <Route path="/admin/menus" element={<MenuManagement />} />
                <Route path="/admin/permissions" element={<PermissionManagement />} />
                <Route path="/admin/user-permissions" element={<UserPermissionManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/departments" element={<DepartmentManagement />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;