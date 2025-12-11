import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { deliveryService } from "../../../../api/deliveryService";
import Pagination from "../../../common/Pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Draft", label: "Nháp" },
  { value: "Picked", label: "Đang chuẩn bị hàng" },
  { value: "Shipped", label: "Đã xuất kho" },
  { value: "Delivered", label: "Đã giao hàng" },
  { value: "Cancelled", label: "Đã hủy" },
];

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Picked: "Đang chuẩn bị hàng",
    Shipped: "Đã xuất kho",
    Delivered: "Đã giao hàng",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");

export default function DeliveryList() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [salesOrderFilter, setSalesOrderFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveryService.getAllDeliveries();
      const list = Array.isArray(response) ? response : response?.content || response?.data || [];
      setDeliveries(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách phiếu giao hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return deliveries.filter((delivery) => {
      const matchesKeyword =
        !term ||
        (delivery.deliveryNo || "").toLowerCase().includes(term) ||
        (delivery.trackingCode || "").toLowerCase().includes(term);
      const matchesStatus = !statusFilter || delivery.status === statusFilter;
      const matchesSalesOrder =
        !salesOrderFilter ||
        (delivery.salesOrderId && delivery.salesOrderId.toString() === salesOrderFilter.trim());
      return matchesKeyword && matchesStatus && matchesSalesOrder;
    });
  }, [deliveries, searchTerm, statusFilter, salesOrderFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const direction = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const valueA = a?.[sortField];
      const valueB = b?.[sortField];
      if (valueA === valueB) return 0;
      if (sortField === "plannedDate" || sortField === "actualDate" || sortField === "createdAt") {
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
          .localeCompare(valueB?.toString() || "", "vi", { sensitivity: "base", numeric: true }) *
        direction
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

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa phiếu giao hàng này?")) return;
    try {
      await deliveryService.deleteDelivery(id);
      toast.success("Đã xóa phiếu giao hàng");
      fetchDeliveries();
    } catch (error) {
      toast.error("Không thể xóa phiếu giao hàng");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-700";
      case "Picked":
        return "bg-yellow-100 text-yellow-700";
      case "Shipped":
        return "bg-blue-100 text-blue-700";
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Phiếu Giao Hàng</h1>
          </div>
          <button
            onClick={() => navigate("/sales/deliveries/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Tạo Phiếu Giao Hàng
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Tìm theo số phiếu, mã vận đơn..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <input
                type="number"
                placeholder="Sales Order ID"
                value={salesOrderFilter}
                onChange={(e) => {
                  setSalesOrderFilter(e.target.value);
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
              <div className="py-12 text-center text-gray-500">Đang tải dữ liệu...</div>
            ) : sorted.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Không có phiếu giao hàng nào</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button onClick={() => changeSort("deliveryNo")} className="flex items-center gap-1">
                        Số phiếu {getSortIcon("deliveryNo")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sales Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Khách hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kho
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("plannedDate")}
                        className="flex items-center gap-1"
                      >
                        Ngày giao {getSortIcon("plannedDate")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Người tạo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mã vận đơn
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map((delivery) => (
                    <tr key={delivery.deliveryId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{delivery.deliveryNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{delivery.salesOrderNo || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{delivery.customerName || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{delivery.warehouseName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                          {getStatusLabel(delivery.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(delivery.plannedDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {delivery.createdByDisplay || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(delivery.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{delivery.trackingCode || "—"}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => navigate(`/sales/deliveries/${delivery.deliveryId}`)}
                            className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                            title="Xem chi tiết"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => navigate(`/sales/deliveries/${delivery.deliveryId}/edit`)}
                            className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                            title="Chỉnh sửa"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(delivery.deliveryId)}
                            className="group p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-red-200 hover:border-red-300"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
