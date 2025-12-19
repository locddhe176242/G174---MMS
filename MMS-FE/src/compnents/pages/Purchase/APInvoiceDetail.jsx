import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";
import { apInvoiceService } from "../../../api/apInvoiceService";
import { apPaymentService } from "../../../api/apPaymentService";
import apiClient from "../../../api/apiClient";
import APInvoiceAttachments from "./APInvoiceAttachments";

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

        console.log("APInvoiceDetail - ID from params:", id);
        
        if (!id || id === 'undefined') {
          throw new Error("Invoice ID is missing or invalid");
        }

        const invoiceData = await apInvoiceService.getInvoiceById(id);
        const itemsData = invoiceData.items || [];
        
        console.log("Invoice data:", invoiceData);
        console.log("Header discount:", invoiceData.header_discount, invoiceData.headerDiscount);
        console.log("Items:", itemsData);

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
          setItems(Array.isArray(itemsData) ? itemsData : []);
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

  // Use backend values instead of recalculating
  // This ensures consistency with invoice list and preserves historical data
  const subtotal = Number(data.subtotal || 0);
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
                title="Quay lại trang trước"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <h1 className="text-2xl font-semibold">
                Hóa đơn phải trả: {data.invoice_no || data.invoiceNo || `#${id}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {(data.status === "Unpaid" || data.status === "Chưa thanh toán") && balanceAmount === totalAmount && id ? (
                <button
                  onClick={() => navigate(`/purchase/ap-invoices/${id}/edit`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  title={!id ? "ID không hợp lệ" : "Không thể chỉnh sửa hóa đơn đã thanh toán hoặc đã có payment"}
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
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
                          <th className="py-3 pr-4">Sản phẩm</th>
                          <th className="py-3 pr-4 text-right">SL yêu cầu</th>
                          <th className="py-3 pr-4 text-right">Đơn giá/Sản phẩm(VND)</th>
                          <th className="py-3 pr-4 text-center">Chiết Khấu (%)</th>
                          <th className="py-3 pr-4 text-center">Thuế (%)</th>
                          <th className="py-3 pr-4">Ghi chú</th>
                          <th className="py-3 pr-4 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.api_id || item.id || index} className="border-t hover:bg-gray-50">
                            <td className="py-3 pr-4">{index + 1}</td>
                            <td className="py-3 pr-4">
                              <div className="font-medium">
                                {item.product_name || item.productName || item.description || "-"}
                              </div>
                              <div className="text-xs text-gray-500">
                                SKU: {item.product_sku || item.productSku || "-"}
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              {Number(item.quantity || 0).toLocaleString()}
                            </td>
                            <td className="py-3 pr-4 text-right">
                              {formatCurrency(item.unit_price || item.unitPrice || 0)}
                            </td>
                            <td className="py-3 pr-4 text-center">
                              <span className={item.discount_percent || item.discountPercent ? "text-green-600 font-medium" : ""}>
                                {Number(item.discount_percent || item.discountPercent || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-center">
                              {Number(item.tax_rate || item.taxRate || 0).toFixed(2)}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="text-sm text-gray-600">
                                {item.remark || item.notes || "-"}
                              </span>
                            </td>
                            <td className="py-3 pr-0 text-right font-medium">
                              {formatCurrency(Number(item.quantity || 0) * Number(item.unit_price || item.unitPrice || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tạm tính:
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {formatCurrency(subtotal)}
                          </td>
                        </tr>
                        {(() => {
                          const round = (v) => Math.round(v * 100) / 100;
                          const totalLineDiscount = items.reduce((sum, item) => {
                            const itemSubtotal = round((item.quantity || 0) * (item.unit_price || item.unitPrice || 0));
                            const discountPercent = item.discount_percent || item.discountPercent || 0;
                            const discountAmount = round(itemSubtotal * (discountPercent / 100));
                            return sum + discountAmount;
                          }, 0);
                          return totalLineDiscount > 0 && (
                            <tr className="border-t font-semibold bg-gray-50">
                              <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                                Chiết khấu sản phẩm:
                              </td>
                              <td className="py-3 pr-4 text-right text-red-600">
                                {formatCurrency(totalLineDiscount)}
                              </td>
                            </tr>
                          );
                        })()}
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng sau chiết khấu sản phẩm:
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {(() => {
                              const round = (v) => Math.round(v * 100) / 100;
                              const totalAfterLineDiscount = items.reduce((sum, item) => {
                                const itemSubtotal = round((item.quantity || 0) * (item.unit_price || item.unitPrice || 0));
                                const discountPercent = item.discount_percent || item.discountPercent || 0;
                                const discountAmount = round(itemSubtotal * (discountPercent / 100));
                                return sum + round(itemSubtotal - discountAmount);
                              }, 0);
                              return formatCurrency(totalAfterLineDiscount);
                            })()}
                          </td>
                        </tr>
                        {(() => {
                          const round = (v) => Math.round(v * 100) / 100;
                          const headerDiscount = Number(data.header_discount || data.headerDiscount || 0);
                          const totalAfterLineDiscount = items.reduce((sum, item) => {
                            const itemSubtotal = round((item.quantity || 0) * (item.unit_price || item.unitPrice || 0));
                            const discountPercent = item.discount_percent || item.discountPercent || 0;
                            const discountAmount = round(itemSubtotal * (discountPercent / 100));
                            return sum + round(itemSubtotal - discountAmount);
                          }, 0);
                          
                          if (headerDiscount > 0) {
                            return (
                              <>
                                <tr className="border-t font-semibold bg-gray-50">
                                  <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                                    Chiết khấu tổng đơn ({headerDiscount}%):
                                  </td>
                                  <td className="py-3 pr-4 text-right text-red-600">
                                    {formatCurrency(round(totalAfterLineDiscount * (headerDiscount / 100)))}
                                  </td>
                                </tr>
                                <tr className="border-t font-semibold bg-gray-50">
                                  <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                                    Tiền sau khi chiết khấu tổng đơn:
                                  </td>
                                  <td className="py-3 pr-4 text-right">
                                    {formatCurrency(round(totalAfterLineDiscount * (1 - headerDiscount / 100)))}
                                  </td>
                                </tr>
                              </>
                            );
                          }
                          return null;
                        })()}
                        <tr className="border-t font-semibold bg-gray-50">
                          <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                            Thuế:
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {formatCurrency(taxAmount)}
                          </td>
                        </tr>
                        <tr className="border-t-2 font-bold bg-blue-50 text-blue-900">
                          <td colSpan={7} className="py-3 pr-4 text-right whitespace-nowrap">
                            Tổng cộng:
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {formatCurrency(totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* File đính kèm section */}
            <div className="bg-white border rounded-lg">
              <div className="p-6">
                <APInvoiceAttachments 
                  invoiceId={id} 
                  readonly={data.status === "Cancelled"}
                />
              </div>
            </div>
          </div>

          <aside className="xl:col-span-4 space-y-6">
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
                    {data.vendorName || data.vendor_name || data.vendor?.name || "-"}
                  </span>
                </div>
                {(data.vendorCode || data.vendor_code) && (
                  <div>
                    <span className="text-gray-500">Mã NCC: </span>
                    <span className="font-medium">
                      {data.vendorCode || data.vendor_code}
                    </span>
                  </div>
                )}
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

            {data.notes && (
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b font-medium">Ghi chú</div>
                <div className="p-6 text-sm whitespace-pre-wrap text-gray-700">
                  {data.notes}
                </div>
              </div>
            )}

            {/* Payment Section */}
            <div className="bg-white border rounded-lg">
              <div className="px-6 py-4 border-b font-medium flex justify-between items-center">
                <span>Lịch sử thanh toán</span>
                {data.status !== "Paid" && data.status !== "Cancelled" && balanceAmount > 0 && (
                  <button
                    onClick={() => navigate(`/purchase/ap-invoices/${id}/add-payment`)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    + Thêm thanh toán
                  </button>
                )}
              </div>
              <div className="p-6">
                {!data.payments || data.payments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Chưa có thanh toán nào
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.payments.map((payment, idx) => (
                      <div key={payment.apPaymentId || idx} className="flex justify-between items-start p-3 bg-gray-50 rounded border text-sm">
                        <div>
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            {payment.method || "Chuyển khoản"} - {formatDate(payment.paymentDate)}
                          </div>
                          {payment.referenceNo && (
                            <div className="text-gray-500 text-xs">Ref: {payment.referenceNo}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}