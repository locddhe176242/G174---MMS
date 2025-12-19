import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { vendorService } from "../../api/vendorService";
import { toast } from "react-toastify";
import useAuthStore from "../../store/authStore";

export default function VendorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { roles } = useAuthStore();
  
  // Check if user is MANAGER or PURCHASE
  const canEdit = roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name;
    return roleName === 'MANAGER' || roleName === 'ROLE_MANAGER' || 
           roleName === 'PURCHASE' || roleName === 'ROLE_PURCHASE';
  }) || false;
  
  // Redirect users without permission
  useEffect(() => {
    if (!canEdit) {
      toast.error('Bạn không có quyền truy cập trang này!');
      navigate('/vendors');
    }
  }, [canEdit, navigate]);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Validation errors - chỉ hiển thị sau khi submit
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    vendorCode: "",
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
      email: "",
      website: ""
    }
  });



  // Load vendor data or generate code on mount
  useEffect(() => {
    if (isEdit && id) {
      loadVendorData();
    } else if (!isEdit) {
      generateVendorCode();
    }
  }, [isEdit, id]);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      const vendor = await vendorService.getVendorById(id);
      
      console.log("Loaded vendor data:", vendor);
      console.log("Province code:", vendor.address?.provinceCode);
      console.log("Ward code:", vendor.address?.wardCode);

      setFormData({
        name: vendor.name || "",
        vendorCode: vendor.vendorCode || "",
        note: vendor.note || "",
        address: {
          street: vendor.address?.street || "",
          provinceCode: vendor.address?.provinceCode || "",
          provinceName: vendor.address?.provinceName || "",
          wardCode: vendor.address?.wardCode || "",
          wardName: vendor.address?.wardName || "",
          country: vendor.address?.country || "Việt Nam"
        },
        contact: {
          phone: vendor.contact?.phone || "",
          email: vendor.contact?.email || "",
          website: vendor.contact?.website || ""
        }
      });
    } catch (err) {
      setError("Không thể tải thông tin nhà cung cấp");
      console.error("Error loading vendor:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateVendorCode = async () => {
    try {
      const response = await vendorService.generateVendorCode();
      setFormData(prev => ({
        ...prev,
        vendorCode: response.vendorCode
      }));
    } catch (err) {
      console.error('Error generating vendor code:', err);
      // Fallback: tạo code dựa trên timestamp
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({
        ...prev,
        vendorCode: `NCC${timestamp}`
      }));
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

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return false; // Email bắt buộc phải nhập
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Phone không bắt buộc
    const phoneRegex = /^0[3|5|7|8|9][0-9]{7,8}$/;
    return phoneRegex.test(phone);
  };

  const validateWebsite = (website) => {
    if (!website) return true; // Website không bắt buộc
    const websiteRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}(\/[^\s]*)?$/;
    return websiteRegex.test(website);
  };

  // Validate tất cả fields cùng lúc
  const validateAllFields = () => {
    const errors = {};

    // Validate name (bắt buộc)
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = "Tên nhà cung cấp phải có ít nhất 2 ký tự";
    }

    // Validate vendorCode (bắt buộc)
    if (!formData.vendorCode || formData.vendorCode.trim().length === 0) {
      errors.vendorCode = "Mã nhà cung cấp không được để trống";
    }

    // Validate province (bắt buộc)
    if (!formData.address.provinceName || formData.address.provinceName.trim().length === 0) {
      errors.province = "Vui lòng nhập tỉnh/thành phố";
    }

    // Validate ward (bắt buộc)
    if (!formData.address.wardName || formData.address.wardName.trim().length === 0) {
      errors.ward = "Vui lòng nhập phường/xã";
    }

    // Validate email (bắt buộc)
    if (!formData.contact.email || formData.contact.email.trim().length === 0) {
      errors.email = "Email là bắt buộc";
    } else if (!validateEmail(formData.contact.email)) {
      errors.email = "Email không đúng định dạng (vd: example@gmail.com)";
    }

    // Validate phone (không bắt buộc nhưng phải đúng format)
    if (formData.contact.phone && !validatePhone(formData.contact.phone)) {
      errors.phone = "Số điện thoại không đúng định dạng";
    }

    // Validate website (không bắt buộc nhưng phải đúng format)
    if (formData.contact.website && !validateWebsite(formData.contact.website)) {
      errors.website = "Website không đúng định dạng (vd: https://example.com)";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Clear previous validation errors
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
        await vendorService.updateVendor(id, formData);
        toast.success("Cập nhật nhà cung cấp thành công!");
        navigate("/vendors");
      } else {
        await vendorService.createVendor(formData);
        toast.success("Tạo nhà cung cấp thành công!");
        navigate("/vendors");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        (isEdit ? "Không thể cập nhật nhà cung cấp" : "Không thể tạo nhà cung cấp");
      setError(errorMessage);
      console.error("Error saving vendor:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/vendors");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải...</span>
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
              {isEdit ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Nhập tên nhà cung cấp"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={(e) => handleInputChange("vendorCode", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 ${validationErrors.vendorCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Mã sẽ được tự động tạo"
                    readOnly
                  />
                  {validationErrors.vendorCode && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.vendorCode}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập ghi chú (tùy chọn)"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="email"
                    autoComplete="off"
                    value={formData.contact.email}
                    onChange={(e) => handleInputChange("contact.email", e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  autoComplete="off"
                  value={formData.contact.website}
                  onChange={(e) => handleInputChange("contact.website", e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.website ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {validationErrors.website && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.website}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEdit ? "Đang cập nhật..." : "Đang tạo..."}
                  </>
                ) : (
                  isEdit ? "Cập nhật nhà cung cấp" : "Tạo nhà cung cấp"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}