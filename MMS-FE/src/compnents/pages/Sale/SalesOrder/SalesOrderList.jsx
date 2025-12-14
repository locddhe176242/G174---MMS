import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { salesOrderService } from "../../../../api/salesOrderService";
import { hasRole } from "../../../../api/authService";
import Pagination from "../../../common/Pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Draft", label: "Nháp" },
  { value: "Pending", label: "Chờ xử lý" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Fulfilled", label: "Đã hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
];

const APPROVAL_OPTIONS = [
  { value: "", label: "Tất cả phê duyệt" },
  { value: "Draft", label: "Nháp" },
  { value: "Pending", label: "Chờ phê duyệt" },
  { value: "Approved", label: "Đã phê duyệt" },
  { value: "Rejected", label: "Từ chối" },
];

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Pending: "Chờ xử lý",
    Approved: "Đã duyệt",
    Fulfilled: "Đã hoàn thành",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getApprovalStatusLabel = (approvalStatus) => {
  const approvalMap = {
    Draft: "Nháp",
    Pending: "Chờ phê duyệt",
    Approved: "Đã phê duyệt",
    Rejected: "Từ chối",
  };
  return approvalMap[approvalStatus] || approvalStatus;
};

const getStatusColor = (status) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700";
    case "Pending":
      return "bg-yellow-100 text-yellow-700";
    case "Approved":
      return "bg-blue-100 text-blue-700";
    case "Fulfilled":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getApprovalStatusColor = (approvalStatus) => {
  switch (approvalStatus) {
    case "Draft":
      return "bg-gray-100 text-gray-700";
    case "Pending":
      return "bg-yellow-100 text-yellow-700";
    case "Approved":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatCurrency = (num) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(num || 0)
  );

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

export default function SalesOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await salesOrderService.getAllOrders({
        keyword: searchTerm || undefined,
        status: statusFilter || undefined,
        approvalStatus: approvalStatusFilter || undefined,
      });
      const list = Array.isArray(response) ? response : response?.content || response?.data || [];
      setOrders(list);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải danh sách đơn bán hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesKeyword =
        !term ||
        (order.orderNo || "").toLowerCase().includes(term) ||
        (order.customerName || "").toLowerCase().includes(term);
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesApprovalStatus =
        !approvalStatusFilter || order.approvalStatus === approvalStatusFilter;
      return matchesKeyword && matchesStatus && matchesApprovalStatus;
    });
  }, [orders, searchTerm, statusFilter, approvalStatusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const direction = sortDir === "asc" ? 1 : -1;

    return list.sort((a, b) => {
      const valueA = a?.[sortField];
      const valueB = b?.[sortField];

      if (valueA === valueB) return 0;

      if (sortField === "orderDate" || sortField === "createdAt" || sortField === "updatedAt") {
        return (new Date(valueA || 0) - new Date(valueB || 0)) * direction;
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn bán hàng này?")) return;
    try {
      await salesOrderService.deleteOrder(id);
      toast.success("Đã xóa đơn bán hàng");
      fetchAllOrders();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa đơn bán hàng");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn bán hàng</h1>
          </div>
          <button
            onClick={() => navigate("/sales/orders/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Tạo đơn bán hàng
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Tìm theo số đơn, khách hàng..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
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
              <select
                value={approvalStatusFilter}
                onChange={(e) => {
                  setApprovalStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg"
              >
                {APPROVAL_OPTIONS.map((opt) => (
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
              <div className="py-12 text-center text-gray-500">Không có đơn bán hàng nào</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("orderNo")}
                        className="flex items-center gap-1"
                      >
                        Số đơn {getSortIcon("orderNo")}
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
                      Phê duyệt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("orderDate")}
                        className="flex items-center gap-1"
                      >
                        Ngày đơn {getSortIcon("orderDate")}
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
                  {paginated.map((order) => (
                    <tr key={order.orderId || order.soId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-sm text-gray-900">
                        {order.orderNo || order.soNo || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {order.customerName || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getApprovalStatusColor(
                            order.approvalStatus
                          )}`}
                        >
                          {getApprovalStatusLabel(order.approvalStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {order.createdByDisplay || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {order.updatedByDisplay || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(order.updatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() =>
                              navigate(`/sales/orders/${order.orderId || order.soId}`)
                            }
                            className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                            title="Xem chi tiết"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {/* Chỉ hiển thị nút Sửa nếu:
                              - approvalStatus = Draft: tất cả user
                              - approvalStatus = Pending: chỉ Manager
                              - approvalStatus = Approved: chỉ Manager
                              - approvalStatus = Rejected: tất cả user
                          */}
                          {(order.approvalStatus === "Draft" || 
                            order.approvalStatus === "Rejected" || 
                            (order.approvalStatus === "Pending" && (hasRole("MANAGER") || hasRole("ROLE_MANAGER"))) ||
                            (order.approvalStatus === "Approved" && (hasRole("MANAGER") || hasRole("ROLE_MANAGER")))) && (
                            <button
                              onClick={() =>
                                navigate(`/sales/orders/${order.orderId || order.soId}/edit`)
                              }
                              className="text-green-600 hover:underline"
                            >
                              Sửa
                            </button>
                          )}
                          {/* Chỉ hiển thị nút Xóa nếu:
                              - approvalStatus = Draft: tất cả user
                              - approvalStatus = Pending: chỉ Manager
                              - approvalStatus = Approved: chỉ Manager
                              - approvalStatus = Rejected: tất cả user
                          */}
                          {(order.approvalStatus === "Draft" || 
                            order.approvalStatus === "Rejected" || 
                            (order.approvalStatus === "Pending" && (hasRole("MANAGER") || hasRole("ROLE_MANAGER"))) ||
                            (order.approvalStatus === "Approved" && (hasRole("MANAGER") || hasRole("ROLE_MANAGER")))) && (
                            <button
                              onClick={() => handleDelete(order.orderId || order.soId)}
                              className="text-red-600 hover:underline"
                            >
                              Xóa
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
