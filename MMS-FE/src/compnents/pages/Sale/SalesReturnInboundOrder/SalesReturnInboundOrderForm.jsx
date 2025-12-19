import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

import { salesReturnInboundOrderService } from "../../../../api/salesReturnInboundOrderService";
import { returnOrderService } from "../../../../api/returnOrderService";
import { warehouseService } from "../../../../api/warehouseService";
import useAuthStore from "../../../../store/authStore";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";
const formatNumber = (value) =>
  value ? Number(value).toLocaleString("vi-VN") : "0";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: "none",
    minHeight: "40px",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
};

export default function SalesReturnInboundOrderForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { roles } = useAuthStore();
  
  // Check if user is MANAGER or SALE
  const canEdit = roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name;
    return roleName === 'MANAGER' || roleName === 'ROLE_MANAGER' || 
           roleName === 'SALE' || roleName === 'ROLE_SALE';
  }) || false;
  
  // Redirect users without permission
  useEffect(() => {
    if (!canEdit) {
      toast.error('Bạn không có quyền truy cập trang này!');
      navigate('/sales/return-inbound-orders');
    }
  }, [canEdit, navigate]);

  const searchParams = new URLSearchParams(location.search);
  const preselectedRoId = searchParams.get("roId");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [returnOrders, setReturnOrders] = useState([]);
  const [returnOrderLoading, setReturnOrderLoading] = useState(false);
  const [returnOrderSearch, setReturnOrderSearch] = useState("");
  const [returnOrderModalOpen, setReturnOrderModalOpen] = useState(false);

  const [warehouses, setWarehouses] = useState([]);

  const [formData, setFormData] = useState({
    roId: preselectedRoId ? Number(preselectedRoId) : null,
    warehouseId: null,
    expectedReceiptDate: new Date(),
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [selectedReturnOrderDetail, setSelectedReturnOrderDetail] = useState(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      loadReturnOrders();
    }
  }, [isEdit]);

  const loadWarehouses = async () => {
    try {
      const res = await warehouseService.getAllWarehouses();
      setWarehouses(
        (res || []).map((w) => ({
          value: w.warehouseId || w.id,
          label: `${w.code || ""} - ${w.name}`,
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách kho");
    }
  };

  const loadReturnOrders = async () => {
    try {
      setReturnOrderLoading(true);
      const response = await returnOrderService.getAllReturnOrders();
      const list = Array.isArray(response)
        ? response
        : response?.content || response?.data || [];
      // Chỉ cho chọn RO đã Approved/Completed
      const filtered = list.filter((ro) =>
        ["Approved", "Completed"].includes(ro.status)
      );
      setReturnOrders(filtered);

      // Nếu vào form từ ReturnOrderDetail (có roId trên URL) thì auto load chi tiết
      if (preselectedRoId) {
        const roIdNum = Number(preselectedRoId);
        setFormData((prev) => ({
          ...prev,
          roId: roIdNum,
        }));
        await loadReturnOrderDetail(roIdNum);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Đơn trả hàng");
    } finally {
      setReturnOrderLoading(false);
    }
  };

  const loadReturnOrderDetail = async (roId) => {
    try {
      setLoading(true);
      const detail = await returnOrderService.getReturnOrder(roId);
      setSelectedReturnOrderDetail(detail);
      setFormData((prev) => ({
        ...prev,
        warehouseId: prev.warehouseId || detail.warehouseId || null,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết Đơn trả hàng");
    } finally {
      setLoading(false);
    }
  };

  const filteredReturnOrders = useMemo(() => {
    const term = returnOrderSearch.trim().toLowerCase();
    return returnOrders.filter((ro) => {
      const matchesKeyword =
        !term ||
        (ro.returnNo || "").toLowerCase().includes(term) ||
        (ro.deliveryNo || "").toLowerCase().includes(term) ||
        (ro.customerName || "").toLowerCase().includes(term);
      return matchesKeyword;
    });
  }, [returnOrders, returnOrderSearch]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.roId) {
      newErrors.roId = "Vui lòng chọn Đơn trả hàng";
    }
    if (!formData.warehouseId) {
      newErrors.warehouseId = "Vui lòng chọn kho nhập lại";
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
      const payload = {
        roId: formData.roId,
        warehouseId: formData.warehouseId,
        expectedReceiptDate: formData.expectedReceiptDate
          ? formData.expectedReceiptDate.toISOString()
          : null,
        notes: formData.notes || null,
      };
      const res = await salesReturnInboundOrderService.createFromReturnOrder(
        payload
      );
      toast.success(
        `Đã tạo Đơn nhập hàng trả lại ${res.sriNo || ""} từ Đơn trả hàng`
      );
      navigate(`/sales/return-inbound-orders/${res.sriId}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Không thể tạo Đơn nhập hàng trả lại từ Đơn trả hàng"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedReturnOrder = () =>
    returnOrders.find((ro) => ro.roId === formData.roId) || null;

  const selectedRO = getSelectedReturnOrder();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales/return-inbound-orders")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Quay lại trang trước"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className="text-2xl font-semibold">
              {isEdit ? "Cập nhật Đơn nhập hàng trả lại" : "Tạo Đơn nhập hàng trả lại"}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Thông tin đơn nhập hàng lại */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn nhập hàng lại</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">
                    Đơn trả hàng nguồn <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex flex-col lg:flex-row gap-2">
                    <input
                      type="text"
                      value={selectedRO?.returnNo || ""}
                      readOnly
                      placeholder="Chưa chọn Đơn trả hàng"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setReturnOrderModalOpen(true)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Chọn
                    </button>
                  </div>
                  {selectedRO && (
                    <p className="mt-2 text-xs text-gray-500">
                      Delivery: {selectedRO.deliveryNo || "—"} | Khách hàng:{" "}
                      {selectedRO.customerName || "—"} | Ngày trả:{" "}
                      {formatDate(selectedRO.returnDate)}
                    </p>
                  )}
                  {errors.roId && (
                    <p className="text-sm text-red-600 mt-1">{errors.roId}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Kho nhập lại <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="mt-1"
                    value={
                      warehouses.find((w) => w.value === formData.warehouseId) ||
                      null
                    }
                    onChange={(opt) =>
                      handleInputChange("warehouseId", opt ? opt.value : null)
                    }
                    options={warehouses}
                    placeholder="Chọn kho"
                    isClearable
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                    styles={selectStyles}
                  />
                  {errors.warehouseId && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.warehouseId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Ngày dự kiến nhập lại
                  </label>
                  <DatePicker
                    selected={formData.expectedReceiptDate}
                    onChange={(date) =>
                      handleInputChange("expectedReceiptDate", date)
                    }
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Ghi chú</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      handleInputChange("notes", e.target.value || "")
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Thông tin bổ sung cho kho (nếu có)"
                  />
                </div>
              </div>
            </div>
          </div>

          {selectedReturnOrderDetail && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 uppercase mb-4">
                  Thông tin Đơn trả hàng
                </h2>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="text-gray-500">Số Đơn trả hàng: </span>
                    <span className="font-semibold">
                      {selectedReturnOrderDetail.returnNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Delivery: </span>
                    <span>{selectedReturnOrderDetail.deliveryNo || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sales Order: </span>
                    <span>{selectedReturnOrderDetail.salesOrderNo || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Khách hàng: </span>
                    <span>{selectedReturnOrderDetail.customerName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Kho trả hàng: </span>
                    <span>{selectedReturnOrderDetail.warehouseName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày trả hàng: </span>
                    <span>{formatDate(selectedReturnOrderDetail.returnDate)}</span>
                  </div>
                  {selectedReturnOrderDetail.reason && (
                    <div>
                      <span className="text-gray-500">Lý do: </span>
                      <span>{selectedReturnOrderDetail.reason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 uppercase mb-4">
                  Thông tin kiểm soát
                </h2>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="text-gray-500">Người tạo: </span>
                    <span>
                      {selectedReturnOrderDetail.createdByDisplay ||
                        selectedReturnOrderDetail.createdBy ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày tạo: </span>
                    <span>{formatDateTime(selectedReturnOrderDetail.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Người cập nhật: </span>
                    <span>
                      {selectedReturnOrderDetail.updatedByDisplay ||
                        selectedReturnOrderDetail.updatedBy ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày cập nhật: </span>
                    <span>{formatDateTime(selectedReturnOrderDetail.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReturnOrderDetail && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Danh sách sản phẩm trong Đơn trả hàng
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Sản phẩm</th>
                      <th className="px-4 py-3 text-left">Kho</th>
                      <th className="px-4 py-3 text-right">SL trả lại</th>
                      <th className="px-4 py-3 text-left">Đơn vị</th>
                      <th className="px-4 py-3 text-left">Lý do</th>
                      <th className="px-4 py-3 text-left">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedReturnOrderDetail.items?.map((item, index) => (
                      <tr key={item.roiId || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-700 text-center">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="font-semibold">
                            {item.productName || "—"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.productSku || item.productCode || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.warehouseName || selectedReturnOrderDetail.warehouseName || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatNumber(item.returnedQty || 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.uom || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.reason || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.note || "—"}</td>
                      </tr>
                    ))}
                    {(!selectedReturnOrderDetail.items ||
                      selectedReturnOrderDetail.items.length === 0) && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-500 text-sm"
                        >
                          Đơn trả hàng không có dòng sản phẩm nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/sales/return-inbound-orders")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Đang tạo..." : isEdit ? "Cập nhật" : "Tạo Đơn nhập hàng trả lại"}
            </button>
          </div>
        </form>
      </div>

      <ReturnOrderPickerModal
        isOpen={returnOrderModalOpen}
        onClose={() => setReturnOrderModalOpen(false)}
        returnOrders={filteredReturnOrders}
        loading={returnOrderLoading}
        onSelect={async (ro) => {
          setReturnOrderModalOpen(false);
          if (!ro?.roId) return;
          setFormData((prev) => ({
            ...prev,
            roId: ro.roId,
            warehouseId: ro.warehouseId || prev.warehouseId,
          }));
          await loadReturnOrderDetail(ro.roId);
        }}
        searchTerm={returnOrderSearch}
        onSearchChange={setReturnOrderSearch}
      />
    </div>
  );
}

const ReturnOrderPickerModal = ({
  isOpen,
  onClose,
  returnOrders,
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
            <h3 className="text-lg font-semibold text-gray-900">
              Chọn Đơn trả hàng
            </h3>
            <p className="text-sm text-gray-500">
              Chỉ hiển thị đơn đã &quot;Approved&quot; hoặc &quot;Completed&quot;.
            </p>
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
            placeholder="Tìm theo số Đơn trả, Delivery, khách hàng..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Đang tải danh sách Đơn trả hàng...
            </div>
          ) : returnOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Không có Đơn trả hàng phù hợp
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Đơn trả hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày trả
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returnOrders.map((ro) => (
                  <tr
                    key={ro.roId}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => onSelect(ro)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {ro.returnNo || `RO-${ro.roId}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ro.deliveryNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ro.customerName || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{ro.status}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(ro.returnDate)}
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


