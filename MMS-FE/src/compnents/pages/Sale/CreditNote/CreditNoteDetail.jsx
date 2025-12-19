import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";
import { creditNoteService } from "../../../../api/creditNoteService";

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
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700";
    case "Issued":
      return "bg-blue-100 text-blue-700";
    case "Applied":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getNextStatus = (currentStatus) => {
  switch (currentStatus) {
    case "Draft":
      return "Issued";
    case "Issued":
      return "Applied";
    default:
      return null;
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
const formatNumber = (value) => (value ? Number(value).toLocaleString("vi-VN") : "0");

export default function CreditNoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [data, setData] = useState(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundForm, setRefundForm] = useState({ amount: "" });

  const fetchCreditNote = async () => {
    setLoading(true);
    try {
      const response = await creditNoteService.getCreditNote(id);
      setData(response);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải Credit Note");
      navigate("/sales/credit-notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (statusLoading) return;
    if (!window.confirm(`Xác nhận chuyển trạng thái sang "${getStatusLabel(newStatus)}"?`)) return;

    setStatusLoading(true);
    try {
      await creditNoteService.changeStatus(id, newStatus);
      toast.success("Đã cập nhật trạng thái");
      fetchCreditNote();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể cập nhật trạng thái");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(refundForm.amount);
    if (!amount || amount < 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (amount > (data.refundAmount || 0)) {
      toast.error("Số tiền đã trả không được vượt quá số tiền phải trả");
      return;
    }

    setRefundLoading(true);
    try {
      await creditNoteService.updateRefundPaidAmount(id, amount);
      toast.success("Đã cập nhật số tiền đã trả lại khách hàng");
      setShowRefundForm(false);
      setRefundForm({ amount: "" });
      fetchCreditNote();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể cập nhật số tiền đã trả");
    } finally {
      setRefundLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const nextStatus = getNextStatus(data.status);
  const canChangeStatus = nextStatus && data.status !== "Cancelled" && data.status !== "Applied";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales/credit-notes")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Quay lại trang trước"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className="text-2xl font-semibold">Credit Note: {data.creditNoteNo}</h1>
            <div className="flex-1"></div>
            <button
              onClick={() => navigate(`/sales/credit-notes/${id}/print`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              In hóa đơn điều chỉnh
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Thông tin Credit Note
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="text-gray-500">Số Credit Note:</span>{" "}
                  <span className="font-semibold">{data.creditNoteNo}</span>
                </li>
                <li>
                  <span className="text-gray-500">Trạng thái:</span>{" "}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(data.status)}`}>
                    {getStatusLabel(data.status)}
                  </span>
                </li>
                <li>
                  <span className="text-gray-500">Invoice:</span>{" "}
                  {data.invoiceNo ? (
                    <button
                      onClick={() => navigate(`/sales/invoices/${data.invoiceId}`)}
                      className="text-blue-600 hover:underline"
                    >
                      {data.invoiceNo}
                    </button>
                  ) : (
                    "—"
                  )}
                </li>
                <li>
                  <span className="text-gray-500">Sales Order:</span> {data.salesOrderNo || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Return Order:</span> {data.returnOrderNo || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Khách hàng:</span> {data.customerName || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Ngày xuất:</span>{" "}
                  {formatDate(data.creditNoteDate)}
                </li>
                {data.reason && (
                  <li>
                    <span className="text-gray-500">Lý do:</span> {data.reason}
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Thông tin kiểm soát
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="text-gray-500">Người tạo:</span> {data.createdByDisplay || data.createdBy || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Ngày tạo:</span>{" "}
                  {formatDateTime(data.createdAt)}
                </li>
                <li>
                  <span className="text-gray-500">Người cập nhật:</span> {data.updatedByDisplay || data.updatedBy || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Ngày cập nhật:</span>{" "}
                  {formatDateTime(data.updatedAt)}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {canChangeStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thay đổi trạng thái</h3>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(data.status)}`}>
                {getStatusLabel(data.status)}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {nextStatus && (
                <button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {statusLoading ? "Đang xử lý..." : `Chuyển sang ${getStatusLabel(nextStatus)}`}
                </button>
              )}
              {data.status !== "Cancelled" && (
                <button
                  onClick={() => handleStatusChange("Cancelled")}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {statusLoading ? "Đang xử lý..." : "Hủy Credit Note"}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ĐVT
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Chiết khấu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thuế (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thuế
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tổng dòng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items?.map((item, index) => (
                  <tr key={item.cniId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-semibold">{item.productName || "—"}</div>
                      <div className="text-xs text-gray-500">{item.productSku || item.productCode || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.uom || "—"}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatNumber(item.quantity || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatCurrency(item.discountAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatNumber(item.taxRate || 0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatCurrency(item.taxAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.lineTotal || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan tiền tệ</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span className="font-semibold">{formatCurrency(data.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Thuế</span>
              <span>{formatCurrency(data.taxAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Tổng cộng</span>
              <span>{formatCurrency(data.totalAmount || 0)}</span>
            </div>
            {(data.appliedToBalance || data.refundAmount) && (
              <>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Số tiền bù trừ vào balance:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(data.appliedToBalance || 0)}
                  </span>
                </div>
                    {data.refundAmount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số tiền phải trả lại khách hàng:</span>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(data.refundAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số tiền đã trả lại khách hàng:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(data.refundPaidAmount || 0)}
                          </span>
                        </div>
                        {data.refundPaidAmount >= data.refundAmount ? (
                          <div className="flex justify-between pt-2 border-t border-green-200">
                            <span className="text-green-600 font-semibold">✓ Đã hoàn tất trả lại</span>
                            <span className="text-green-600 font-semibold">0 ₫</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between pt-2 border-t border-red-200">
                              <span className="text-red-600 font-semibold">Còn phải trả:</span>
                              <span className="text-red-600 font-semibold">
                                {formatCurrency((data.refundAmount || 0) - (data.refundPaidAmount || 0))}
                              </span>
                            </div>
                            {!showRefundForm ? (
                              <div className="pt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowRefundForm(true);
                                    setRefundForm({ amount: String(data.refundPaidAmount || 0) });
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                  Cập nhật số tiền đã trả
                                </button>
                              </div>
                            ) : (
                              <form onSubmit={handleRefundSubmit} className="pt-3 border-t border-gray-200">
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Số tiền đã trả lại khách hàng
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={data.refundAmount}
                                      step="0.01"
                                      value={refundForm.amount}
                                      onChange={(e) => setRefundForm({ amount: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Nhập số tiền đã trả"
                                      required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Tối đa: {formatCurrency(data.refundAmount || 0)}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      disabled={refundLoading}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                                    >
                                      {refundLoading ? "Đang xử lý..." : "Lưu"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowRefundForm(false);
                                        setRefundForm({ amount: "" });
                                      }}
                                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              </form>
                            )}
                          </>
                        )}
                      </>
                    )}
              </>
            )}
          </div>
        </div>

        {data.notes && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ghi chú</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}