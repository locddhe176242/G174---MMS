import React from "react";
import { Link } from "react-router-dom";
import logo from '/src/assets/mms_logo.svg';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="text-center py-24">
        <img
          src={logo}
          alt="MMS logo"
          className="w-24 h-24 mx-auto mb-6 object-contain"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Chào mừng đến với Material Management System
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
          Hệ thống quản lý vật tư toàn diện, giúp tối ưu hóa quy trình mua sắm,
          bán hàng và quản lý kho hiệu quả.
        </p>
        <Link 
          to="/login"
          className="inline-block bg-brand-blue text-white text-lg px-8 py-4 rounded-lg shadow hover:brightness-110 transition"
        >
          Đăng nhập
        </Link>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Tính năng chính
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border rounded-2xl shadow-sm text-center hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Quản lý sản phẩm
              </h3>
              <p className="text-gray-600">
                CRUD sản phẩm và loại sản phẩm với thông tin chi tiết về giá mua, giá bán, đơn vị tính.
              </p>
            </div>

            <div className="p-6 border rounded-2xl shadow-sm text-center hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Quy trình mua hàng
              </h3>
              <p className="text-gray-600">
                Từ phiếu yêu cầu nhập hàng đến nhận hàng và thanh toán với quy trình hoàn chỉnh.
              </p>
            </div>

            <div className="p-6 border rounded-2xl shadow-sm text-center hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-brand-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Quy trình bán hàng
              </h3>
              <p className="text-gray-600">
                Từ yêu cầu khách hàng đến giao hàng và xuất hóa đơn với theo dõi chi tiết.
              </p>
            </div>

            <div className="p-6 border rounded-2xl shadow-sm text-center hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-brand-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Quản lý kho hàng
              </h3>
              <p className="text-gray-600">
                Quản lý kho, chuyển kho, kiểm kho với theo dõi tồn kho theo thời gian thực.
              </p>
            </div>

            <div className="p-6 border rounded-2xl shadow-sm text-center hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-brand-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Quản lý đối tác
              </h3>
              <p className="text-gray-600">
                Quản lý khách hàng và nhà cung cấp với theo dõi công nợ và lịch sử giao dịch.
              </p>
            </div>

            <div className="p-6 border rounded-2xl shadow-sm text-center hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-brand-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Báo cáo & Phân tích
              </h3>
              <p className="text-gray-600">
                Báo cáo tồn kho, công nợ, doanh thu với dashboard trực quan và dễ hiểu.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-blue-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Sẵn sàng tối ưu hóa quản lý vật tư?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Bắt đầu sử dụng hệ thống quản lý vật tư chuyên nghiệp ngay hôm nay.
          </p>         
        </div>
      </section>
    </div>
  );
}