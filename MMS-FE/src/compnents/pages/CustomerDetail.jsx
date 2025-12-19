import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomerDetail } from "../../api/customerService";
import PermissionGuard from "../PermissionGuard";

const Stat = ({ label, value }) => (
  <div className="flex-1 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const detail = await getCustomerDetail(id);
        if (mounted) setData(detail);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const fullName = useMemo(() => {
    if (!data) return "";
    const f = data.firstName || "";
    const l = data.lastName || "";
    return `${f} ${l}`.trim();
  }, [data]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Không có dữ liệu</div>;

  const { contact, address, transactionSummary, recentOrders } = data;

  const totalSpend = transactionSummary?.totalInvoiceAmount ?? 0;
  const totalOrders = transactionSummary?.totalOrders ?? 0;
  const avgSpend = totalOrders ? (Number(totalSpend) / Number(totalOrders)) : 0;

  return (
    <PermissionGuard 
      anyOf={['customer.view']} 
      fallback={
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Bạn không có quyền xem chi tiết khách hàng.</p>
          </div>
        </div>
      }
    >
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
          {fullName || `Khách hàng #${data.customerId}`}
        </h1>
      </div>

      {/* 2-column layout: left (content) - right (sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: summary + recent orders */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary row */}
          <div className="border rounded p-4">
            <div className="flex items-center gap-4">
              <Stat label="Tổng chi tiêu" value={`${Number(totalSpend).toLocaleString()}đ`} />
              <div className="w-px bg-gray-200 self-stretch" />
              <Stat label="Chi tiêu trung bình" value={`${Number(avgSpend).toLocaleString()}đ`} />
              <div className="w-px bg-gray-200 self-stretch" />
              <Stat label="Số đơn hàng" value={Number(totalOrders).toLocaleString()} />
            </div>
          </div>

          {/* Recent orders */}
          <div className="border rounded">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-medium">Đơn hàng gần đây</div>
              <button
                onClick={() => navigate("/customers")}
                className="text-blue-600 hover:underline text-sm"
              >
                Danh sách đơn hàng
              </button>
            </div>
            <div className="p-4">
              {!recentOrders || recentOrders.length === 0 ? (
                <div className="text-gray-500">Không có đơn hàng gần đây</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-4">Mã đơn</th>
                        <th className="py-2 pr-4">Ngày</th>
                        <th className="py-2 pr-4">Trạng thái</th>
                        <th className="py-2 pr-4">Duyệt</th>
                        <th className="py-2 pr-4 text-right">Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o.soId} className="border-t">
                          <td className="py-2 pr-4">{o.soNo}</td>
                          <td className="py-2 pr-4">
                            {o.orderDateFormatted ||
                              (o.orderDate ? new Date(o.orderDate).toLocaleString() : "-")}
                          </td>
                          <td className="py-2 pr-4">{o.status}</td>
                          <td className="py-2 pr-4">{o.approvalStatus}</td>
                          <td className="py-2 pr-0 text-right">
                            {Number(o.totalAmount || 0).toLocaleString()}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: sidebar (contact, address, notes) */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          {/* Contact */}
          <div className="border rounded">
            <div className="px-4 py-3 border-b font-medium">Liên hệ</div>
            <div className="p-4 space-y-1 text-sm">
              {fullName && <div className="font-medium">{fullName}</div>}
              {contact?.email && (
                <div>
                  <span className="text-gray-500">Email: </span>
                  <a className="text-blue-600 hover:underline" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                </div>
              )}
              {contact?.phone && (
                <div>
                  <span className="text-gray-500">Điện thoại: </span>
                  <a className="text-blue-600 hover:underline" href={`tel:${contact.phone}`}>
                    {contact.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="border rounded">
            <div className="px-4 py-3 border-b font-medium">Sổ địa chỉ</div>
            <div className="p-4 text-sm space-y-1">
              {address ? (
                <>
                  {address.street && <div>{address.street}</div>}
                  {(address.city || address.country) && (
                    <div>{[address.city, address.country].filter(Boolean).join(", ")}</div>
                  )}
                </>
              ) : (
                <div className="text-gray-500">Chưa có địa chỉ</div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="border rounded">
            <div className="px-4 py-3 border-b font-medium">Ghi chú</div>
            <div className="p-4">
              <div className="text-sm whitespace-pre-wrap">
                {data.note || <span className="text-gray-500">Không có ghi chú</span>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
    </PermissionGuard>
  );
}
