import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Pagination from "../common/Pagination.jsx";
import debtManagementService from "../../api/debtManagementService.js";

export default function DebtManagementList() {
  // Summary list state
  const [summaryRows, setSummaryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search keyword (optional, currently unused in summary fetch)
  const [searchKeyword, setSearchKeyword] = useState("");

  const navigate = useNavigate();

  // Helper formatters
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount));
  };

  const totalSummary = useMemo(() => {
    return summaryRows.reduce(
      (acc, row) => {
        const debit = Number(row.totalDebit || 0);
        const credit = Number(row.totalCredit || 0);
        acc.totalDebit += debit;
        acc.totalCredit += credit;
        acc.balance += debit - credit;
        return acc;
      },
      { totalDebit: 0, totalCredit: 0, balance: 0 }
    );
  }, [summaryRows]);

  // Fetch monthly summary
  const fetchSummary = async (page = 0, size = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const data = await debtManagementService.getMonthlySummary(page, size);
      setSummaryRows(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Không tải được báo cáo tổng hợp";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Handlers
  const handlePageChange = (page) => {
    if (page < 0 || page >= totalPages) return;
    fetchSummary(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    fetchSummary(0, size);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSummary(0);
  };

  const openDetail = (code) => {
    if (!code) return;
    navigate(`/debt-management/detail/${code}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Báo cáo công nợ
          </h1>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* SEARCH BAR */}
          <div className="px-6 py-4 border-b border-gray-200">
            <form onSubmit={handleSearch} className="flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã KH/NCC..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* TOTAL BAR */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-600">Tổng phát sinh Nợ</div>
              <div className="text-lg font-semibold text-blue-700">
                {formatCurrency(totalSummary.totalDebit)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Tổng phát sinh Có</div>
              <div className="text-lg font-semibold text-purple-700">
                {formatCurrency(totalSummary.totalCredit)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Số dư kỳ</div>
              <div
                className={`text-lg font-semibold ${
                  totalSummary.balance > 0
                    ? "text-red-600"
                    : totalSummary.balance < 0
                    ? "text-green-600"
                    : "text-gray-700"
                }`}
              >
                {formatCurrency(totalSummary.balance)}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="text-red-600 text-center mb-4">
                  <p className="font-semibold text-lg mb-2">Lỗi khi tải dữ liệu</p>
                  <p className="text-sm whitespace-pre-line">{error}</p>
                </div>
                <button
                  onClick={() => fetchSummary()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MÃ KH/NCC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TÊN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LOẠI
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PHÁT SINH NỢ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PHÁT SINH CÓ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SỐ DƯ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryRows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    summaryRows.map((row, idx) => {
                      const isCustomer =
                        row.customerVendorType === "Customer" ||
                        row.customerVendorType === "AR";
                      const isVendor =
                        row.customerVendorType === "Vendor" ||
                        row.customerVendorType === "AP";
                      const balance = Number(row.balance || 0);
                      return (
                        <tr
                          key={`${row.customerVendorType}-${row.customerVendorCode}-${idx}`}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openDetail(row.customerVendorCode)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(currentPage * pageSize + idx + 1).toString().padStart(3, "0")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {row.customerVendorCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {row.customerVendorName || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isCustomer || isVendor ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  isCustomer
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {isCustomer ? "Khách hàng" : "Nhà cung cấp"}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            {formatCurrency(row.totalDebit || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            {formatCurrency(row.totalCredit || 0)}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                              balance > 0
                                ? "text-red-600"
                                : balance < 0
                                ? "text-green-600"
                                : "text-gray-700"
                            }`}
                          >
                            {formatCurrency(balance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!loading && !error && summaryRows.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalElements={totalElements}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

