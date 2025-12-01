import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { returnOrderService } from "../../../../api/returnOrderService";
import Pagination from "../../../common/Pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Draft", label: "Nháp" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Từ chối" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
];

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Approved: "Đã duyệt",
    Rejected: "Từ chối",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colorMap = {
    Draft: "bg-gray-100 text-gray-800",
    Approved: "bg-blue-100 text-blue-800",
    Rejected: "bg-red-100 text-red-800",
    Completed: "bg-green-100 text-green-800",
    Cancelled: "bg-gray-100 text-gray-500",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");

export default function ReturnOrderList() {
  const navigate = useNavigate();
  const [returnOrders, setReturnOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const fetchReturnOrders = async () => {
    try {
      setLoading(true);
      const response = await returnOrderService.getAllReturnOrders();
      const list = Array.isArray(response) ? response : response?.content || response?.data || [];
      setReturnOrders(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách đơn trả hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnOrders();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return returnOrders.filter((ro) => {
      const matchesKeyword =
        !term ||
        (ro.returnNo || "").toLowerCase().includes(term) ||
        (ro.deliveryNo || "").toLowerCase().includes(term);
      const matchesStatus = !statusFilter || ro.status === statusFilter;
      const matchesDelivery =
        !deliveryFilter ||
        (ro.deliveryId && ro.deliveryId.toString() === deliveryFilter.trim());
      return matchesKeyword && matchesStatus && matchesDelivery;
    });
  }, [returnOrders, searchTerm, statusFilter, deliveryFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const direction = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const valueA = a?.[sortField];
      const valueB = b?.[sortField];
      if (valueA === valueB) return 0;
      if (sortField === "returnDate" || sortField === "createdAt") {
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
    if (sortField !== field) {
      return <span className="text-gray-300">↕</span>;
    }
    return sortDir === "asc" ? (
      <span className="text-blue-600">↑</span>
    ) : (
      <span className="text-blue-600">↓</span>
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn trả hàng này?")) return;
    try {
      await returnOrderService.deleteReturnOrder(id);
      toast.success("Đã xóa đơn trả hàng");
      fetchReturnOrders();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa đơn trả hàng");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Danh sách đơn trả hàng</h1>
                <p className="mt-1 text-sm text-gray-500">Quản lý các đơn trả hàng từ khách hàng</p>
              </div>
              <button
                onClick={() => navigate("/sales/return-orders/new")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Tạo đơn trả hàng
              </button>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Tìm theo số đơn, số phiếu giao hàng..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <input
                type="number"
                placeholder="Delivery ID"
                value={deliveryFilter}
                onChange={(e) => {
                  setDeliveryFilter(e.target.value);
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

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-gray-500">Đang tải dữ liệu...</div>
              ) : sorted.length === 0 ? (
                <div className="py-12 text-center text-gray-500">Không có đơn trả hàng nào</div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button onClick={() => changeSort("returnNo")} className="flex items-center gap-1">
                          Số đơn {getSortIcon("returnNo")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Delivery
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
                          onClick={() => changeSort("returnDate")}
                          className="flex items-center gap-1"
                        >
                          Ngày trả {getSortIcon("returnDate")}
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
                    {paginated.map((ro) => (
                      <tr key={ro.roId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{ro.returnNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{ro.deliveryNo || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{ro.salesOrderNo || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{ro.customerName || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{ro.warehouseName || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ro.status)}`}>
                            {getStatusLabel(ro.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(ro.returnDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>{ro.createdByDisplay || "—"}</div>
                          <div className="text-xs text-gray-500">{formatDateTime(ro.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center gap-3 justify-center">
                            <button
                              onClick={() => navigate(`/sales/return-orders/${ro.roId}`)}
                              className="text-blue-600 hover:underline"
                            >
                              Xem
                            </button>
                            <button
                              onClick={() => navigate(`/sales/return-orders/${ro.roId}/edit`)}
                              className="text-green-600 hover:underline"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(ro.roId)}
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
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(0);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

