import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { salesReturnInboundOrderService } from "../../../../api/salesReturnInboundOrderService";
import Pagination from "../../../common/Pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Draft", label: "Nháp" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "SentToWarehouse", label: "Đã gửi kho" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
];

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Approved: "Đã duyệt",
    SentToWarehouse: "Đã gửi kho",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700";
    case "Approved":
      return "bg-blue-100 text-blue-700";
    case "SentToWarehouse":
      return "bg-indigo-100 text-indigo-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";

export default function SalesReturnInboundOrderList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [returnOrderFilter, setReturnOrderFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await salesReturnInboundOrderService.getAll();
      const list = Array.isArray(response)
        ? response
        : response?.content || response?.data || [];
      setData(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Đơn nhập hàng lại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.filter((sri) => {
      const matchesKeyword =
        !term ||
        (sri.sriNo || "").toLowerCase().includes(term) ||
        (sri.returnNo || "").toLowerCase().includes(term);
      const matchesStatus = !statusFilter || sri.status === statusFilter;
      const matchesRo =
        !returnOrderFilter ||
        (sri.roId && sri.roId.toString() === returnOrderFilter.trim());
      return matchesKeyword && matchesStatus && matchesRo;
    });
  }, [data, searchTerm, statusFilter, returnOrderFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const direction = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const valueA = a?.[sortField];
      const valueB = b?.[sortField];
      if (valueA === valueB) return 0;
      if (
        sortField.toLowerCase().includes("date") ||
        sortField.toLowerCase().includes("at")
      ) {
        return (new Date(valueA || 0) - new Date(valueB || 0)) * direction;
      }
      if (
        typeof valueA === "number" ||
        typeof valueB === "number" ||
        sortField.toLowerCase().includes("id")
      ) {
        return (Number(valueA || 0) - Number(valueB || 0)) * direction;
      }
      return (
        valueA
          ?.toString()
          .localeCompare(valueB?.toString() || "", "vi", {
            sensitivity: "base",
            numeric: true,
          }) * direction
      );
    });
  }, [filtered, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = currentPage * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  const changeSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <span className="text-gray-300">↕</span>;
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
              Đơn nhập hàng trả lại
            </h1>
          </div>
          <button
            onClick={() => navigate("/sales/return-inbound-orders/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Tạo Đơn nhập hàng trả lại
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <input
                type="text"
                placeholder="Tìm theo số Đơn nhập lại / Đơn trả hàng..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <input
                type="number"
                placeholder="Return Order ID"
                value={returnOrderFilter}
                onChange={(e) => {
                  setReturnOrderFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg"
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
                Chưa có Đơn nhập hàng lại nào
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("sriNo")}
                        className="flex items-center gap-1"
                      >
                        Số Đơn nhập lại {getSortIcon("sriNo")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Đơn trả hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kho
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("expectedReceiptDate")}
                        className="flex items-center gap-1"
                      >
                        Ngày dự kiến nhập {getSortIcon("expectedReceiptDate")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Người tạo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map((row) => (
                    <tr key={row.sriId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">
                        {row.sriNo || `SRI-${row.sriId}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>
                          <span className="font-medium">
                            {row.returnNo || "—"}
                          </span>
                        </div>
                        {row.roId && (
                          <div className="text-xs text-gray-500">
                            RO ID: {row.roId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.warehouseName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            row.status
                          )}`}
                        >
                          {getStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(row.expectedReceiptDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {row.createdByName || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(row.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() =>
                            navigate(
                              `/sales/return-inbound-orders/${row.sriId}`
                            )
                          }
                          className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                          title="Xem chi tiết"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
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
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(0);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}


