import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { salesOrderService } from "../../../../api/salesOrderService";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Fulfilled", label: "Fulfilled" },
  { value: "Cancelled", label: "Cancelled" },
];

const APPROVAL_OPTIONS = [
  { value: "", label: "Tất cả phê duyệt" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const formatCurrency = (num) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(num || 0)
  );

export default function SalesOrderList() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    approvalStatus: "",
    page: 0,
    size: 10,
    sortBy: "orderDate",
    sortDir: "desc",
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await salesOrderService.getOrders({
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
        approvalStatus: filters.approvalStatus || undefined,
        page: filters.page,
        size: filters.size,
        sort: `${filters.sortBy},${filters.sortDir}`,
      });
      setData({
        content: response.content || [],
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
        number: response.number || 0,
        size: response.size || filters.size,
      });
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Sales Order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.size, filters.sortBy, filters.sortDir]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 0 }));
    fetchOrders();
  };

  const changePage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const changeSort = (field) => {
    setFilters((prev) => {
      if (prev.sortBy === field) {
        return { ...prev, sortDir: prev.sortDir === "asc" ? "desc" : "asc" };
      }
      return { ...prev, sortBy: field, sortDir: "asc" };
    });
  };

  const getSortIcon = (field) => {
    if (filters.sortBy !== field) return <span className="text-gray-300">↕</span>;
    return filters.sortDir === "asc" ? (
      <span className="text-blue-600">↑</span>
    ) : (
      <span className="text-blue-600">↓</span>
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa Sales Order này?")) return;
    try {
      await salesOrderService.deleteOrder(id);
      toast.success("Đã xóa Sales Order");
      fetchOrders();
    } catch (error) {
      toast.error("Không thể xóa Sales Order");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Sales Order</h1>
            <p className="text-gray-500">Theo dõi đơn bán hàng và trạng thái thực hiện</p>
          </div>
          <button
            onClick={() => navigate("/sales/orders/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Tạo Sales Order
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
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 0 }))}
                className="px-3 py-2 border rounded-lg"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.approvalStatus}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, approvalStatus: e.target.value, page: 0 }))
                }
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
            ) : data.content.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Không có Sales Order nào</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button onClick={() => changeSort("soNo")} className="flex items-center gap-1">
                        Số đơn {getSortIcon("soNo")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Khách hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phê duyệt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => changeSort("orderDate")}
                        className="flex items-center gap-1"
                      >
                        Ngày đơn {getSortIcon("orderDate")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tổng tiền
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.content.map((order) => (
                    <tr key={order.soId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{order.soNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.customerName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {order.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center gap-3 justify-center">
                          <button
                            onClick={() => navigate(`/sales/orders/${order.soId}`)}
                            className="text-blue-600 hover:underline"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => navigate(`/sales/orders/${order.soId}/edit`)}
                            className="text-green-600 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(order.soId)}
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

          {data.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Trang {data.number + 1} / {data.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(filters.page - 1)}
                  disabled={filters.page === 0}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => changePage(filters.page + 1)}
                  disabled={filters.page >= data.totalPages - 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

