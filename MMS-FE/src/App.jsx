import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./compnents/pages/Home-Page/Landing";
import Login from "./compnents/pages/Auth/Login";
import ForgotPassword from "./compnents/pages/Auth/ForgotPassword";
import VerifyOtp from "./compnents/pages/Auth/VerifyOtp";
import ResetPassword from "./compnents/pages/Auth/ResetPassword";
import MainLayout from "./compnents/layout/MainLayout";
import Dashboard from "./compnents/pages/Home-Page/Dashboard";
import ProtectedRoute from "./compnents/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;