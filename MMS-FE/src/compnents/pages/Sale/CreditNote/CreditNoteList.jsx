import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { creditNoteService } from "../../../../api/creditNoteService";
import Pagination from "../../../common/Pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Draft", label: "Nháp" },
  { value: "Issued", label: "Đã xuất" },
  { value: "Applied", label: "Đã áp dụng" },
  { value: "Cancelled", label: "Đã hủy" },
];

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Issued: "Đã xuất",
    Applied: "Đã áp dụng",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colorMap = {
    Draft: "bg-gray-100 text-gray-800",
    Issued: "bg-blue-100 text-blue-800",
    Applied: "bg-green-100 text-green-800",
    Cancelled: "bg-gray-100 text-gray-500",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

export default function CreditNoteList() {
  const navigate = useNavigate();
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const response = await creditNoteService.getAllCreditNotes();
      const list = Array.isArray(response) ? response : response?.content || response?.data || [];
      setCreditNotes(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách hoá đơn điều chỉnh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return creditNotes.filter((cn) => {
      const matchesKeyword =
        !term ||
        (cn.creditNoteNo || "").toLowerCase().includes(term) ||
        (cn.invoiceNo || "").toLowerCase().includes(term);
      const matchesStatus = !statusFilter || cn.status === statusFilter;
      const matchesInvoice =
        !invoiceFilter ||
        (cn.invoiceId && cn.invoiceId.toString() === invoiceFilter.trim());
      return matchesKeyword && matchesStatus && matchesInvoice;
    });
  }, [creditNotes, searchTerm, statusFilter, invoiceFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const direction = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const valueA = a?.[sortField];
      const valueB = b?.[sortField];
      if (valueA === valueB) return 0;
      if (sortField === "creditNoteDate" || sortField === "createdAt") {
        return (new Date(valueA || 0) - new Date(valueB || 0)) * direction;
      }
      if (
        typeof valueA === "number" ||
        typeof valueB === "number" ||
        sortField === "totalAmount"
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa hoá đơn điều chỉnh này?")) return;
    try {
      await creditNoteService.deleteCreditNote(id);
      toast.success("Đã xóa hoá đơn điều chỉnh");
      fetchCreditNotes();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa hoá đơn điều chỉnh");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh sách hoá đơn điều chỉnh</h1>
          </div>
          <button
            onClick={() => navigate("/sales/credit-notes/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Tạo hoá đơn điều chỉnh
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Tìm theo số hoá đơn điều chỉnh, số hoá đơn bán hàng..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <input
                type="number"
                  placeholder="ID hoá đơn bán hàng"
                value={invoiceFilter}
                onChange={(e) => {
                  setInvoiceFilter(e.target.value);
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
                <div className="py-12 text-center text-gray-500">Không có hoá đơn điều chỉnh nào</div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button onClick={() => changeSort("creditNoteNo")} className="flex items-center gap-1">
                          Số hoá đơn điều chỉnh {getSortIcon("creditNoteNo")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hoá đơn bán hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Đơn bán hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Đơn trả hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => changeSort("creditNoteDate")}
                          className="flex items-center gap-1"
                        >
                          Ngày xuất {getSortIcon("creditNoteDate")}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Người tạo
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginated.map((cn) => (
                      <tr key={cn.cnId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{cn.creditNoteNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{cn.invoiceNo || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{cn.salesOrderNo || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{cn.returnOrderNo || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{cn.customerName || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cn.status)}`}>
                            {getStatusLabel(cn.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(cn.creditNoteDate)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <div className="font-semibold text-gray-900">{formatCurrency(cn.totalAmount)}</div>
                          {cn.appliedToBalance > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              Bù trừ: {formatCurrency(cn.appliedToBalance)}
                            </div>
                          )}
                          {cn.refundAmount > 0 && (
                            <div className="text-xs mt-1">
                              <div className="text-orange-600">
                                Phải trả: {formatCurrency(cn.refundAmount)}
                              </div>
                              <div className="text-gray-600">
                                Đã trả: {formatCurrency(cn.refundPaidAmount || 0)}
                              </div>
                              {cn.refundPaidAmount >= cn.refundAmount ? (
                                <div className="text-green-600 font-semibold">✓ Hoàn tất</div>
                              ) : (
                                <div className="text-red-600">
                                  Còn: {formatCurrency((cn.refundAmount || 0) - (cn.refundPaidAmount || 0))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cn.createdByDisplay || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/sales/credit-notes/${cn.cnId}`)}
                              className="group p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-blue-200 hover:border-blue-300"
                              title="Xem chi tiết"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => navigate(`/sales/credit-notes/${cn.cnId}/edit`)}
                              className="group p-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                              title="Chỉnh sửa"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(cn.cnId)}
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
