/**
 * DEBT MANAGEMENT LIST COMPONENT
 * 
 * Component hiển thị danh sách giao dịch công nợ TỔNG HỢP từ cả Purchase (AP) và Sale (AR):
 * - Purchase (AP): Công nợ phải trả với nhà cung cấp (Vendor)
 * - Sale (AR): Công nợ phải thu từ khách hàng (Customer)
 * 
 * Tính năng:
 * - Hiển thị danh sách giao dịch có phân trang (tổng hợp từ AP và AR)
 * - Tìm kiếm theo keyword (mã KH/NCC, nội dung giao dịch)
 * - Sắp xếp theo các cột
 * - Tính toán tổng hợp công nợ (TK Nợ - TK Có)
 * - Xác định khách hàng còn nợ hoặc công ty đang nợ khách/nhà cung cấp
 * 
 * BACKEND RESPONSE DTO (Expected):
 * - id: Long (primary key)
 * - customerVendorCode: String (mã khách hàng/nhà cung cấp)
 * - customerVendorName: String (tên khách hàng/nhà cung cấp)
 * - customerVendorType: String (Customer/Vendor) - loại đối tác
 * - transactionType: String (AP/AR) - loại giao dịch
 * - creditAmount: BigDecimal (TK Có - số tiền công ty nhận)
 * - debitAmount: BigDecimal (TK Nợ - số tiền công ty phải trả/nhận)
 * - transactionContent: String (nội dung giao dịch)
 * - transactionDate: LocalDate (ngày giao dịch)
 * - createdAt: LocalDateTime
 * - updatedAt: LocalDateTime
 */

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import debtManagementService from "../../api/debtManagementService";
import Pagination from "../common/Pagination.jsx";

