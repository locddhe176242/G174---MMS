import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { invoiceService } from "../../../../api/invoiceService";
import Pagination from "../../../common/Pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Unpaid", label: "Chưa thanh toán" },
  { value: "PartiallyPaid", label: "Thanh toán một phần" },
  { value: "Paid", label: "Đã thanh toán" },
  { value: "Cancelled", label: "Đã hủy" },
];

const getStatusLabel = (status) => {
  const statusMap = {
    Unpaid: "Chưa thanh toán",
    PartiallyPaid: "Thanh toán một phần",
    Paid: "Đã thanh toán",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colorMap = {
    Unpaid: "bg-red-100 text-red-800",
    PartiallyPaid: "bg-yellow-100 text-yellow-800",
    Paid: "bg-green-100 text-green-800",
    Cancelled: "bg-gray-100 text-gray-500",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getAllInvoices();
      const list = Array.isArray(response) ? response : response?.content || response?.data || [];
      setInvoices(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesKeyword =
        !term ||
        (inv.invoiceNo || "").toLowerCase().includes(term) ||
        (inv.customerName || "").toLowerCase().includes(term) ||
        (inv.deliveryNo || "").toLowerCase().includes(term) ||
        (inv.salesOrderNo || "").toLowerCase().includes(term);
      const matchesStatus = !statusFilter || inv.status === statusFilter;
      const matchesCustomer =
        !customerFilter ||
        (inv.customerId && inv.customerId.toString() === customerFilter.trim());
      return matchesKeyword && matchesStatus && matchesCustomer;
    });
  }, [invoices, searchTerm, statusFilter, customerFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const direction = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const valueA = a?.[sortField];
      const valueB = b?.[sortField];
      if (valueA === valueB) return 0;
      if (sortField === "invoiceDate" || sortField === "dueDate" || sortField === "createdAt" || sortField === "updatedAt") {
        return (new Date(valueA || 0) - new Date(valueB || 0)) * direction;
      }
      if (
        typeof valueA === "number" ||
        typeof valueB === "number" ||
        sortField === "totalAmount" ||
        sortField === "balanceAmount"
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa hóa đơn này?")) return;
    try {
      await invoiceService.deleteInvoice(id);
      toast.success("Đã xóa hóa đơn");
      fetchInvoices();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể xóa hóa đơn");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Danh sách hóa đơn</h1>
                <p className="mt-1 text-sm text-gray-500">Quản lý các hóa đơn bán hàng</p>
              </div>
              <button
                onClick={() => navigate("/sales/invoices/new")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Tạo hóa đơn
              </button>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Tìm theo số hóa đơn, khách hàng, Delivery..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <input
                type="number"
                placeholder="Customer ID"
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value);
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
                <div className="py-12 text-center text-gray-500">Không có hóa đơn nào</div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button onClick={() => changeSort("invoiceNo")} className="flex items-center gap-1">
                          Số hóa đơn {getSortIcon("invoiceNo")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Delivery
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sales Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => changeSort("invoiceDate")}
                          className="flex items-center gap-1"
                        >
                          Ngày xuất {getSortIcon("invoiceDate")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => changeSort("dueDate")}
                          className="flex items-center gap-1"
                        >
                          Ngày đến hạn {getSortIcon("dueDate")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => changeSort("totalAmount")}
                          className="flex items-center gap-1"
                        >
                          Tổng tiền {getSortIcon("totalAmount")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => changeSort("balanceAmount")}
                          className="flex items-center gap-1"
                        >
                          Còn nợ {getSortIcon("balanceAmount")}
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
                    {paginated.map((inv) => (
                      <tr key={inv.arInvoiceId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{inv.invoiceNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inv.customerName || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inv.deliveryNo || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inv.salesOrderNo || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inv.status)}`}>
                            {getStatusLabel(inv.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(inv.invoiceDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                          {formatCurrency(inv.balanceAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>{inv.createdByDisplay || "—"}</div>
                          <div className="text-xs text-gray-500">{formatDateTime(inv.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center gap-3 justify-center">
                            <button
                              onClick={() => navigate(`/sales/invoices/${inv.arInvoiceId}`)}
                              className="text-blue-600 hover:underline"
                            >
                              Xem
                            </button>
                            {/* Hóa đơn gốc không cho sửa; chỉ cho phép xóa khi:
                                - Chưa Paid/Cancelled
                                - Không có thanh toán
                                - Không có Credit Note
                            */}
                            {inv.status !== "Paid" &&
                              inv.status !== "Cancelled" &&
                              !inv.hasPayment &&
                              !inv.hasCreditNote && (
                                <button
                                  onClick={() => handleDelete(inv.arInvoiceId)}
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
