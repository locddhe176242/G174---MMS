import React, { useState, useEffect } from "react";
import { customerService } from "../../api/customerService";
import { useNavigate } from "react-router-dom";


export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  // Helper function để tránh nested ternary
  const getPaginationButtonClass = (isActive) => {
    if (isActive) {
      return "px-3 py-1 border rounded-md bg-black text-white border-black";
    }
    return "px-3 py-1 border rounded-md border-gray-300 hover:bg-gray-50";
  };

  // Sửa phần fetchCustomers trong CustomerList.jsx
  const fetchCustomers = async (page = 0, keyword = "") => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (keyword.trim()) {
        response = await customerService.searchCustomersWithPagination(keyword, page, pageSize);
      } else {
        response = await customerService.getCustomersWithPagination(page, pageSize);
      }

      console.log("API Response:", response); // Debug log

      setCustomers(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      setError("Không thể tải danh sách khách hàng");
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(0, searchKeyword);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchCustomers(newPage, searchKeyword);
  };

  // Handle delete
  const handleDelete = async (customerId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      try {
        await customerService.deleteCustomer(customerId);
        fetchCustomers(currentPage, searchKeyword);
        alert("Xóa khách hàng thành công!");
      } catch (err) {
        alert("Không thể xóa khách hàng");
        console.error("Error deleting customer:", err);
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.street || ""}, ${address.city || ""}, ${address.country || ""}`.replace(/^,\s*|,\s*$/g, "");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
            <button
              onClick={() => navigate("/customers/new")}
              className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              + Thêm khách hàng
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách khách hàng</h2>
          </div>

          {/* Search and Filter */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <form onSubmit={handleSearch} className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tìm kiếm
                </button>
              </form>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Bộ lọc
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600">{error}</div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HỌ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TÊN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ĐỊA CHỈ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LIÊN HỆ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NGÀY TẠO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GHI CHÚ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.customerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.customerId?.toString().padStart(3, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.firstName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatAddress(customer.address)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.contact?.phone || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {customer.note || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/customers/${customer.customerId}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(customer.customerId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && customers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} khách hàng
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={getPaginationButtonClass(i === currentPage)}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}