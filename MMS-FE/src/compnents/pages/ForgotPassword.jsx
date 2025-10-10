import React, { useState } from "react";
import logo from "../../assets/mms_logo.svg";

export default function ForgotPassword({ onSubmit: propsOnSubmit }) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    setLoading(false);
    setDone(true);

    if (propsOnSubmit) propsOnSubmit({ identifier });
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

        <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">Bạn quên mật khẩu?</h1>

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nhập Email / Số điện thoại của bạn</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập Email/Số điện thoại của bạn"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-brand-blue-100 focus:outline-none"
                type="text"
                autoComplete="username"
              />
            </div>

            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-brand-blue hover:brightness-110 text-white font-semibold rounded-md shadow-md focus:outline-none disabled:opacity-60"
              >
                {loading ? "Đang xử lý..." : "Quên mật khẩu"}
              </button>
            </div>

            <div className="text-center text-sm text-slate-500">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="text-brand-blue hover:underline"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-slate-700">
              Yêu cầu đặt lại mật khẩu đã được gửi tới <strong>{identifier}</strong> (nếu tồn tại).
            </div>
            <div className="text-sm text-slate-500">
              Vui lòng kiểm tra email hoặc tin nhắn và làm theo hướng dẫn để đặt lại mật khẩu.
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setDone(false);
                  setIdentifier("");
                }}
                className="px-4 py-2 bg-white border rounded text-slate-700 hover:bg-slate-50"
              >
                Gửi lại
              </button>

              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-brand-blue text-white rounded font-medium hover:brightness-110"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}