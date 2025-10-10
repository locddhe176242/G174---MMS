import React, { useState } from "react";

export default function Sidebar() {
  const [openProduct, setOpenProduct] = useState(false);
  const Item = ({ children, icon, onClick, active }) => (
    <button
      onClick={onClick}
      className={
        "w-full flex items-center gap-3 text-left px-3 py-2 rounded-md transition " +
        (active ? "bg-brand-blue-50 font-medium" : "hover:bg-brand-blue-50")
      }
      style={{ color: "var(--text-default, inherit)" }}
    >
      <span className="w-5 h-5 flex items-center justify-center text-brand-blue" aria-hidden>
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );

  return (
    <aside
      className="w-64 border-r bg-white p-4"
      style={{ fontFamily: "var(--font-primary), system-ui, sans-serif" }}
      aria-label="Sidebar"
    >
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Menu chính</div>

        <nav className="space-y-1">
          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z" />
              </svg>
            }
            active
          >
            Trang chủ
          </Item>

          <div>
            <button
              onClick={() => setOpenProduct((s) => !s)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-brand-blue-50 transition"
            >
              <span className="w-5 h-5 flex items-center justify-center text-brand-blue" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V7a1 1 0 00-1-1h-6m-6 8v6a1 1 0 001 1h6" />
                </svg>
              </span>
              <span className="flex-1 text-sm">Sản phẩm</span>
              <span className="text-slate-400">
                {openProduct ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </span>
            </button>

            {openProduct && (
              <div className="mt-2 ml-8 space-y-1">
                <Item icon={<span />} onClick={() => {}}>
                  Danh sách sản phẩm
                </Item>
                <Item icon={<span />} onClick={() => {}}>
                  Nhóm / Loại
                </Item>
              </div>
            )}
          </div>

          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            }
            onClick={() => {}}
          >
            Kho
          </Item>

          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18v6H3zM3 6h18" />
              </svg>
            }
          >
            Nhập hàng
          </Item>

          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18l-1 10a2 2 0 01-2 2H6a2 2 0 01-2-2L3 7z" />
              </svg>
            }
          >
            Xuất hàng
          </Item>

          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8a4 4 0 10-8 0h8z" />
              </svg>
            }
          >
            Khách hàng/Nhà cung cấp
          </Item>

          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
              </svg>
            }
          >
            Kế toán
          </Item>
        </nav>
      </div>

      <div className="pt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Quản lý</div>

        <nav className="space-y-1">
          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
              </svg>
            }
          >
            Phê duyệt
          </Item>

          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
              </svg>
            }
          >
            Báo cáo
          </Item>

          <Item
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857" />
              </svg>
            }
          >
            Nhân sự
          </Item>
        </nav>
      </div>
    </aside>
  );
}