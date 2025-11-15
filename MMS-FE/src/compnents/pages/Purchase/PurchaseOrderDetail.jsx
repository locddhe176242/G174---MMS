import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { purchaseOrderService } from "../../../api/purchaseOrderService";
import apiClient from "../../../api/apiClient";

const Stat = ({ label, value }) => (
  <div className="flex-1 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
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

  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getProductName = (productId) => {
    if (!productId || !products || products.length === 0) return "-";
    const p = products.find((x) => (x.id || x.product_id) === productId);
    if (p) {
      return `${p.sku || p.productCode || ""} - ${p.name || ""}`;
    }
    return "-";
  };

  const getVendorName = (vendorId) => {
    if (!vendorId || !vendors || vendors.length === 0) return "-";
    const v = vendors.find((x) => (x.vendorId || x.id) === vendorId);
    return v ? v.name : "-";
  };

  const lineValue = (item) => {
    return Number(item?.line_total || item?.lineTotal || 0);
  };

  const totalValue = useMemo(() => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + lineValue(item), 0);
  }, [items]);

  const getStatusBadge = (status) => {
    const map = {
      Pending: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800" },
      Approved: { label: "Đã phê duyệt", color: "bg-green-100 text-green-800" },
      Sent: { label: "Đã gửi", color: "bg-blue-100 text-blue-800" },
      Completed: { label: "Hoàn thành", color: "bg-purple-100 text-purple-800" },
      Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };
    const statusInfo = map[status] || { label: status || "Đang chờ", color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getApprovalStatusBadge = (approvalStatus) => {
    const map = {
      Pending: { label: "Chờ phê duyệt", color: "bg-yellow-100 text-yellow-800" },
      Approved: { label: "Đã phê duyệt", color: "bg-green-100 text-green-800" },
      Rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
    };
    const statusInfo = map[approvalStatus] || { label: approvalStatus || "Chờ phê duyệt", color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
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

        // Fetch Purchase Order detail
        const orderData = await purchaseOrderService.getPurchaseOrderById(id);

        // Fetch items
        const itemsResponse = await apiClient.get(`/purchase-orders/${id}/items`);
        const itemsData = Array.isArray(itemsResponse.data) 
          ? itemsResponse.data 
          : itemsResponse.data?.content || [];

        // Fetch products
        const resProducts = await apiClient.get("/product", {
          params: { page: 0, size: 100 }
        });
        const prodData = resProducts.data?.content || resProducts.data || [];

        // Fetch vendors
        const resVendors = await apiClient.get("/vendors");
        const vendorData = Array.isArray(resVendors.data) 
          ? resVendors.data 
          : resVendors.data?.content || [];

        if (mounted) {
          setData(orderData);
          setItems(itemsData);
          setProducts(prodData);
          setVendors(vendorData);
        }
      } catch (e) {
        console.error("Error loading Purchase Order detail:", e);
        if (mounted) {
          setErr(
            e?.response?.data?.message ||
              e.message ||
              "Không thể tải dữ liệu Đơn hàng mua"
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

  const handleApprove = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn phê duyệt đơn hàng này?")) return;
    
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      await purchaseOrderService.approvePurchaseOrder(id, currentUser.userId || currentUser.user_id);
      toast.success("Đã phê duyệt đơn hàng thành công!");
      // Reload data
      window.location.reload();
    } catch (e) {
      toast.error("Không thể phê duyệt đơn hàng");
      console.error("Error approving order:", e);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Nhập lý do từ chối:");
    if (!reason) return;

    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      await purchaseOrderService.rejectPurchaseOrder(id, currentUser.userId || currentUser.user_id, reason);
      toast.success("Đã từ chối đơn hàng!");
      window.location.reload();
    } catch (e) {
      toast.error("Không thể từ chối đơn hàng");
      console.error("Error rejecting order:", e);
    }
  };

  const handleSend = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn gửi đơn hàng này cho nhà cung cấp?")) return;
    
    try {
      await purchaseOrderService.sendPurchaseOrder(id);
      toast.success("Đã gửi đơn hàng thành công!");
      window.location.reload();
    } catch (e) {
      toast.error("Không thể gửi đơn hàng");
      console.error("Error sending order:", e);
    }
  };

  // Render
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
          <div className="text-red-600 mb-4">Lỗi: {err}</div>
          <button
            onClick={() => navigate("/purchase/orders")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Không có dữ liệu</div>
      </div>
    );
  }

  const totalItems = items.length;
  const totalBeforeTax = Number(data.total_before_tax || data.totalBeforeTax || 0);
  const taxAmount = Number(data.tax_amount || data.taxAmount || 0);
  const totalAfterTax = Number(data.total_after_tax || data.totalAfterTax || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/purchase/orders")}
                className="px-3 py-1.5 rounded border hover:bg-gray-50"
              >
                ← Quay lại
              </button>
              <h1 className="text-2xl font-semibold">
                Đơn hàng mua: {data.po_no || data.poNo || `#${id}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {data.approval_status === "Pending" && (
                <>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Phê duyệt
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Từ chối
                  </button>
                </>
              )}
              {data.approval_status === "Approved" && data.status === "Approved" && (
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gửi đơn hàng
                </button>
              )}
              <button
                onClick={() => navigate(`/purchase/orders/${id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Stat
                  label="Tổng giá trị"
                  value={formatCurrency(totalAfterTax)}
                />
                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                <Stat label="Số sản phẩm" value={totalItems} />
                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-500">Trạng thái</div>
                  <div className="text-xl font-semibold flex justify-center mt-1">
                    {getStatusBadge(data.status)}
                  </div>
                </div>
                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-500">Phê duyệt</div>
                  <div className="text-xl font-semibold flex justify-center mt-1">
                    {getApprovalStatusBadge(data.approval_status || data.approvalStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white border rounded-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="font-medium text-lg">Danh sách sản phẩm</div>
              </div>
              <div className="p-6">
                {items.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">Không có sản phẩm nào</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-3 pr-4">#</th>
                          <th className="py-3 pr-4">Sản phẩm</th>
                          <th className="py-3 pr-4">ĐVT</th>
                          <th className="py-3 pr-4">Số lượng</th>
                          <th className="py-3 pr-4">Đơn giá</th>
                          <th className="py-3 pr-4">Thuế (%)</th>
                          <th className="py-3 pr-4">Tiền thuế</th>
                          <th className="py-3 pr-4 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const itemTotal = lineValue(item);
                          return (
                            <tr key={item.poi_id || item.id || index} className="border-t hover:bg-gray-50">
                              <td className="py-3 pr-4">{index + 1}</td>
                              <td className="py-3 pr-4">
                                {item.productName || item.product_name || getProductName(item.product_id || item.productId)}
                              </td>
                              <td className="py-3 pr-4">
                                {item.uom || "-"}
                              </td>
                              <td className="py-3 pr-4">
                                {Number(item.quantity || 0).toLocaleString()}
                              </td>
                              <td className="py-3 pr-4">
                                {formatCurrency(item.unit_price || item.unitPrice || 0)}
                              </td>
                              <td className="py-3 pr-4">
                                {Number(item.tax_rate || item.taxRate || 0).toFixed(2)}%
                              </td>
                              <td className="py-3 pr-4">
                                {formatCurrency(item.tax_amount || item.taxAmount || 0)}
                              </td>
                              <td className="py-3 pr-0 text-right font-medium">
                                {formatCurrency(itemTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng trước thuế:
                          </td>
                          <td className="py-3 pr-0 text-right">
                            {formatCurrency(totalBeforeTax)}
                          </td>
                        </tr>
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng thuế:
                          </td>
                          <td className="py-3 pr-0 text-right">
                            {formatCurrency(taxAmount)}
                          </td>
                        </tr>
                        <tr className="border-t-2 font-semibold bg-gray-100">
                          <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng cộng:
                          </td>
                          <td className="py-3 pr-0 text-right">
                            {formatCurrency(totalAfterTax)}
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
          <aside className="space-y-6 lg:sticky lg:top-6">
            {/* Status */}
            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium">Trạng thái</div>
              <div className="p-6 text-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Trạng thái hiện tại:</span>
                  {getStatusBadge(data.status)}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Trạng thái phê duyệt:</span>
                  {getApprovalStatusBadge(data.approval_status || data.approvalStatus)}
                </div>
                {data.created_at || data.createdAt ? (
                  <div className="text-xs text-gray-500 mt-2">
                    Ngày tạo: {formatDateTime(data.created_at || data.createdAt)}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium">
                Thông tin cơ bản
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Số đơn hàng: </span>
                  <span className="font-medium">
                    {data.po_no || data.poNo || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Nhà cung cấp: </span>
                  <span className="font-medium">
                    {getVendorName(data.vendor_id || data.vendorId)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ngày đặt hàng: </span>
                  <span className="font-medium">
                    {data.order_date || data.orderDate
                      ? formatDate(data.order_date || data.orderDate)
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ngày giao hàng: </span>
                  <span className="font-medium">
                    {data.delivery_date || data.deliveryDate
                      ? formatDate(data.delivery_date || data.deliveryDate)
                      : "-"}
                  </span>
                </div>
                {data.pq_no || data.pqNo ? (
                  <div>
                    <span className="text-gray-500">Báo giá: </span>
                    <span className="font-medium">
                      {data.pq_no || data.pqNo}
                    </span>
                  </div>
                ) : null}
                {data.payment_terms || data.paymentTerms ? (
                  <div>
                    <span className="text-gray-500">Điều khoản thanh toán: </span>
                    <span className="font-medium">
                      {data.payment_terms || data.paymentTerms}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Shipping Address */}
            {data.shipping_address || data.shippingAddress ? (
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b font-medium">
                  Địa chỉ giao hàng
                </div>
                <div className="p-6 text-sm whitespace-pre-wrap text-gray-700">
                  {data.shipping_address || data.shippingAddress}
                </div>
              </div>
            ) : null}

            {/* Approval Info */}
            {data.approved_at || data.approvedAt ? (
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b font-medium">
                  Thông tin phê duyệt
                </div>
                <div className="p-6 space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Ngày phê duyệt: </span>
                    <span className="font-medium">
                      {formatDateTime(data.approved_at || data.approvedAt)}
                    </span>
                  </div>
                  {data.approverName ? (
                    <div>
                      <span className="text-gray-500">Người phê duyệt: </span>
                      <span className="font-medium">
                        {data.approverName}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

