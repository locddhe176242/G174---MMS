import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apInvoiceService } from "../../../api/apInvoiceService";
import apiClient from "../../../api/apiClient";

const Stat = ({ label, value }) => (
  <div className="flex-1 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export default function APInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
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

  const getStatusBadge = (status) => {
    const map = {
      Unpaid: { label: "Chưa thanh toán", color: "bg-red-100 text-red-800" },
      "Partially Paid": { label: "Thanh toán một phần", color: "bg-yellow-100 text-yellow-800" },
      Paid: { label: "Đã thanh toán", color: "bg-green-100 text-green-800" },
      Cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-800" },
    };
    const statusInfo = map[status] || { label: status || "Chưa thanh toán", color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const invoiceData = await apInvoiceService.getInvoiceById(id);
        const itemsData = await apInvoiceService.getInvoiceItems(id);

        const resProducts = await apiClient.get("/product", {
          params: { page: 0, size: 1000 }
        });
        const prodData = resProducts.data?.content || resProducts.data || [];

        const resVendors = await apiClient.get("/vendors");
        const vendorData = Array.isArray(resVendors.data) 
          ? resVendors.data 
          : resVendors.data?.content || [];

        if (mounted) {
          setData(invoiceData);
          setItems(Array.isArray(itemsData) ? itemsData : itemsData?.content || []);
          setProducts(prodData);
          setVendors(vendorData);
        }
      } catch (error) {
        console.error("Error loading AP Invoice detail:", error);
        if (mounted) {
          setErr(error?.response?.data?.message || "Không thể tải thông tin Hóa đơn phải trả");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

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
            onClick={() => navigate("/purchase/ap-invoices")}
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

  const subtotal = Number(data.subtotal || data.subtotal || 0);
  const taxAmount = Number(data.tax_amount || data.taxAmount || 0);
  const totalAmount = Number(data.total_amount || data.totalAmount || 0);
  const balanceAmount = Number(data.balance_amount || data.balanceAmount || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/purchase/ap-invoices")}
                className="px-3 py-1.5 rounded border hover:bg-gray-50"
              >
                ← Quay lại
              </button>
              <h1 className="text-2xl font-semibold">
                Hóa đơn phải trả: {data.invoice_no || data.invoiceNo || `#${id}`}
              </h1>
            </div>
            <button
              onClick={() => navigate(`/purchase/ap-invoices/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Stat label="Tổng tiền" value={formatCurrency(totalAmount)} />
                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                <Stat label="Còn nợ" value={formatCurrency(balanceAmount)} />
                <div className="hidden md:block w-px bg-gray-200 self-stretch" />
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-500">Trạng thái</div>
                  <div className="text-xl font-semibold flex justify-center mt-1">
                    {getStatusBadge(data.status)}
                  </div>
                </div>
              </div>
            </div>

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
                          <th className="py-3 pr-4">Mô tả</th>
                          <th className="py-3 pr-4">Số lượng</th>
                          <th className="py-3 pr-4">Đơn giá</th>
                          <th className="py-3 pr-4">Thuế (%)</th>
                          <th className="py-3 pr-4 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.api_id || item.id || index} className="border-t hover:bg-gray-50">
                            <td className="py-3 pr-4">{index + 1}</td>
                            <td className="py-3 pr-4">
                              {item.description || getProductName(item.product_id || item.productId) || "-"}
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
                            <td className="py-3 pr-0 text-right font-medium">
                              {formatCurrency(item.line_total || item.lineTotal || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan={5} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng trước thuế:
                          </td>
                          <td className="py-3 pr-0 text-right">
                            {formatCurrency(subtotal)}
                          </td>
                        </tr>
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan={5} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng thuế:
                          </td>
                          <td className="py-3 pr-0 text-right">
                            {formatCurrency(taxAmount)}
                          </td>
                        </tr>
                        <tr className="border-t-2 font-semibold bg-gray-100">
                          <td colSpan={5} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng cộng:
                          </td>
                          <td className="py-3 pr-0 text-right">
                            {formatCurrency(totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium">Thông tin cơ bản</div>
              <div className="p-6 space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Số hóa đơn: </span>
                  <span className="font-medium">{data.invoice_no || data.invoiceNo || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Nhà cung cấp: </span>
                  <span className="font-medium">
                    {data.vendor?.name || vendors.find(v => (v.vendor_id || v.id) === (data.vendor_id || data.vendorId))?.name || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ngày hóa đơn: </span>
                  <span className="font-medium">
                    {data.invoice_date || data.invoiceDate ? formatDate(data.invoice_date || data.invoiceDate) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ngày đến hạn: </span>
                  <span className="font-medium">
                    {data.due_date || data.dueDate ? formatDate(data.due_date || data.dueDate) : "-"}
                  </span>
                </div>
                {data.order_id || data.orderId ? (
                  <div>
                    <span className="text-gray-500">Đơn hàng: </span>
                    <span className="font-medium">
                      {data.order?.po_no || data.poNo || `#${data.order_id || data.orderId}`}
                    </span>
                  </div>
                ) : null}
                {data.receipt_id || data.receiptId ? (
                  <div>
                    <span className="text-gray-500">Phiếu nhập: </span>
                    <span className="font-medium">
                      {data.receipt?.receipt_no || data.receiptNo || `#${data.receipt_id || data.receiptId}`}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium">Tổng hợp</div>
              <div className="p-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tổng trước thuế:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tổng thuế:</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Tổng cộng:</span>
                  <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Còn nợ:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(balanceAmount)}</span>
                </div>
              </div>
            </div>

            {data.notes && (
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b font-medium">Ghi chú</div>
                <div className="p-6 text-sm whitespace-pre-wrap text-gray-700">
                  {data.notes}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

