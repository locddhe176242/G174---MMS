export const validation = {
  // Phone number validation (Vietnam format)
  phone: {
    validate: (phone) => {
      if (!phone) return { isValid: true, message: "" }; // Optional field
      
      // Remove all non-digit characters
      const cleanPhone = phone.replace(/\D/g, "");
      
      // Check if it's a valid Vietnamese phone number
      const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        return {
          isValid: false,
          message: "Số điện thoại không hợp lệ. Ví dụ: 0123456789"
        };
      }
      
      return { isValid: true, message: "" };
    },
    
    format: (phone) => {
      if (!phone) return "";
      const cleanPhone = phone.replace(/\D/g, "");
      return cleanPhone;
    }
  },

  // Email validation
  email: {
    validate: (email) => {
      if (!email) return { isValid: true, message: "" }; // Optional field
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        return {
          isValid: false,
          message: "Email không hợp lệ. Ví dụ: example@domain.com"
        };
      }
      
      return { isValid: true, message: "" };
    }
  },

  // Website validation
  website: {
    validate: (website) => {
      if (!website) return { isValid: true, message: "" }; // Optional field
      
      const websiteRegex = /^https?:\/\/.+\..+/;
      
      if (!websiteRegex.test(website)) {
        return {
          isValid: false,
          message: "Website phải bắt đầu bằng http:// hoặc https://"
        };
      }
      
      return { isValid: true, message: "" };
    }
  },

  // Required field validation
  required: {
    validate: (value, fieldName) => {
      if (!value || value.trim() === "") {
        return {
          isValid: false,
          message: `${fieldName} là bắt buộc`
        };
      }
      
      return { isValid: true, message: "" };
    }
  },

  // Vendor code validation
  vendorCode: {
    validate: (vendorCode) => {
      if (!vendorCode) {
        return {
          isValid: false,
          message: "Mã nhà cung cấp là bắt buộc"
        };
      }
      
      // Check format: VENDOR-XXX or similar
      const vendorCodeRegex = /^[A-Z0-9-]+$/;
      
      if (!vendorCodeRegex.test(vendorCode)) {
        return {
          isValid: false,
          message: "Mã nhà cung cấp chỉ được chứa chữ hoa, số và dấu gạch ngang"
        };
      }
      
      return { isValid: true, message: "" };
    }
  }
};

// Auto generate vendor code
export const generateVendorCode = () => {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  return `VENDOR-${timestamp}`;
};

// Format phone number for display
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/\D/g, "");
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
  }
  
  return cleanPhone;
};