import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Stat = ({ label, value }) => (
  <div className="flex-1 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export default function PurchaseRequisitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Helpers
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return d.toLocaleString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const getProductName = (productId) => {
    if (!productId || !products || products.length === 0) return "-";
    const p = products.find((x) => x.product_id === productId);
    return p ? `${p.sku} - ${p.name}` : "-";
  };

  const lineValue = (item) => {
    const price = Number(item?.valuation_price || 0);
    const qty = Number(item?.requested_qty || 0);
    const unit = Number(item?.price_unit || 1);
    return price * qty * unit;
  };

  const totalValue = useMemo(() => {
    if (!data || !Array.isArray(data.items)) return 0;
    return data.items.reduce((sum, item) => sum + lineValue(item), 0);
  }, [data]);

  const getStatusBadge = (status) => {
    const map = {
      Draft: "bg-gray-100 text-gray-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      Cancelled: "bg-gray-100 text-gray-800",
      Open: "bg-blue-100 text-blue-800",
      Closed: "bg-gray-200 text-gray-800",
    };

    const color = map[status] || "bg-gray-100 text-gray-800";
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        {status || "Draft"}
      </span>
    );
  };

  // Fetch data from backend
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Fetch detail
        const resDetail = await fetch(`/api/purchase-requisitions/${id}`);
        if (!resDetail.ok) throw new Error(`HTTP ${resDetail.status}`);
        const detailData = await resDetail.json();

        // Fetch products
        const resProducts = await fetch("/api/products");
        if (!resProducts.ok) throw new Error(`HTTP ${resProducts.status}`);
        const prodData = await resProducts.json();

        if (mounted) {
          setData(detailData);
          setProducts(prodData);
        }
      } catch (e) {
        if (mounted) {
          setErr(
            e?.response?.data?.message ||
              e.message ||
              "Không thể tải dữ liệu phiếu yêu cầu"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Render
  if (loading) return <div className="p-6">Đang tải...</div>;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Không có dữ liệu</div>;

  const items = data.items || [];
  const totalItems = items.length;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 rounded border hover:bg-gray-50"
        >
          ←
        </button>
        <h1 className="text-2xl font-semibold">
          Phiếu yêu cầu: {data.requisition_no || `#${id}`}
        </h1>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT CONTENT */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="border rounded p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Stat
                label="Tổng giá trị"
                value={`${Number(totalValue).toLocaleString()} đ`}
              />
              <div className="hidden md:block w-px bg-gray-200 self-stretch" />
              <Stat label="Số sản phẩm" value={totalItems} />
              <div className="hidden md:block w-px bg-gray-200 self-stretch" />
              <div className="flex-1 text-center">
                <div className="text-sm text-gray-500">Trạng thái</div>
                <div className="text-xl font-semibold flex justify-center">
                  {getStatusBadge(data.status || data.approval_status)}
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border rounded">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-medium">Danh sách sản phẩm</div>
              <button
                onClick={() => navigate(`/purchase-requisitions/${id}/edit`)}
                className="text-blue-600 hover:underline text-sm"
              >
                Chỉnh sửa
              </button>
            </div>
            <div className="p-4">
              {items.length === 0 ? (
                <div className="text-gray-500">Không có sản phẩm nào</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">Sản phẩm</th>
                        <th className="py-2 pr-4">Số lượng</th>
                        <th className="py-2 pr-4">Ngày giao hàng</th>
                        <th className="py-2 pr-4">Đơn giá</th>
                        <th className="py-2 pr-4">Hệ số</th>
                        <th className="py-2 pr-4 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const itemTotal = lineValue(item);
                        return (
                          <tr key={item.pri_id || index} className="border-t">
                            <td className="py-2 pr-4">{index + 1}</td>
                            <td className="py-2 pr-4">
                              {getProductName(item.product_id)}
                            </td>
                            <td className="py-2 pr-4">
                              {Number(
                                item.requested_qty || 0
                              ).toLocaleString()}
                            </td>
                            <td className="py-2 pr-4">
                              {item.delivery_date
                                ? formatDate(item.delivery_date)
                                : "-"}
                            </td>
                            <td className="py-2 pr-4">
                              {Number(
                                item.valuation_price || 0
                              ).toLocaleString()}{" "}
                              đ
                            </td>
                            <td className="py-2 pr-4">
                              {Number(item.price_unit || 1).toLocaleString()}
                            </td>
                            <td className="py-2 pr-0 text-right">
                              {Number(itemTotal).toLocaleString()} đ
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-semibold">
                        <td
                          colSpan={6}
                          className="py-2 pr-4 text-right whitespace-nowrap"
                        >
                          Tổng cộng:
                        </td>
                        <td className="py-2 pr-0 text-right">
                          {Number(totalValue).toLocaleString()} đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          {/* Status */}
          <div className="border rounded">
            <div className="px-4 py-3 border-b font-medium">Trạng thái</div>
            <div className="p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Trạng thái hiện tại:</span>
                {getStatusBadge(data.status || data.approval_status)}
              </div>
              {data.approved_at && (
                <div className="text-xs text-gray-500 mt-2">
                  Đã duyệt: {formatDateTime(data.approved_at)}
                </div>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="border rounded">
            <div className="px-4 py-3 border-b font-medium">
              Thông tin cơ bản
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Mã phiếu: </span>
                <span className="font-medium">
                  {data.requisition_no || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Người yêu cầu: </span>
                <span className="font-medium">
                  {data.requester_name ||
                    data.requester_id ||
                    "Chưa gán người yêu cầu"}
                </span>
              </div>
              {data.approver_id && (
                <div>
                  <span className="text-gray-500">Người duyệt: </span>
                  <span className="font-medium">
                    {data.approver_name || data.approver_id}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Ngày tạo: </span>
                <span className="font-medium">
                  {formatDateTime(data.created_at || data.createdAt)}
                </span>
              </div>
              {data.approved_at && (
                <div>
                  <span className="text-gray-500">Ngày duyệt: </span>
                  <span className="font-medium">
                    {formatDateTime(data.approved_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Purpose */}
          <div className="border rounded">
            <div className="px-4 py-3 border-b font-medium">
              Mục đích sử dụng
            </div>
            <div className="p-4 text-sm whitespace-pre-wrap">
              {data.purpose ? (
                data.purpose
              ) : (
                <span className="text-gray-500">Không có mục đích</span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
