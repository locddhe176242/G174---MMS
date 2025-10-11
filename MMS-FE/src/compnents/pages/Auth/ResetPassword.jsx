import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { verifyOtpAndResetPassword } from "../../../api/passwordService";
import logo from "../../../assets/mms_logo.svg";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, otp } = location.state || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    if (errors.match) {
      setErrors({});
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (errors.match) {
      setErrors({});
    }
  };

  useEffect(() => {
    if (!email || !otp) {
      navigate("/forgot-password");
    }
  }, [email, otp, navigate]);

  const passwordRequirements = [
    { key: 'length', label: 'Mật khẩu phải có ít nhất 8 ký tự', test: (pwd) => pwd.length >= 8 },
    { key: 'uppercase', label: 'Phải có ít nhất 1 chữ hoa', test: (pwd) => /[A-Z]/.test(pwd) },
    { key: 'lowercase', label: 'Phải có ít nhất 1 chữ thường', test: (pwd) => /[a-z]/.test(pwd) },
    { key: 'number', label: 'Phải có ít nhất 1 chữ số', test: (pwd) => /[0-9]/.test(pwd) },
    { key: 'special', label: 'Phải có ít nhất 1 ký tự đặc biệt', test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
  ];

  const validatePassword = (password) => {
    const errors = {};
    
    passwordRequirements.forEach(req => {
      if (!req.test(password)) {
        errors[req.key] = req.label;
      }
    });

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setErrorMessage("");

    const passwordErrors = validatePassword(newPassword);
    
    if (Object.keys(passwordErrors).length > 0) {
      setErrors(passwordErrors);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ match: "Mật khẩu không khớp" });
      return;
    }

    setLoading(true);

    try {
      await verifyOtpAndResetPassword(email, otp, newPassword);
      
      setLoading(false);
      navigate("/login", { 
        state: { 
          message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập." 
        } 
      });
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: "", color: "" };
    
    let strength = 0;
    passwordRequirements.forEach(req => {
      if (req.test(password)) strength++;
    });

    if (strength <= 2) return { level: 1, text: "Yếu", color: "bg-red-500" };
    if (strength === 3) return { level: 2, text: "Trung bình", color: "bg-yellow-500" };
    if (strength === 4) return { level: 3, text: "Mạnh", color: "bg-green-500" };
    return { level: 5, text: "Rất mạnh", color: "bg-green-600" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

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

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Đặt lại mật khẩu</h1>
        <p className="text-slate-600 text-sm mb-6">
          Tạo mật khẩu mới cho tài khoản <span className="font-semibold text-slate-800">{email}</span>
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
                   <input
                     value={newPassword}
                     onChange={(e) => handleNewPasswordChange(e.target.value)}
                     placeholder="Nhập mật khẩu mới"
                     className="w-full border border-slate-300 rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-brand-blue-100 focus:outline-none"
                     type={showNewPassword ? "text" : "password"}
                     required
                   />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
              >
                {showNewPassword ? (
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

            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.level
                          ? passwordStrength.color
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-600">
                  Độ mạnh: <span className="font-semibold">{passwordStrength.text}</span>
                </p>
              </div>
            )}

            <div className="mt-3 space-y-1">
              {passwordRequirements.map((req) => {
                const isValid = newPassword && req.test(newPassword);
                const isTouched = newPassword.length > 0;
                
                return (
                  <p 
                    key={req.key} 
                    className={`text-xs ${
                      !isTouched 
                        ? 'text-slate-600' 
                        : isValid 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}
                  >
                    {isTouched && isValid ? '✓' : '•'} {req.label}
                  </p>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nhập lại mật khẩu
            </label>
            <div className="relative">
                   <input
                     value={confirmPassword}
                     onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                     placeholder="Nhập lại mật khẩu mới"
                     className="w-full border border-slate-300 rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-brand-blue-100 focus:outline-none"
                     type={showConfirmPassword ? "text" : "password"}
                     required
                   />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
              >
                {showConfirmPassword ? (
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

            {errors.match && (
              <p className="mt-1 text-xs text-red-600">• {errors.match}</p>
            )}

            {!errors.match && confirmPassword && newPassword === confirmPassword && (
              <p className="mt-1 text-xs text-green-600">✓ Mật khẩu khớp</p>
            )}
          </div>

          <div className="pt-2">
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
                  Đang xử lý...
                </span>
              ) : (
                "Đặt lại mật khẩu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}