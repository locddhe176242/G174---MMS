import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { salesQuotationService } from "../../../../api/salesQuotationService";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "Draft", label: "Draft" },
  { value: "Active", label: "Active" },
  { value: "Converted", label: "Converted" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Expired", label: "Expired" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

export default function SalesQuotationList() {
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
    page: 0,
    size: 10,
    sortBy: "quotationDate",
    sortDir: "desc",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await salesQuotationService.getQuotations({
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
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
      console.error("Error fetching quotations:", error);
      toast.error("Không thể tải danh sách báo giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.size, filters.sortBy, filters.sortDir]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 0 }));
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa báo giá này?")) return;
    try {
      await salesQuotationService.deleteQuotation(id);
      toast.success("Đã xóa báo giá");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa báo giá");
    }
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
    if (filters.sortBy !== field) {
      return <span className="text-gray-300">↕</span>;
    }
    return filters.sortDir === "asc" ? (
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
              Quản lý Sales Quotation
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
                value={filters.keyword}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, keyword: e.target.value }))
                }
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                    page: 0,
                  }))
                }
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
            ) : data.content.length === 0 ? (
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.content.map((quotation) => (
                    <tr key={quotation.quotationId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-sm text-gray-900">
                        {quotation.quotationNo}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {quotation.customerName || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {quotation.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {quotation.quotationDate
                          ? new Date(quotation.quotationDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {quotation.validUntil
                          ? new Date(quotation.validUntil).toLocaleDateString("vi-VN")
                          : "—"}
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

