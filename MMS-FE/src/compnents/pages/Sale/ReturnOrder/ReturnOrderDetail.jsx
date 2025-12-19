import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";
import { returnOrderService } from "../../../../api/returnOrderService";

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Approved: "Đã duyệt",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700";
    case "Approved":
      return "bg-blue-100 text-blue-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getNextStatus = (currentStatus) => {
  switch (currentStatus) {
    case "Approved":
      return "Completed";
    default:
      return null;
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");
const formatNumber = (value) => (value ? Number(value).toLocaleString("vi-VN") : "0");

export default function ReturnOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchReturnOrder = async () => {
    setLoading(true);
    try {
      const response = await returnOrderService.getReturnOrder(id);
      setData(response);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải đơn trả hàng");
      navigate("/sales/return-orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (statusLoading) return;
    if (!window.confirm(`Xác nhận chuyển trạng thái sang "${getStatusLabel(newStatus)}"?`)) return;

    setStatusLoading(true);
    try {
      await returnOrderService.changeStatus(id, newStatus);
      toast.success("Đã cập nhật trạng thái");
      fetchReturnOrder();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể cập nhật trạng thái");
    } finally {
      setStatusLoading(false);
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
  const canChangeStatus =
    nextStatus && data.status !== "Cancelled" && data.status !== "Completed";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales/return-orders")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Quay lại trang trước"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">
                Đơn trả hàng: {data.returnNo}
              </h1>
              <p className="text-gray-500">
                Phiếu giao hàng: {data.deliveryNo || "—"} | Khách hàng: {data.customerName || "—"}
              </p>
            </div>
            <div className="flex-1"></div>
            {data.status === "Draft" && (
              <button
                onClick={() => navigate(`/sales/return-orders/${id}/edit`)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Sửa
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Thông tin đơn trả hàng
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="text-gray-500">Số đơn:</span>{" "}
                  <span className="font-semibold">{data.returnNo}</span>
                </li>
                <li>
                  <span className="text-gray-500">Trạng thái:</span>{" "}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(data.status)}`}>
                    {getStatusLabel(data.status)}
                  </span>
                </li>
                <li>
                  <span className="text-gray-500">Phiếu giao hàng:</span> {data.deliveryNo || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Đơn bán hàng:</span> {data.salesOrderNo || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Hóa đơn:</span> {data.invoiceNo || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Khách hàng:</span> {data.customerName || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Kho:</span> {data.warehouseName || "—"}
                </li>
                <li>
                  <span className="text-gray-500">Ngày trả hàng:</span>{" "}
                  {formatDate(data.returnDate)}
                </li>
                {data.reason && (
                  <li>
                    <span className="text-gray-500">Lý do:</span> {data.reason}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {canChangeStatus && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Thay đổi trạng thái</h3>
              <p className="text-sm text-gray-500">
                Khi đã nhập lại hàng về kho xong thì bấm “Hoàn thành”. Nếu đơn không còn hiệu lực thì bấm “Hủy”.
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                data.status
              )}`}
            >
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
                {statusLoading ? "Đang xử lý..." : "Hủy đơn trả hàng"}
              </button>
            )}
          </div>
        </div>
        )}


        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm trả lại</h3>
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
                    Kho
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Số lượng trả lại
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Đơn vị
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lý do
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items?.map((item, index) => (
                  <tr key={item.roiId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-semibold">{item.productName || "—"}</div>
                      <div className="text-xs text-gray-500">{item.productSku || item.productCode || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.warehouseName || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatNumber(item.returnedQty || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.uom || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.reason || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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