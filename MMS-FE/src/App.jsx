import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerList from "./compnents/pages/CustomerList";
import Login from "./compnents/pages/Login";
import ProductList from "./compnents/pages/product/ProductList"

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  
  // if (!token) {
  //   return <Navigate to="/login" replace />;
  // }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomerList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductList />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/customers" replace />} />

      {/* 404 */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;