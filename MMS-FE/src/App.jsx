import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerList from "./compnents/pages/CustomerList";
import Login from "./compnents/pages/Login";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CustomerList />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/customers" replace />} />
        
        {/* Customer Routes */}
        <Route path="customers">
          <Route index element={<CustomerList />} />
        </Route>
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;