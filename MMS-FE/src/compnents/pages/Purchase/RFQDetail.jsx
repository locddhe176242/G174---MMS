import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rfqService } from "../../../api/rfqService";
import apiClient from "../../../api/apiClient";

const Stat = ({ label, value }) => (
  <div className="flex-1 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
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
    const price = Number(item?.targetPrice || item?.target_price || 0);
    const qty = Number(item?.quantity || 0);
    return price * qty;
  };

  const totalValue = useMemo(() => {
    if (!data || !Array.isArray(data.items)) return 0;
    return data.items.reduce((sum, item) => sum + lineValue(item), 0);
  }, [data]);

  const getStatusBadge = (status) => {
    // Handle both string and enum object formats
    const statusStr = typeof status === 'string' ? status : (status?.name || status?.toString() || 'Draft');
    
    const map = {
      Draft: { label: "Nháp", color: "bg-gray-100 text-gray-800" },
      Pending: { label: "Chờ phản hồi", color: "bg-yellow-100 text-yellow-800" },
      Sent: { label: "Đã gửi", color: "bg-blue-100 text-blue-800" },
      Closed: { label: "Đã đóng", color: "bg-gray-200 text-gray-800" },
      Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };

    const statusInfo = map[statusStr] || { label: statusStr || "Draft", color: "bg-gray-100 text-gray-800" };
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

        // Fetch RFQ detail
        const rfqData = await rfqService.getRFQById(id);

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
          setData(rfqData);
          setProducts(prodData);
          setVendors(vendorData);
        }
      } catch (e) {
        console.error("Error loading RFQ detail:", e);
        if (mounted) {
          setErr(
            e?.response?.data?.message ||
              e.message ||
              "Không thể tải dữ liệu Yêu cầu báo giá"
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
            onClick={() => navigate("/purchase/rfqs")}
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

  const items = data.items || [];
  const totalItems = items.length;
  const selectedVendorIds = data.selectedVendorIds || 
    (Array.isArray(data.selectedVendors) 
      ? data.selectedVendors.map(v => v.vendorId || v.id)
      : data.selectedVendorId 
        ? [data.selectedVendorId]
        : []);
  
  const selectedVendors = data.selectedVendors || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/purchase/rfqs")}
                className="px-3 py-1.5 rounded border hover:bg-gray-50"
              >
                ← Quay lại
              </button>
              <h1 className="text-2xl font-semibold">
                Yêu cầu báo giá: {data.rfqNo || data.rfq_no || `#${id}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Chỉ hiển thị nút edit khi status là Draft */}
              {(() => {
                const statusStr = typeof data.status === 'string' 
                  ? data.status 
                  : (data.status?.name || data.status?.toString() || 'Draft');
                return statusStr === 'Draft' && (
                  <button
                    onClick={() => navigate(`/purchase/rfqs/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                );
              })()}
              {/* Nút so sánh báo giá - chỉ hiển thị khi RFQ đã có báo giá */}
              <button
                onClick={() => navigate(`/purchase/rfqs/${id}/compare-quotations`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="So sánh báo giá từ các nhà cung cấp"
              >
                So sánh báo giá
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
                  value={formatCurrency(totalValue)}
                />
                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                <Stat label="Số sản phẩm" value={totalItems} />
                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                <Stat label="Số nhà cung cấp" value={selectedVendorIds.length} />
                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-500">Trạng thái</div>
                  <div className="text-xl font-semibold flex justify-center mt-1">
                    {getStatusBadge(data.status)}
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
                          <th className="py-3 pr-4">Số lượng</th>
                          <th className="py-3 pr-4">Ngày cần</th>
                          <th className="py-3 pr-4">Giá mục tiêu</th>
                          <th className="py-3 pr-4 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const itemTotal = lineValue(item);
                          return (
                            <tr key={item.rfq_item_id || item.id || index} className="border-t hover:bg-gray-50">
                              <td className="py-3 pr-4">{index + 1}</td>
                              <td className="py-3 pr-4">
                                {item.productName || item.product_name || getProductName(item.productId || item.product_id)}
                              </td>
                              <td className="py-3 pr-4">
                                {Number(item.quantity || 0).toLocaleString()}
                              </td>
                              <td className="py-3 pr-4">
                                {item.deliveryDate || item.delivery_date
                                  ? formatDate(item.deliveryDate || item.delivery_date)
                                  : "-"}
                              </td>
                              <td className="py-3 pr-4">
                                {formatCurrency(item.targetPrice || item.target_price || 0)}
                              </td>
                              <td className="py-3 pr-0 text-right font-medium">
                                {formatCurrency(itemTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-semibold bg-gray-50">
                          <td
                            colSpan={5}
                            className="py-3 pr-4 text-right whitespace-nowrap"
                          >
                            Tổng cộng:
                          </td>
                          <td className="py-3 pr-0 text-right">
                            {formatCurrency(totalValue)}
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
                  <span className="text-gray-500">Số YC báo giá: </span>
                  <span className="font-medium">
                    {data.rfqNo || data.rfq_no || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ngày phát hành: </span>
                  <span className="font-medium">
                    {data.issueDate || data.issue_date
                      ? formatDate(data.issueDate || data.issue_date)
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Hạn phản hồi: </span>
                  <span className="font-medium">
                    {data.dueDate || data.due_date
                      ? formatDate(data.dueDate || data.due_date)
                      : "-"}
                  </span>
                </div>
                {data.created_at || data.createdAt ? (
                  <div>
                    <span className="text-gray-500">Ngày tạo: </span>
                    <span className="font-medium">
                      {formatDateTime(data.created_at || data.createdAt)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Vendors */}
            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium">
                Nhà cung cấp
              </div>
              <div className="p-6">
                {selectedVendors.length === 0 && selectedVendorIds.length === 0 ? (
                  <div className="text-sm text-gray-500">Chưa chọn nhà cung cấp</div>
                ) : (
                  <div className="space-y-3">
                    {selectedVendors.length > 0
                      ? selectedVendors.map((vendor, index) => (
                          <div key={vendor.vendorId || vendor.id || index} className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-gray-500">{index + 1}. </span>
                              <span className="font-medium">
                                {vendor.vendorName || vendor.name || getVendorName(vendor.vendorId || vendor.id)}
                              </span>
                            </div>
                            <button
                              onClick={() => navigate(`/purchase/purchase-quotations/new?rfq_id=${id}&vendor_id=${vendor.vendorId || vendor.id}`)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="Tạo báo giá cho nhà cung cấp này"
                            >
                              Tạo báo giá
                            </button>
                          </div>
                        ))
                      : selectedVendorIds.map((vendorId, index) => (
                          <div key={vendorId || index} className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-gray-500">{index + 1}. </span>
                              <span className="font-medium">
                                {getVendorName(vendorId)}
                              </span>
                            </div>
                            <button
                              onClick={() => navigate(`/purchase/purchase-quotations/new?rfq_id=${id}&vendor_id=${vendorId}`)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="Tạo báo giá cho nhà cung cấp này"
                            >
                              Tạo báo giá
                            </button>
                          </div>
                        ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {(data.notes || data.note) && (
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b font-medium">
                  Ghi chú
                </div>
                <div className="p-6 text-sm whitespace-pre-wrap text-gray-700">
                  {data.notes || data.note}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

