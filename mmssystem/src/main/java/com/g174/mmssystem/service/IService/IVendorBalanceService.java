package com.g174.mmssystem.service.IService;

import java.math.BigDecimal;

public interface IVendorBalanceService {
    
    /**
     * Lấy hoặc tạo balance record cho vendor
     */
    com.g174.mmssystem.entity.VendorBalance getOrCreateBalance(Integer vendorId);
    
    /**
     * Cập nhật khi tạo AP Invoice
     */
    void updateOnInvoiceCreated(Integer vendorId, BigDecimal invoiceAmount);
    
    /**
     * Cập nhật khi xóa AP Invoice
     */
    void updateOnInvoiceDeleted(Integer vendorId, BigDecimal invoiceAmount);
    
    /**
     * Cập nhật khi thêm Payment
     */
    void updateOnPaymentAdded(Integer vendorId, BigDecimal paymentAmount);
    
    /**
     * Cập nhật khi xóa Payment
     */
    void updateOnPaymentDeleted(Integer vendorId, BigDecimal paymentAmount);
    
    /**
     * Tính lại toàn bộ balance từ database
     */
    void recalculateBalance(Integer vendorId);
    
    /**
     * Lấy công nợ còn lại
     */
    BigDecimal getOutstandingBalance(Integer vendorId);
}
