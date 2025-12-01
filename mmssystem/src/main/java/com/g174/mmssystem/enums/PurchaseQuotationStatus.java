package com.g174.mmssystem.enums;

public enum PurchaseQuotationStatus {
    Draft,      // Nháp - vendor đang soạn báo giá
    Sent,       // Đã gửi - vendor đã gửi báo giá cho buyer
    Pending,    // Chờ phê duyệt - buyer đang xem xét
    Approved,   // Đã phê duyệt - buyer chấp nhận
    Rejected,   // Đã từ chối - buyer không chấp nhận
    Ordered     // Đã tạo PO - PQ đã được chuyển thành Purchase Order
}

