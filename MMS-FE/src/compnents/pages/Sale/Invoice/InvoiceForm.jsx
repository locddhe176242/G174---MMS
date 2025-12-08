import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { invoiceService } from "../../../../api/invoiceService";
import { deliveryService } from "../../../../api/deliveryService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0)
  );

export default function InvoiceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryId: "",
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    notes: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) {
      loadDeliveries();
    } else {
      loadInvoice();
    }
  }, [id, isEdit]);

  const loadDeliveries = async () => {
    try {
      setDeliveryLoading(true);
      const response = await deliveryService.getAllDeliveries({ status: "Delivered" });
      const list = Array.isArray(response) ? response : response?.content || [];
      setDeliveries(list);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Delivery");
    } finally {
      setDeliveryLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryModalOpen && deliveries.length === 0) {
      loadDeliveries();
    }
  }, [deliveryModalOpen]);

  const filteredDeliveries = useMemo(() => {
    const term = deliverySearch.trim().toLowerCase();
    return deliveries.filter((d) => {
      const matchesKeyword =
        !term ||
        (d.deliveryNo || "").toLowerCase().includes(term) ||
        (d.customerName || "").toLowerCase().includes(term) ||
        (d.salesOrderNo || "").toLowerCase().includes(term);
      return matchesKeyword;
    });
  }, [deliveries, deliverySearch]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(id);
      setFormData({
        deliveryId: data.deliveryId || "",
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        notes: data.notes || "",
      });
      if (data.deliveryId) {
        const delivery = await deliveryService.getDeliveryById(data.deliveryId);
        setSelectedDelivery(delivery);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải hóa đơn");
      navigate("/sales/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySelectFromModal = async (delivery) => {
    setDeliveryModalOpen(false);
    if (!delivery?.deliveryId) return;
    try {
      setLoading(true);
      const fullDelivery = await deliveryService.getDeliveryById(delivery.deliveryId);
      setSelectedDelivery(fullDelivery);
      setFormData((prev) => ({
        ...prev,
        deliveryId: delivery.deliveryId,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin Delivery");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field, date) => {
    handleInputChange(field, date);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.deliveryId) {
      newErrors.deliveryId = "Vui lòng chọn Delivery";
    }
    if (!formData.invoiceDate) {
      newErrors.invoiceDate = "Vui lòng chọn ngày xuất hóa đơn";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        // Update invoice - chỉ cho phép sửa ngày và ghi chú
        const payload = {
          deliveryId: formData.deliveryId,
          invoiceDate: formData.invoiceDate.toISOString().slice(0, 10),
          dueDate: formData.dueDate ? formData.dueDate.toISOString().slice(0, 10) : null,
          notes: formData.notes || null,
        };
        // Invoice gốc không được chỉnh sửa theo nghiệp vụ ERP chuẩn
        // Nếu cần điều chỉnh, phải tạo Credit Note (hóa đơn điều chỉnh) mới
        throw new Error("Hóa đơn gốc không được chỉnh sửa. Vui lòng tạo Credit Note (hóa đơn điều chỉnh) để điều chỉnh hóa đơn này.");
        toast.success("Đã cập nhật hóa đơn");
      } else {
        // Tạo invoice từ delivery
        await invoiceService.createInvoiceFromDelivery(formData.deliveryId);
        toast.success("Đã tạo hóa đơn");
      }
      navigate("/sales/invoices");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể lưu hóa đơn");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? "Cập nhật hóa đơn" : "Tạo hóa đơn mới"}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {isEdit ? "Cập nhật thông tin hóa đơn" : "Tạo hóa đơn từ Delivery đã giao hàng"}
                </p>
              </div>
              <button
                onClick={() => navigate("/sales/invoices")}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Quay lại
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery (Đã giao hàng) <span className="text-red-500">*</span>
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    value={selectedDelivery?.deliveryNo || ""}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedDelivery?.deliveryNo || ""}
                      readOnly
                      placeholder="Chọn Delivery đã giao hàng"
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setDeliveryModalOpen(true)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Chọn
                    </button>
                    {selectedDelivery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDelivery(null);
                          setFormData((prev) => ({ ...prev, deliveryId: "" }));
                        }}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-red-600"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                )}
                {errors.deliveryId && (
                  <p className="text-red-500 text-xs mt-1">{errors.deliveryId}</p>
                )}
                {selectedDelivery && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                    <div>Khách hàng: {selectedDelivery.customerName || "—"}</div>
                    <div>Sales Order: {selectedDelivery.salesOrderNo || "—"}</div>
                    <div>Số sản phẩm: {selectedDelivery.items?.length || 0}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày xuất hóa đơn <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  selected={formData.invoiceDate}
                  onChange={(date) => handleDateChange("invoiceDate", date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.invoiceDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đến hạn thanh toán
                </label>
                <DatePicker
                  selected={formData.dueDate}
                  onChange={(date) => handleDateChange("dueDate", date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Thông tin bổ sung"
              />
            </div>

            {!isEdit && selectedDelivery && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Xem trước: Sản phẩm sẽ được thêm vào hóa đơn
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Sản phẩm</th>
                        <th className="px-4 py-2 text-right">Số lượng đã giao</th>
                        <th className="px-4 py-2 text-left">ĐVT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedDelivery.items
                        ?.filter((item) => Number(item.deliveredQty || 0) > 0)
                        .map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="font-semibold">{item.productName || "—"}</div>
                              <div className="text-xs text-gray-500">{item.productSku || ""}</div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              {Number(item.deliveredQty || 0).toLocaleString("vi-VN")}
                            </td>
                            <td className="px-4 py-2 text-left">{item.uom || "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-sm text-gray-600">
                    * Giá và thuế sẽ được lấy từ Sales Order khi tạo hóa đơn
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/sales/invoices")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo hóa đơn"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <DeliveryPickerModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        deliveries={filteredDeliveries}
        loading={deliveryLoading}
        onSelect={handleDeliverySelectFromModal}
        searchTerm={deliverySearch}
        onSearchChange={setDeliverySearch}
      />
    </div>
  );
}

const DeliveryPickerModal = ({
  isOpen,
  onClose,
  deliveries,
  loading,
  onSelect,
  searchTerm,
  onSearchChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Chọn Delivery</h3>
            <p className="text-sm text-gray-500">Tìm và chọn Delivery đã giao hàng</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-6 border-b">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo số Delivery, khách hàng hoặc Sales Order..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách Delivery...</div>
          ) : deliveries.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có Delivery nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sales Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày giao
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deliveries.map((d) => (
                  <tr
                    key={d.deliveryId}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => onSelect(d)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {d.deliveryNo || `DLV-${d.deliveryId}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{d.customerName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{d.salesOrderNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {d.actualDate
                        ? new Date(d.actualDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

