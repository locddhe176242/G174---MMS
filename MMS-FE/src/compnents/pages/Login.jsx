import React, { useState } from "react";
import logo from "../../assets/mms_logo.svg";

export default function Login({ onSubmit: propsOnSubmit }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { identifier, password, remember };
    if (propsOnSubmit) propsOnSubmit(payload);
    alert(`Đăng nhập với: ${identifier}\nGhi nhớ: ${remember ? "Có" : "Không"}`);
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

        <h1 className="text-2xl font-bold text-slate-800 mb-4">Đăng nhập vào cửa hàng của bạn</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="sr-only">Email hoặc SĐT</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email/Số điện thoại của bạn"
              className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:outline-none"
              type="text"
              autoComplete="username"
            />
          </div>

          <div className="relative">
            <label className="sr-only">Mật khẩu</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu đăng nhập cửa hàng"
              className="w-full border border-slate-300 rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-brand-blue-100 focus:outline-none"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.97 9.97 0 012.583-6.455M9.88 9.88A3 3 0 0114.12 14.12M3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-slate-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              Ghi nhớ đăng nhập
            </label>
            <a href="#" className="text-brand-blue hover:underline">Quên mật khẩu</a>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-brand-blue hover:brightness-110 text-white font-semibold py-2 rounded-md shadow-md focus:outline-none"
            >
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}