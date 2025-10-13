import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomer } from "../../api/customerService";

const Label = ({ children }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);
const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ""}`}
  />
);
const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    rows={4}
  />
);

export default function CustomerForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    note: "",
    address: { street: "", city: "", country: "" },
    contact: { phone: "", email: "" },
  });

  const setField = (path, value) => {
    setForm((prev) => {
      const clone = { ...prev };
      const parts = path.split(".");
      let cur = clone;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return clone;
    });
  };

  const validate = () => {
    if (!form.firstName?.trim()) return "Họ (firstName) là bắt buộc";
    if (!form.lastName?.trim()) return "Tên (lastName) là bắt buộc";
    if (form.contact.email && !/^\S+@\S+\.\S+$/.test(form.contact.email)) return "Email không hợp lệ";
    return null;
    // Có thể bổ sung kiểm tra độ dài nếu cần
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }

    // Chuẩn hóa: nếu address/contact trống hoàn toàn thì gửi null
    const normalized = { ...form };
    const isAddressEmpty = !normalized.address.street && !normalized.address.city && !normalized.address.country;
    const isContactEmpty = !normalized.contact.phone && !normalized.contact.email;
    if (isAddressEmpty) normalized.address = null;
    if (isContactEmpty) normalized.contact = null;

    try {
      setSubmitting(true);
      setErr(null);
      const created = await createCustomer(normalized);
      navigate(`/customers/${created.customerId}`);
    } catch (e) {
      setErr(e?.response?.data?.message || "Không thể tạo khách hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Thêm khách hàng</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-2 rounded-md border hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>

        {err && <div className="mb-4 text-red-600 text-sm">{err}</div>}

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Thông tin cơ bản */}
          <div className="border rounded-md p-4">
            <div className="text-base font-medium mb-3">Thông tin khách hàng</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Họ</Label>
                <Input
                  placeholder="Nguyễn"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                />
              </div>
              <div>
                <Label>Tên</Label>
                <Input
                  placeholder="Văn A"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Ghi chú</Label>
                <Textarea
                  placeholder="Ghi chú về khách hàng"
                  value={form.note}
                  onChange={(e) => setField("note", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Liên hệ */}
          <div className="border rounded-md p-4">
            <div className="text-base font-medium mb-3">Liên hệ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="sample@gmail.com"
                  value={form.contact.email}
                  onChange={(e) => setField("contact.email", e.target.value)}
                />
              </div>
              <div>
                <Label>Điện thoại</Label>
                <Input
                  placeholder="08489123456"
                  value={form.contact.phone}
                  onChange={(e) => setField("contact.phone", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="border rounded-md p-4 lg:col-span-2">
            <div className="text-base font-medium mb-3">Địa chỉ</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>Đường</Label>
                <Input
                  placeholder="123 Lý Thường Kiệt"
                  value={form.address.street}
                  onChange={(e) => setField("address.street", e.target.value)}
                />
              </div>
              <div>
                <Label>Thành phố</Label>
                <Input
                  placeholder="Hà Nội"
                  value={form.address.city}
                  onChange={(e) => setField("address.city", e.target.value)}
                />
              </div>
              <div>
                <Label>Quốc gia</Label>
                <Input
                  placeholder="Việt Nam"
                  value={form.address.country}
                  onChange={(e) => setField("address.country", e.target.value)}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}