import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { salesQuotationService } from "../../../../api/salesQuotationService";
import Pagination from "../../../common/Pagination";

const STATUS_LABELS = {
  Draft: "Nháp",
  Active: "Đang mở",
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
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý báo giá bán hàng
            </h1>
            <p className="text-gray-500">
              Theo dõi và quản lý báo giá cho khách hàng
            </p>
          </div>
          <button
            onClick={() => navigate("/sales/quotations/new")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + Tạo báo giá
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
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
                      Hạn báo giá
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
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {STATUS_LABELS[quotation.status] || quotation.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {formatDate(quotation.quotationDate)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {formatDate(quotation.validUntil)}
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
                        <div className="flex items-center gap-3 justify-center">
                          <button
                            onClick={() =>
                              navigate(`/sales/quotations/${quotation.quotationId}`)
                            }
                            className="text-blue-600 hover:underline"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/sales/quotations/${quotation.quotationId}/edit`)
                            }
                            className="text-green-600 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(quotation.quotationId)}
                            className="text-red-600 hover:underline"
                          >
                            Xóa
                          </button>
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
