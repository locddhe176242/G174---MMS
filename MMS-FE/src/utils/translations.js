/**
 * Translate status and approval status to Vietnamese
 */

// Purchase Order Status
export const translatePOStatus = (status) => {
  const statusMap = {
    'Pending': 'Chờ xử lý',
    'Processing': 'Đang xử lý',
    'Completed': 'Hoàn thành',
    'Cancelled': 'Đã hủy',
    'Draft': 'Bản nháp'
  };
  return statusMap[status] || status;
};

// Approval Status
export const translateApprovalStatus = (status) => {
  const statusMap = {
    'Pending': 'Chờ duyệt',
    'Approved': 'Đã duyệt',
    'Rejected': 'Từ chối'
  };
  return statusMap[status] || status;
};

// Invoice Status
export const translateInvoiceStatus = (status) => {
  const statusMap = {
    'Unpaid': 'Chưa thanh toán',
    'Partially_Paid': 'Thanh toán 1 phần',
    'Paid': 'Đã thanh toán',
    'Overdue': 'Quá hạn',
    'Cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
};

// Payment Method
export const translatePaymentMethod = (method) => {
  const methodMap = {
    'Bank Transfer': 'Chuyển khoản',
    'Cash': 'Tiền mặt',
    'Credit Card': 'Thẻ tín dụng',
    'Debit Card': 'Thẻ ghi nợ',
    'Check': 'Séc'
  };
  return methodMap[method] || method;
};

// RFQ Status
export const translateRFQStatus = (status) => {
  const statusMap = {
    'Draft': 'Bản nháp',
    'Sent': 'Đã gửi',
    'Responded': 'Đã phản hồi',
    'Completed': 'Hoàn thành',
    'Cancelled': 'Đã hủy',
    'Rejected': 'Từ chối'
  };
  return statusMap[status] || status;
};

// Purchase Quotation Status
export const translatePQStatus = (status) => {
  const statusMap = {
    'Pending': 'Chờ xử lý',
    'Approved': 'Đã duyệt',
    'Rejected': 'Từ chối',
    'Expired': 'Hết hạn',
    'Accepted': 'Đã chấp nhận',
    'Declined': 'Đã từ chối'
  };
  return statusMap[status] || status;
};

// Goods Receipt Status
export const translateGRStatus = (status) => {
  const statusMap = {
    'Pending': 'Chờ xử lý',
    'Completed': 'Hoàn thành',
    'Cancelled': 'Đã hủy',
    'Draft': 'Bản nháp'
  };
  return statusMap[status] || status;
};

// Purchase Requisition Status
export const translatePRStatus = (status) => {
  const statusMap = {
    'Draft': 'Bản nháp',
    'Pending': 'Chờ duyệt',
    'Approved': 'Đã duyệt',
    'Rejected': 'Từ chối',
    'Completed': 'Hoàn thành',
    'Cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
};

// Get status badge color class
export const getStatusColor = (status) => {
  const colorMap = {
    'Completed': 'bg-green-100 text-green-800',
    'Hoàn thành': 'bg-green-100 text-green-800',
    'Approved': 'bg-green-100 text-green-800',
    'Đã duyệt': 'bg-green-100 text-green-800',
    'Paid': 'bg-green-100 text-green-800',
    'Đã thanh toán': 'bg-green-100 text-green-800',
    
    'Cancelled': 'bg-red-100 text-red-800',
    'Đã hủy': 'bg-red-100 text-red-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Từ chối': 'bg-red-100 text-red-800',
    'Overdue': 'bg-red-100 text-red-800',
    'Quá hạn': 'bg-red-100 text-red-800',
    
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Chờ xử lý': 'bg-yellow-100 text-yellow-800',
    'Chờ duyệt': 'bg-yellow-100 text-yellow-800',
    'Processing': 'bg-blue-100 text-blue-800',
    'Đang xử lý': 'bg-blue-100 text-blue-800',
    'Draft': 'bg-gray-100 text-gray-800',
    'Bản nháp': 'bg-gray-100 text-gray-800',
    
    'Partially_Paid': 'bg-orange-100 text-orange-800',
    'Thanh toán 1 phần': 'bg-orange-100 text-orange-800',
    'Unpaid': 'bg-red-100 text-red-800',
    'Chưa thanh toán': 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};
