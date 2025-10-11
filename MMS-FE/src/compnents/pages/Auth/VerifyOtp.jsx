import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { verifyOtpOnly } from "../../../api/passwordService";
import logo from "../../../assets/mms_logo.svg";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [otpExpiry, setOtpExpiry] = useState(600);
  const [resendCountdown, setResendCountdown] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (otpExpiry > 0) {
      const timer = setInterval(() => {
        setOtpExpiry((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpExpiry]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCountdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value && newOtp.every(digit => digit !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    while (newOtp.length < 6) newOtp.push("");
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerifyOtp(pastedData);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    setLoading(true);
    setErrorMessage("");

    try {
      await verifyOtpOnly(email, otpCode);
      
      setLoading(false);
      navigate("/reset-password", { state: { email, otp: otpCode } });
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.message || "Mã OTP không chính xác. Vui lòng thử lại.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      handleVerifyOtp(otpCode);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);

    try {
      const { requestPasswordReset } = await import("../../../api/passwordService");
      await requestPasswordReset(email);
      
      setResendLoading(false);
      setResendCountdown(60);
      setOtpExpiry(600);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setResendLoading(false);
      console.error("Resend OTP error:", error);
    }
  };

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

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Xác thực OTP</h1>
        <p className="text-slate-600 text-sm mb-6">
          Mã OTP đã được gửi đến <span className="font-semibold text-slate-800">{email}</span>
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Nhập mã OTP
            </label>
            <div className="flex gap-2 justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-slate-600">
            Mã OTP có hiệu lực: <span className={`font-semibold ${otpExpiry < 60 ? "text-red-600" : "text-brand-blue"}`}>{formatTime(otpExpiry)}</span>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.some(digit => digit === "")}
              className="w-full bg-brand-blue hover:brightness-110 text-white font-semibold py-2 rounded-md shadow-md focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xác thực...
                </span>
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || resendCountdown > 0}
              className="w-full bg-white border-2 border-brand-blue text-brand-blue hover:bg-brand-blue-50 font-semibold py-2 rounded-md shadow-md focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {resendLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </span>
              ) : resendCountdown > 0 ? (
                `Gửi lại mã OTP (${resendCountdown}s)`
              ) : (
                "Gửi lại mã OTP"
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-slate-600 hover:text-brand-blue">
            Quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}

