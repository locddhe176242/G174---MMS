import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import { customerService } from "../../api/customerService";
import { toast } from "react-toastify";

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    customerCode: "",
    firstName: "",
    lastName: "",
    note: "",
    address: {
      street: "",
      provinceCode: "",
      provinceName: "",
      wardCode: "",
      wardName: "",
      country: "Việt Nam"
    },
    contact: {
      phone: "",
      email: ""
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // States cho provinces và wards
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    // loadProvinces(); // Disabled due to CORS - using text input instead
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadCustomerData();
    } else {
      // Auto generate customer code for new customer
      generateCustomerCode();
    }
  }, [id, isEdit]);

  // Load wards khi chọn province HOẶC khi provinces load xong
  useEffect(() => {
    // Disabled - using text input instead
    // if (formData.address.provinceCode && provinces.length > 0) {
    //   loadWards(formData.address.provinceCode);
    // } else {
    //   setWards([]);
    // }
  }, [formData.address.provinceCode, provinces]);

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const response = await fetch('https://provinces.open-api.vn/api/?depth=1');
      const data = await response.json();
      const formattedProvinces = data.map(province => ({
        value: province.code,
        label: province.name
      }));
      setProvinces(formattedProvinces);
    } catch (err) {
      console.error('Error loading provinces:', err);
      toast.error('Không thể tải danh sách tỉnh/thành phố');
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadWards = async (provinceCode) => {
    try {
      setLoadingWards(true);
      const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const provinceData = await response.json();

      const allWards = [];
      if (provinceData.wards && Array.isArray(provinceData.wards)) {
        provinceData.wards.forEach(ward => {
          allWards.push({
            value: ward.code,
            label: ward.name
          });
        });
      }

      setWards(allWards);

      if (allWards.length === 0) {
        toast.info('Không tìm thấy phường/xã cho tỉnh này');
      }
    } catch (err) {
      console.error('Error loading wards:', err);
      toast.error('Không thể tải danh sách phường/xã');
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const generateCustomerCode = async () => {
    try {
      const response = await customerService.generateCustomerCode();
      setFormData(prev => ({
        ...prev,
        customerCode: response.customerCode
      }));
    } catch (err) {
      console.error('Error generating customer code:', err);
      // Fallback: tạo code dựa trên timestamp
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({
        ...prev,
        customerCode: `KH${timestamp}`
      }));
    }
  };

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const customer = await customerService.getCustomerById(id);
      setFormData({
        customerCode: customer.customerCode || "", // THÊM DÒNG NÀY
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        note: customer.note || "",
        address: {
          street: customer.address?.street || "",
          provinceCode: customer.address?.provinceCode || "",
          provinceName: customer.address?.provinceName || "",
          wardCode: customer.address?.wardCode || "",
          wardName: customer.address?.wardName || "",
          country: customer.address?.country || "Việt Nam"
        },
        contact: {
          phone: customer.contact?.phone || "",
          email: customer.contact?.email || ""
        }
      });
    } catch (err) {
      setError("Không thể tải thông tin khách hàng");
      console.error("Error loading customer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleProvinceChange = (selectedOption) => {
    const provinceCode = selectedOption ? selectedOption.value : "";
    const provinceName = selectedOption ? selectedOption.label : "";

    // Reset wards
    setWards([]);

    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        provinceCode,
        provinceName,
        wardCode: "", // Reset ward khi đổi province
        wardName: ""
      }
    }));
  };

  const handleWardChange = (selectedOption) => {
    const wardCode = selectedOption ? selectedOption.value : "";
    const wardName = selectedOption ? selectedOption.label : "";

    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        wardCode,
        wardName
      }
    }));
  };

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return false; // Email bắt buộc
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Phone không bắt buộc
    const phoneRegex = /^0[3|5|7|8|9][0-9]{7,8}$/;
    return phoneRegex.test(phone);
  };

  // Validate tất cả fields cùng lúc
  const validateAllFields = () => {
    const errors = {};

    // Validate firstName (bắt buộc)
    if (!formData.firstName || formData.firstName.trim().length < 2) {
      errors.firstName = "Tên phải có ít nhất 2 ký tự";
    }

    // Validate lastName (bắt buộc)
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      errors.lastName = "Họ phải có ít nhất 2 ký tự";
    }

    // Validate province (bắt buộc) - dùng provinceName vì đang nhập text tự do
    if (!formData.address.provinceName || formData.address.provinceName.trim() === "") {
      errors.province = "Vui lòng chọn tỉnh/thành phố";
    }

    // Validate ward (bắt buộc) - dùng wardName vì đang nhập text tự do
    if (!formData.address.wardName || formData.address.wardName.trim() === "") {
      errors.ward = "Vui lòng chọn phường/xã";
    }

    // Validate email (bắt buộc)
    if (!formData.contact.email || formData.contact.email.trim() === '') {
      errors.email = "Vui lòng nhập email";
    } else if (!validateEmail(formData.contact.email)) {
      errors.email = "Email không đúng định dạng (vd: example@gmail.com)";
    }

    // Validate phone (không bắt buộc nhưng phải đúng format)
    if (formData.contact.phone && !validatePhone(formData.contact.phone)) {
      errors.phone = "Số điện thoại không đúng định dạng";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});

    // Validate tất cả fields
    const errors = validateAllFields();

    if (Object.keys(errors).length > 0) {
      // Có lỗi validation
      setValidationErrors(errors);
      setIsSubmitting(false);

      // Auto scroll lên đầu form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      if (isEdit) {
        await customerService.updateCustomer(id, formData);
        toast.success("Cập nhật khách hàng thành công!");
        navigate("/customers");
      } else {
        await customerService.createCustomer(formData);
        toast.success("Tạo khách hàng thành công!");
        navigate("/customers");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        (isEdit ? "Không thể cập nhật khách hàng" : "Không thể tạo khách hàng");
      setError(errorMessage);
      console.error("Error saving customer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/customers");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Quay lại trang trước"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className="text-2xl font-semibold">
              {isEdit ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Thông tin khách hàng
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Nhập họ"
                    />
                    {validationErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Nhập tên"
                    />
                    {validationErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã khách hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerCode}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 border-gray-300"
                    placeholder="Mã sẽ được tự động tạo"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin địa chỉ</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ chi tiết
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange("address.street", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Số nhà, tên đường, tổ, khu phố..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address.provinceName || ''}
                      onChange={(e) => handleInputChange("address.provinceName", e.target.value)}
                      placeholder="Nhập tỉnh/thành phố"
                      className={`w-full px-3 py-2 border ${validationErrors.province ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    {validationErrors.province && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.province}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address.wardName || ''}
                      onChange={(e) => handleInputChange("address.wardName", e.target.value)}
                      placeholder="Nhập phường/xã"
                      className={`w-full px-3 py-2 border ${validationErrors.ward ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    {validationErrors.ward && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.ward}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quốc gia
                  </label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange("address.country", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Quốc gia"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin liên hệ</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.phone}
                      onChange={(e) => handleInputChange("contact.phone", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {validationErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.contact.email}
                      onChange={(e) => handleInputChange("contact.email", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập ghi chú về khách hàng"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? "Đang lưu..." : (isEdit ? "Cập nhật" : "Tạo mới")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}