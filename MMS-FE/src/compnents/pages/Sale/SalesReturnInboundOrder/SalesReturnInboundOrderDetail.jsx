import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { salesReturnInboundOrderService } from "../../../../api/salesReturnInboundOrderService";

const getStatusLabel = (status) => {
  const statusMap = {
    Draft: "Nháp",
    Approved: "Đã duyệt",
    SentToWarehouse: "Đã gửi kho",
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
    case "SentToWarehouse":
      return "bg-indigo-100 text-indigo-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

export default function SalesReturnInboundOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await salesReturnInboundOrderService.getById(id);
      setData(res);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải Đơn nhập hàng lại");
      navigate("/sales/return-inbound-orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/sales/return-inbound-orders")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
            >
              ← Quay lại
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Đơn nhập hàng lại: {data.sriNo || `SRI-${data.sriId}`}
              </h1>
              <p className="text-gray-500 text-sm">
                Từ Đơn trả hàng:{" "}
                {data.returnNo ? (
                  <button
                    onClick={() =>
                      data.roId && navigate(`/sales/return-orders/${data.roId}`)
                    }
                    className="text-blue-600 hover:underline"
                  >
                    {data.returnNo}
                  </button>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                data.status
              )}`}
            >
              {getStatusLabel(data.status)}
            </span>
            {(data.status === "Draft" || data.status === "SentToWarehouse") && (
              <button
                onClick={() => {
                  console.log("=== Creating Goods Receipt from Sales Return Inbound Order ===", {
                    sriId: data.sriId,
                    sriNo: data.sriNo,
                    status: data.status
                  });
                  if (!data.sriId) {
                    toast.error("Không tìm thấy ID của Đơn nhập hàng lại");
                    return;
                  }
                  navigate(`/purchase/goods-receipts/new?sriId=${data.sriId}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Tạo Phiếu nhập kho
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Thông tin chung
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <span className="text-gray-500">Số Đơn nhập lại:</span>{" "}
                <span className="font-semibold">
                  {data.sriNo || `SRI-${data.sriId}`}
                </span>
              </li>
              <li>
                <span className="text-gray-500">Đơn trả hàng:</span>{" "}
                {data.returnNo || "—"}
              </li>
              <li>
                <span className="text-gray-500">Kho:</span>{" "}
                {data.warehouseName || "—"}
              </li>
              <li>
                <span className="text-gray-500">Ngày dự kiến nhập:</span>{" "}
                {formatDate(data.expectedReceiptDate)}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Kiểm soát
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <span className="text-gray-500">Người tạo:</span>{" "}
                {data.createdByName || "—"}
              </li>
              <li>
                <span className="text-gray-500">Ngày tạo:</span>{" "}
                {formatDateTime(data.createdAt)}
              </li>
              <li>
                <span className="text-gray-500">Người duyệt:</span>{" "}
                {data.approvedByName || "—"}
              </li>
              <li>
                <span className="text-gray-500">Ngày duyệt:</span>{" "}
                {formatDateTime(data.approvedAt)}
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách sản phẩm dự kiến nhập lại
            </h3>
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
                    SL kế hoạch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Đơn vị
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items?.map((item, index) => (
                  <tr key={item.sriiId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-semibold">
                        {item.productName || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.productCode || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.warehouseName || data.warehouseName || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {Number(item.plannedQty || 0).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.uom || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.note || "—"}
                    </td>
                  </tr>
                ))}
                {(!data.items || data.items.length === 0) && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-sm text-gray-500"
                      colSpan={6}
                    >
                      Không có dòng sản phẩm nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {data.notes && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ghi chú
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}


