import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as ExcelJS from "exceljs";
import Pagination from "../common/Pagination.jsx";
import debtManagementService from "../../api/debtManagementService.js";

export default function DebtManagementDetail() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [allTransactions, setAllTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState("transactionDate");
  const [sortDirection, setSortDirection] = useState("desc");

  // Kỳ hiện tại (theo tháng)
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [openingBalance, setOpeningBalance] = useState(0);
  const [periodMovement, setPeriodMovement] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [totalDebitInPeriod, setTotalDebitInPeriod] = useState(0);
  const [totalCreditInPeriod, setTotalCreditInPeriod] = useState(0);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount));
  };

  const parseDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const recalculateSummaryAndPaging = (
    sourceTransactions,
    month = selectedMonth,
    year = selectedYear,
    page = currentPage,
    size = pageSize,
    sortFieldValue = sortField,
    sortDirectionValue = sortDirection
  ) => {
    if (!Array.isArray(sourceTransactions) || sourceTransactions.length === 0) {
      setOpeningBalance(0);
      setPeriodMovement(0);
      setClosingBalance(0);
      setTotalDebitInPeriod(0);
      setTotalCreditInPeriod(0);
      setTransactions([]);
      setTotalElements(0);
      setTotalPages(0);
      setCurrentPage(0);
      return;
    }

    // Kỳ: từ ngày 1 đến ngày cuối tháng
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0); // ngày cuối tháng

    const beforePeriod = [];
    const inPeriod = [];

    sourceTransactions.forEach((t) => {
      const d = parseDate(t.transactionDate);
      if (!d) return;
      if (d < periodStart) {
        beforePeriod.push(t);
      } else if (d >= periodStart && d <= periodEnd) {
        inPeriod.push(t);
      }
    });

    const calcBalance = (list) =>
      list.reduce((sum, t) => {
        const debit = Number(t.debitAmount || 0);
        const credit = Number(t.creditAmount || 0);
        return sum + (debit - credit);
      }, 0);

    const opening = calcBalance(beforePeriod);
    const movement = calcBalance(inPeriod);
    const closing = opening + movement;

    // Tính tổng Nợ và Có trong kỳ
    const totalDebit = inPeriod.reduce((sum, t) => sum + Number(t.debitAmount || 0), 0);
    const totalCredit = inPeriod.reduce((sum, t) => sum + Number(t.creditAmount || 0), 0);

    setOpeningBalance(opening);
    setPeriodMovement(movement);
    setClosingBalance(closing);
    setTotalDebitInPeriod(totalDebit);
    setTotalCreditInPeriod(totalCredit);

    // Sort in-period list
    const sorted = [...inPeriod].sort((a, b) => {
      const dir = sortDirectionValue === "asc" ? 1 : -1;
      if (sortFieldValue === "transactionDate") {
        const da = parseDate(a.transactionDate) || new Date(0);
        const db = parseDate(b.transactionDate) || new Date(0);
        return (da - db) * dir;
      }
      if (sortFieldValue === "debitAmount" || sortFieldValue === "creditAmount") {
        const va = Number(a[sortFieldValue] || 0);
        const vb = Number(b[sortFieldValue] || 0);
        return (va - vb) * dir;
      }
      // fallback string compare
      const va = (a[sortFieldValue] || "").toString().toLowerCase();
      const vb = (b[sortFieldValue] || "").toString().toLowerCase();
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    const total = sorted.length;
    const totalPageCount = Math.max(1, Math.ceil(total / size));
    const safePage = Math.min(Math.max(page, 0), totalPageCount - 1);
    const startIndex = safePage * size;
    const endIndex = startIndex + size;
    const pageData = sorted.slice(startIndex, endIndex);

    setTransactions(pageData);
    setTotalElements(total);
    setTotalPages(totalPageCount);
    setCurrentPage(safePage);
  };

  const fetchAllForCode = async () => {
    try {
      setLoading(true);
      setError(null);
      // Gọi endpoint có phân trang: /debt-transactions/search/page
      // Lấy tối đa 1000 bản ghi để đủ cho 1 mã KH/NCC trong thực tế
      const resp =
        await debtManagementService.searchDebtTransactionsWithPagination(
          code || "",
          0,
          1000,
          "transactionDate,asc"
        );
      const data = resp?.content || [];
      setAllTransactions(data);
      recalculateSummaryAndPaging(data, selectedMonth, selectedYear, 0, pageSize);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Không tải được chi tiết giao dịch";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllForCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Khi thay đổi kỳ, sort, pageSize -> tính lại từ dữ liệu đã load
  useEffect(() => {
    if (!allTransactions || allTransactions.length === 0) return;
    recalculateSummaryAndPaging(allTransactions, selectedMonth, selectedYear, 0, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, sortField, sortDirection, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field)
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    return sortDirection === "asc" ? (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
        />
      </svg>
    );
  };

  const handlePageChange = (page) => {
    if (page < 0 || page >= totalPages) return;
    recalculateSummaryAndPaging(allTransactions, selectedMonth, selectedYear, page, pageSize);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    recalculateSummaryAndPaging(allTransactions, selectedMonth, selectedYear, 0, size);
  };

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`,
      })),
    []
  );

  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 4; y -= 1) {
      years.push({ value: y, label: `Năm ${y}` });
    }
    return years;
  }, [today]);

  const exportToExcel = async () => {
    try {
      if (!transactions || transactions.length === 0) {
        toast.warning("Không có dữ liệu để xuất Excel");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Chi tiết công nợ");

      // Set column widths
      worksheet.columns = [
        { width: 8 },
        { width: 40 },
        { width: 15 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 15 },
      ];

      // Add title row
      const monthStr = `T${selectedMonth}`;
      const titleText = `CHI TIẾT GIAO DỊCH CÔNG NỢ ${monthStr}.${selectedYear}`;
      const titleRow = worksheet.addRow([titleText]);
      worksheet.mergeCells(`A1:G1`);
      titleRow.getCell(1).font = { bold: true, size: 14 };
      titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      titleRow.height = 25;

      // Add info row
      const infoRow = worksheet.addRow([
        `Mã KH/NCC: ${code || "-"}`,
        "",
        "",
        `Kỳ: Tháng ${selectedMonth}/${selectedYear}`,
        "",
        "",
        "",
      ]);
      worksheet.mergeCells(`A2:G2`);
      infoRow.getCell(1).font = { italic: true };
      infoRow.height = 20;

      // Add summary section at top (optional, can remove if not needed)
      const topSummaryStartRow = 4;
      worksheet.getCell(`A${topSummaryStartRow}`).value = "TỔNG HỢP CÔNG NỢ";
      worksheet.getCell(`A${topSummaryStartRow}`).font = { bold: true, size: 12 };
      worksheet.mergeCells(`A${topSummaryStartRow}:B${topSummaryStartRow}`);

      worksheet.getCell(`A${topSummaryStartRow + 1}`).value = "Số dư nợ đầu kỳ:";
      worksheet.getCell(`B${topSummaryStartRow + 1}`).value = openingBalance;
      worksheet.getCell(`B${topSummaryStartRow + 1}`).numFmt = "#,##0";
      worksheet.getCell(`B${topSummaryStartRow + 1}`).font = { bold: true };

      worksheet.getCell(`A${topSummaryStartRow + 2}`).value = "Tổng phát sinh trong kỳ:";
      worksheet.getCell(`B${topSummaryStartRow + 2}`).value = periodMovement;
      worksheet.getCell(`B${topSummaryStartRow + 2}`).numFmt = "#,##0";
      worksheet.getCell(`B${topSummaryStartRow + 2}`).font = { bold: true };

      worksheet.getCell(`A${topSummaryStartRow + 3}`).value = "Số dư nợ cuối kỳ:";
      worksheet.getCell(`B${topSummaryStartRow + 3}`).value = closingBalance;
      worksheet.getCell(`B${topSummaryStartRow + 3}`).numFmt = "#,##0";
      worksheet.getCell(`B${topSummaryStartRow + 3}`).font = { bold: true };

      // Add header row for data table
      const headerRow = worksheet.addRow([
        "STT",
        "Nội dung",
        "Loại",
        "Nợ",
        "Có",
        "Ngày giao dịch",
        "Ref",
      ]);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 20;

      // Add data rows
      transactions.forEach((t, index) => {
        const row = worksheet.addRow([
          index + 1,
          t.transactionContent || "-",
          t.transactionType || "-",
          Number(t.debitAmount || 0),
          Number(t.creditAmount || 0),
          t.transactionDate ? new Date(t.transactionDate) : null,
          t.referenceNo || "-",
        ]);

        // Format number columns
        row.getCell(4).numFmt = "#,##0";
        row.getCell(5).numFmt = "#,##0";

        // Format date column
        if (t.transactionDate) {
          row.getCell(6).numFmt = "dd/mm/yyyy";
        }

        // No alternate row colors - keep it simple
      });

      // Format number columns (use column numbers: 4=Nợ, 5=Có, 6=Ngày)
      worksheet.getColumn(4).numFmt = "#,##0";
      worksheet.getColumn(5).numFmt = "#,##0";
      worksheet.getColumn(6).numFmt = "dd/mm/yyyy";

      // Add summary rows at the bottom (after all data rows)
      // Số dư nợ đầu kỳ
      const openingRow = worksheet.addRow([
        "",
        "",
        "Số dư nợ đầu kỳ:",
        openingBalance,
        0,
        "",
        "",
      ]);
      openingRow.getCell(3).font = { bold: true };
      openingRow.getCell(4).numFmt = "#,##0";
      openingRow.getCell(4).font = { bold: true };
      openingRow.getCell(5).numFmt = "#,##0";

      // Tổng phát sinh trong kỳ
      const movementRow = worksheet.addRow([
        "",
        "",
        "Tổng phát sinh trong kỳ:",
        totalDebitInPeriod,
        totalCreditInPeriod,
        "",
        "",
      ]);
      movementRow.getCell(3).font = { bold: true };
      movementRow.getCell(4).numFmt = "#,##0";
      movementRow.getCell(4).font = { bold: true };
      movementRow.getCell(5).numFmt = "#,##0";
      movementRow.getCell(5).font = { bold: true };

      // Số dư nợ cuối kỳ
      const closingRow = worksheet.addRow([
        "",
        "",
        "Số dư nợ cuối kỳ:",
        closingBalance,
        0,
        "",
        "",
      ]);
      closingRow.getCell(3).font = { bold: true, size: 12 };
      closingRow.getCell(4).numFmt = "#,##0";
      closingRow.getCell(4).font = { bold: true, size: 12 };
      closingRow.getCell(5).numFmt = "#,##0";

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `Chi_tiet_cong_no_${code || "unknown"}_${selectedMonth}_${selectedYear}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      toast.success("Xuất Excel thành công!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Lỗi khi xuất Excel: " + (error.message || "Lỗi không xác định"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết giao dịch công nợ
            </h1>
            <p className="text-sm text-gray-600">
              Mã KH/NCC: {code || "-"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={loading || transactions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Xuất Excel"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Xuất Excel
            </button>
            <button
              onClick={() => navigate("/debt-management")}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Bộ lọc kỳ */}
        <div className="mb-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Kỳ công nợ</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {yearOptions.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tổng hợp 3 ô trên 1 hàng */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Số dư nợ đầu kỳ
            </p>
            <p className="mt-1 text-lg font-semibold text-blue-700">
              {formatCurrency(openingBalance)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Tổng phát sinh trong kỳ
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-700">
              {formatCurrency(periodMovement)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Số dư nợ cuối kỳ
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">
              {formatCurrency(closingBalance)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="text-red-600 text-center mb-4">
                <p className="font-semibold text-lg mb-2">Lỗi khi tải dữ liệu</p>
                <p className="text-sm whitespace-pre-line">{error}</p>
              </div>
              <button
                onClick={() => fetchAllForCode()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("transactionType")}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Loại {getSortIcon("transactionType")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("debitAmount")}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Nợ {getSortIcon("debitAmount")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("creditAmount")}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Có {getSortIcon("creditAmount")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("transactionDate")}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Ngày {getSortIcon("transactionDate")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ref
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Không có giao dịch
                    </td>
                  </tr>
                ) : (
                  transactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div
                          className="truncate"
                          title={t.transactionContent || "-"}
                        >
                          {t.transactionContent || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {t.transactionType || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(t.debitAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(t.creditAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(t.transactionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const getDetailUrl = () => {
                            if (!t.id) return null;
                            switch (t.transactionType) {
                              case "AR_INVOICE":
                                return `/sales/invoices/${t.id}`;
                              case "AP_INVOICE":
                                return `/purchase/ap-invoices/${t.id}`;
                              case "AP_PAYMENT":
                                return `/purchase/ap-payments/${t.id}`;
                              case "AR_PAYMENT":
                                // AR Payment có thể chưa có detail page, để null hoặc link sau
                                return null;
                              default:
                                return null;
                            }
                          };
                          const detailUrl = getDetailUrl();
                          const refNo = t.referenceNo || "-";
                          if (detailUrl) {
                            return (
                              <button
                                onClick={() => navigate(detailUrl)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                                title={`Xem chi tiết ${refNo}`}
                              >
                                {refNo}
                              </button>
                            );
                          }
                          return <span>{refNo}</span>;
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && transactions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalElements={totalElements}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </div>
  );
}

