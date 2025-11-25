import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { deliveryService } from "../../../../api/deliveryService";

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

export default function DeliveryList() {
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
    salesOrderId: "",
    page: 0,
    size: 10,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveryService.getDeliveries({
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
        salesOrderId: filters.salesOrderId || undefined,
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
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
      toast.error("Không thể tải danh sách phiếu giao hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.size, filters.sortBy, filters.sortDir]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 0 }));
    fetchDeliveries();
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
            <p className="text-gray-500">Theo dõi và quản lý các phiếu giao hàng</p>
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
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <input
                type="number"
                placeholder="Sales Order ID"
                value={filters.salesOrderId}
                onChange={(e) => setFilters((prev) => ({ ...prev, salesOrderId: e.target.value, page: 0 }))}
                className="px-3 py-2 border rounded-lg"
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
                      Mã vận đơn
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.content.map((delivery) => (
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
                        {delivery.plannedDate
                          ? new Date(delivery.plannedDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{delivery.trackingCode || "—"}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center gap-3 justify-center">
                          <button
                            onClick={() => navigate(`/sales/deliveries/${delivery.deliveryId}`)}
                            className="text-blue-600 hover:underline"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => navigate(`/sales/deliveries/${delivery.deliveryId}/edit`)}
                            className="text-green-600 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(delivery.deliveryId)}
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
                Trang {data.number + 1} / {data.totalPages} ({data.totalElements} phiếu)
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

