import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../../../api/passwordService";
import logo from "../../../assets/mms_logo.svg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setErrorMessage("");

    try {
      await requestPasswordReset(email);
      
      setLoading(false);
      navigate("/verify-otp", { state: { email } });
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.message || "Gửi mã OTP thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <img src={logo} alt="MMS logo" className="w-14 h-14 rounded-full bg-slate-50 p-2" />
          <div>
            <div className="text-2xl font-extrabold text-slate-800">MMS</div>
            <div className="text-sm font-medium text-brand-blue mt-0.5">Management System</div>
            <div className="text-sm text-brand-blue mt-1 inline-block underline-accent">
              Quản lý hàng hóa
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Quên mật khẩu?</h1>
        <p className="text-slate-600 text-sm mb-6">
          Nhập email của bạn để nhận mã xác thực OTP
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:outline-none"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue hover:brightness-110 text-white font-semibold py-2 rounded-md shadow-md focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                "Gửi mã OTP"
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-slate-600 hover:text-brand-blue">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
