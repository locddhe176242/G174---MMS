import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { salesQuotationService } from "../../../../api/salesQuotationService";
import { hasRole } from "../../../../api/authService";
import Pagination from "../../../common/Pagination";

const STATUS_LABELS = {
  Draft: "Nháp",
  Active: "Đã gửi khách",
  Converted: "Đã chuyển đơn",
  Cancelled: "Đã hủy",
  Expired: "Hết hạn",
};

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

export default function SalesQuotationList() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const fetchAllQuotations = async () => {
    try {
      setLoading(true);
      const response = await salesQuotationService.getAllQuotations();
      const list = Array.isArray(response)
        ? response
        : response?.content || response?.data || [];
      setQuotations(list);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error("Không thể tải danh sách báo giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQuotations();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return quotations.filter((quotation) => {
      const matchesKeyword =
        !term ||
        (quotation.quotationNo || "")
          .toLowerCase()
          .includes(term) ||
        (quotation.customerName || "")
          .toLowerCase()
          .includes(term);
      const matchesStatus =
        !statusFilter || quotation.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const direction = sortDir === "asc" ? 1 : -1;

    return list.sort((a, b) => {
      const valueA = a?.[sortField];
      const valueB = b?.[sortField];

      if (valueA === valueB) return 0;

      if (sortField === "quotationDate" || sortField === "validUntil" || sortField === "createdAt" || sortField === "updatedAt") {
        return (
          (new Date(valueA || 0) - new Date(valueB || 0)) * direction
        );
      }

      if (
        typeof valueA === "number" ||
        typeof valueB === "number" ||
        sortField === "totalAmount"
      ) {
        return (Number(valueA || 0) - Number(valueB || 0)) * direction;
      }

      return valueA
        ?.toString()
        .localeCompare(valueB?.toString() || "", "vi", {
          sensitivity: "base",
          numeric: true,
        }) * direction;
    });
  }, [filtered, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = currentPage * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa báo giá này?")) return;
    try {
      await salesQuotationService.deleteQuotation(id);
      toast.success("Đã xóa báo giá");
      fetchAllQuotations();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa báo giá");
    }
  };

  const changeSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="text-gray-300">↕</span>;
    }
    return sortDir === "asc" ? (
      <span className="text-blue-600">↑</span>
    ) : (
      <span className="text-blue-600">↓</span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý báo giá bán hàng
            </h1>
          </div>
          <button
            onClick={() => navigate("/sales/quotations/new")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + Tạo báo giá
          </button>
        </div>
      </div>
      
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row gap-4 items-center"
            >
              <input
                type="text"
                placeholder="Tìm theo số báo giá, khách hàng..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                Đang tải dữ liệu...
              </div>
            ) : sorted.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Không có báo giá nào
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("quotationNo")}
                        className="flex items-center gap-1"
                      >
                        Số báo giá {getSortIcon("quotationNo")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("status")}
                        className="flex items-center gap-1"
                      >
                        Trạng thái {getSortIcon("status")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("quotationDate")}
                        className="flex items-center gap-1"
                      >
                        Ngày báo giá {getSortIcon("quotationDate")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Người tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Người cập nhật
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
              {paginated.map((quotation) => (
                    <tr key={quotation.quotationId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-sm text-gray-900">
                        {quotation.quotationNo}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {quotation.customerName || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          quotation.status === "Draft" ? "bg-gray-100 text-gray-700" :
                          quotation.status === "Active" ? "bg-blue-100 text-blue-700" :
                          quotation.status === "Converted" ? "bg-green-100 text-green-700" :
                          quotation.status === "Cancelled" ? "bg-red-100 text-red-700" :
                          quotation.status === "Expired" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {STATUS_LABELS[quotation.status] || quotation.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {formatDate(quotation.quotationDate)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {quotation.createdByDisplay || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(quotation.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {quotation.updatedByDisplay || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(quotation.updatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatCurrency(quotation.totalAmount)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/sales/quotations/${quotation.quotationId}`)
                            }
                            className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                            title="Xem chi tiết"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {/* Không cho sửa/xóa khi Converted. Nếu Active thì chỉ Manager mới được sửa/xóa. */}
                          {quotation.status !== "Converted" &&
                            (!quotation.status ||
                              quotation.status !== "Active" ||
                              hasRole("MANAGER") ||
                              hasRole("ROLE_MANAGER")) && (
                            <button
                              onClick={() =>
                                navigate(`/sales/quotations/${quotation.quotationId}/edit`)
                              }
                              className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                              title="Chỉnh sửa"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {quotation.status !== "Converted" &&
                            (!quotation.status ||
                              quotation.status !== "Active" ||
                              hasRole("MANAGER") ||
                              hasRole("ROLE_MANAGER")) && (
                            <button
                              onClick={() => handleDelete(quotation.quotationId)}
                              className="group p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-red-200 hover:border-red-300"
                              title="Xóa"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {sorted.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalElements={sorted.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(0);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}