export default function DebtManagementList() {
  // ==================== STATE MANAGEMENT ====================
  const [transactions, setTransactions] = useState([]); // Danh sách giao dịch
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [searchKeyword, setSearchKeyword] = useState(""); // Từ khóa tìm kiếm
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Sorting states
  const [sortField, setSortField] = useState("transactionDate");
  const [sortDirection, setSortDirection] = useState("desc");

  // ==================== HELPER FUNCTIONS ====================
  /**
   * Format date string sang định dạng VN (dd/mm/yyyy)
   */
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  /**
   * Format số tiền sang định dạng VND
   */
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 đ";
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(Number(amount));
  };

  /**
   * Tính tổng hợp công nợ cho từng mã KH/NCC (tổng hợp từ AP và AR)
   * Số dư = Tổng TK Nợ - Tổng TK Có
   * - Số dư > 0: Khách hàng/NCC còn nợ công ty (công ty phải thu)
   * - Số dư < 0: Công ty đang nợ khách hàng/NCC (công ty phải trả)
   */
  const debtSummary = useMemo(() => {
    const summary = {};
    
    transactions.forEach((transaction) => {
      const code = transaction.customerVendorCode || transaction.customer_vendor_code || "";
      if (!code) return;
      
      const type = transaction.customerVendorType || transaction.customer_vendor_type || 
                   transaction.transactionType || transaction.transaction_type || "";
      const name = transaction.customerVendorName || transaction.customer_vendor_name || "";
      
      if (!summary[code]) {
        summary[code] = {
          code,
          name,
          type, // Customer hoặc Vendor
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
        };
      }
      
      const debit = Number(transaction.debitAmount || transaction.debit_amount || 0);
      const credit = Number(transaction.creditAmount || transaction.credit_amount || 0);
      
      summary[code].totalDebit += debit;
      summary[code].totalCredit += credit;
      summary[code].balance = summary[code].totalDebit - summary[code].totalCredit;
    });
    
    return Object.values(summary);
  }, [transactions]);

  // ==================== API FUNCTIONS ====================
  /**
   * Fetch danh sách giao dịch công nợ từ backend
   */
  const fetchTransactions = async (page = 0, size = pageSize, keyword = searchKeyword) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build sort parameter (format: "field,direction")
      const sort = `${sortField},${sortDirection}`;
      
      let response;
      // Gọi API search hoặc getAll tùy theo có keyword hay không
      if (keyword.trim()) {
        response = await debtManagementService.searchDebtTransactionsWithPagination(keyword, page, size, sort);
      } else {
        response = await debtManagementService.getDebtTransactionsWithPagination(page, size, sort);
      }

      // Set data vào state
      const data = response;
      setTransactions(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Không thể tải danh sách giao dịch công nợ";
      const statusCode = err.response?.status;
      
      // Kiểm tra nếu là lỗi 404 hoặc 500 - có thể do backend chưa có endpoint
      if (statusCode === 404 || statusCode === 500 || err.code === "ERR_NETWORK") {
        setError("Backend API chưa sẵn sàng. Vui lòng kiểm tra các endpoint sau đã được implement chưa:\n- GET /debt-transactions/page\n- GET /debt-transactions/search/page");
        toast.error("Backend API chưa sẵn sàng. Vui lòng kiểm tra console để xem chi tiết.");
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
      console.error("Lỗi khi tải danh sách giao dịch công nợ:", err);
      console.error("Chi tiết lỗi:", {
        status: statusCode,
        message: errorMessage,
        url: err.config?.url,
        method: err.config?.method
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== USEEFFECT HOOKS ====================
  /**
   * Load dữ liệu lần đầu khi component mount
   */
  useEffect(() => {
    fetchTransactions();
  }, []);

  /**
   * Refetch data khi sort field hoặc direction thay đổi
   */
  useEffect(() => {
    fetchTransactions(currentPage);
  }, [sortField, sortDirection]);

  // ==================== EVENT HANDLERS ====================
  /**
   * Xử lý submit form search
   */
  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactions(0); // Reset về page 0 khi search
  };

  /**
   * Xử lý click vào column header để sort
   */
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction nếu đang sort cùng field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Sort field mới, bắt đầu với asc
      setSortField(field);
      setSortDirection("asc");
    }
  };

  /**
   * Hiển thị icon sort cho column header
   */
  const getSortIcon = (field) => {
    if (sortField !== field)
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    return sortDirection === "asc" ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  // ==================== PAGINATION HANDLERS ====================
  /**
   * Xử lý thay đổi page từ Pagination component
   */
  const handlePageChange = (page) => {
    if (page < 0 || page >= totalPages) return;
    fetchTransactions(page);
  };

  /**
   * Xử lý thay đổi page size
   */
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    fetchTransactions(0, size); // Reset to first page
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HEADER ==================== */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý công nợ khách hàng/nhà cung cấp</h1>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* ==================== SEARCH BAR ==================== */}
          <div className="px-6 py-4 border-b border-gray-200">
            <form onSubmit={handleSearch} className="flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã KH/NCC, nội dung giao dịch..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* ==================== DEBT SUMMARY SECTION ==================== */}
          {!loading && !error && debtSummary.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Tổng hợp công nợ (từ AP và AR)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {debtSummary.map((summary) => {
                  const isCustomer = summary.type === "Customer" || summary.type === "AR";
                  const isVendor = summary.type === "Vendor" || summary.type === "AP";
                  return (
                    <div key={summary.code} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{summary.code}</span>
                          {(isCustomer || isVendor) && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isCustomer 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-purple-100 text-purple-800"
                            }`}>
                              {isCustomer ? "KH" : "NCC"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[120px]" title={summary.name}>
                          {summary.name}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">TK Nợ:</span>
                          <span className="font-medium">{formatCurrency(summary.totalDebit)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">TK Có:</span>
                          <span className="font-medium">{formatCurrency(summary.totalCredit)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">Số dư:</span>
                          <span className={`font-bold ${
                            summary.balance > 0 
                              ? "text-red-600" 
                              : summary.balance < 0 
                              ? "text-green-600" 
                              : "text-gray-600"
                          }`}>
                            {summary.balance > 0 
                              ? `Phải thu: ${formatCurrency(summary.balance)}`
                              : summary.balance < 0
                              ? `Phải trả: ${formatCurrency(Math.abs(summary.balance))}`
                              : formatCurrency(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== DATA TABLE ==================== */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="text-red-600 text-center mb-4">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="font-semibold text-lg mb-2">Lỗi khi tải dữ liệu</p>
                  <p className="text-sm whitespace-pre-line">{error}</p>
                </div>
                <button
                  onClick={() => fetchTransactions()}
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
                      <button onClick={() => handleSort("id")} className="flex items-center gap-1 hover:text-gray-700">
                        ID {getSortIcon("id")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort("customerVendorCode")} className="flex items-center gap-1 hover:text-gray-700">
                        MÃ KH/NCC {getSortIcon("customerVendorCode")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LOẠI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort("debitAmount")} className="flex items-center gap-1 hover:text-gray-700">
                        TK NỢ {getSortIcon("debitAmount")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort("creditAmount")} className="flex items-center gap-1 hover:text-gray-700">
                        TK CÓ {getSortIcon("creditAmount")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NỘI DUNG GIAO DỊCH
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort("transactionDate")} className="flex items-center gap-1 hover:text-gray-700">
                        NGÀY GIAO DỊCH {getSortIcon("transactionDate")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        Chưa có giao dịch công nợ nào
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => {
                      const transactionId = transaction.id || transaction.transactionId || transaction.transaction_id;
                      const type = transaction.customerVendorType || transaction.customer_vendor_type || 
                                   transaction.transactionType || transaction.transaction_type || "";
                      const isCustomer = type === "Customer" || type === "AR";
                      const isVendor = type === "Vendor" || type === "AP";
                      
                      return (
                        <tr key={transactionId} className="hover:bg-gray-50">
                          {/* ID */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transactionId?.toString().padStart(3, '0') || '-'}
                          </td>
                          {/* Mã KH/NCC */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                              {transaction.customerVendorCode || transaction.customer_vendor_code || '-'}
                            </span>
                          </td>
                          {/* Loại (KH/NCC) */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {(isCustomer || isVendor) ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isCustomer 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-purple-100 text-purple-800"
                              }`}>
                                {isCustomer ? "Khách hàng" : "Nhà cung cấp"}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          {/* TK Nợ */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(transaction.debitAmount || transaction.debit_amount || 0)}
                          </td>
                          {/* TK Có */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(transaction.creditAmount || transaction.credit_amount || 0)}
                          </td>
                          {/* Nội dung giao dịch */}
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="truncate" title={transaction.transactionContent || transaction.transaction_content || '-'}>
                              {transaction.transactionContent || transaction.transaction_content || '-'}
                            </div>
                          </td>
                          {/* Ngày giao dịch */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.transactionDate || transaction.transaction_date)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ==================== PAGINATION ==================== */}
          {!loading && !error && transactions.length > 0 && (
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

