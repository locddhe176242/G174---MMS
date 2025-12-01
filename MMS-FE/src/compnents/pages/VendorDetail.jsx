import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { vendorService } from "../../api/vendorService";
import { translatePOStatus, translateApprovalStatus, getStatusColor } from "../../utils/translations";

const Stat = ({ label, value }) => (
  <div className="flex-1 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [balance, setBalance] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [detail, balanceData, docsData, ordersData] = await Promise.all([
          vendorService.getVendorById(id),
          vendorService.getVendorBalance(id),
          vendorService.getVendorDocuments(id),
          vendorService.getPurchaseOrdersByVendor(id)
        ]);
        if (mounted) {
          console.log("Vendor Detail Data:", detail);
          console.log("Balance Data:", balanceData);
          console.log("Documents Data:", docsData);
          console.log("Orders Data:", ordersData);
          setData(detail);
          setBalance(balanceData);
          setDocuments(docsData);
          // Get latest 5 orders
          setRecentOrders((ordersData || []).slice(0, 5));
        }
      } catch (e) {
        console.error("Error loading vendor detail:", e);
        setErr(e?.response?.data?.message || e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const vendorName = useMemo(() => {
    if (!data) return "";
    return data.name || "";
  }, [data]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Không có dữ liệu</div>;

  const { contact, address } = data;

  // Calculate totals from balance data
  const totalSpend = balance?.totalInvoiced ?? 0;
  const totalOrders = documents?.purchaseOrdersCount ?? 0;
  const avgSpend = totalOrders > 0 ? (Number(totalSpend) / Number(totalOrders)) : 0;

  // Format address
  const formatAddress = (address) => {
    if (!address) return "Chưa có địa chỉ";
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.wardName) parts.push(address.wardName);
    if (address.districtName) parts.push(address.districtName);
    if (address.provinceName) parts.push(address.provinceName);
    if (address.country) parts.push(address.country);
    
    return parts.join(", ");
  };

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
          {vendorName || `Nhà cung cấp #${data.vendorId}`}
        </h1>
      </div>

      {/* Balance Card */}
      {balance && (
        <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg font-semibold mb-4">Tổng quan công nợ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600">Tổng hóa đơn phải trả</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {Number(balance.totalInvoiced || 0).toLocaleString()} ₫
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600">Đã thanh toán</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {Number(balance.totalPaid || 0).toLocaleString()} ₫
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600">Còn phải trả</div>
              <div className={`text-2xl font-bold mt-1 ${
                Number(balance.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {Number(balance.outstandingBalance || 0).toLocaleString()} ₫
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2-column layout: left (content) - right (sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: summary + recent orders */}
        <div className="lg:col-span-2 space-y-4">
          {/* Purchase Documents */}
          {documents && (
            <div className="border rounded p-4">
              <h3 className="font-medium mb-3">Tài liệu mua hàng</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{documents.quotationsCount || 0}</div>
                  <div className="text-xs text-gray-600">Báo giá</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{documents.purchaseOrdersCount || 0}</div>
                  <div className="text-xs text-gray-600">Đơn đặt hàng</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{documents.invoicesCount || 0}</div>
                  <div className="text-xs text-gray-600">Hóa đơn</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{documents.recentPayments?.length || 0}</div>
                  <div className="text-xs text-gray-600">Thanh toán gần đây</div>
                </div>
              </div>
            </div>
          )}

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
                onClick={() => navigate("/purchase/purchase-orders")}
                className="text-blue-600 hover:underline text-sm"
              >
                Danh sách đơn hàng
              </button>
            </div>
            <div className="p-4">
              {!recentOrders || recentOrders.length === 0 ? (
                <div className="text-gray-500 text-center py-4">Không có đơn hàng gần đây</div>
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
                        <tr key={o.poId || o.orderId} className="border-t hover:bg-gray-50">
                          <td className="py-2 pr-4">
                            <button
                              onClick={() => navigate(`/purchase/purchase-orders/${o.poId || o.orderId}`)}
                              className="text-blue-600 hover:underline"
                            >
                              {o.poNo}
                            </button>
                          </td>
                          <td className="py-2 pr-4">
                            {o.orderDate ? new Date(o.orderDate).toLocaleDateString('vi-VN') : "-"}
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(o.status)}`}>
                              {translatePOStatus(o.status)}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(o.approvalStatus)}`}>
                              {translateApprovalStatus(o.approvalStatus)}
                            </span>
                          </td>
                          <td className="py-2 pr-0 text-right font-medium">
                            {Number(o.totalAfterTax || 0).toLocaleString('vi-VN')} ₫
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
              {vendorName && <div className="font-medium">{vendorName}</div>}
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
              {contact?.website && (
                <div>
                  <span className="text-gray-500">Website: </span>
                  <a className="text-blue-600 hover:underline" href={contact.website} target="_blank" rel="noopener noreferrer">
                    {contact.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="border rounded">
            <div className="px-4 py-3 border-b font-medium">Địa chỉ</div>
            <div className="p-4 text-sm space-y-1">
              <div>{formatAddress(address)}</div>
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
  );
}