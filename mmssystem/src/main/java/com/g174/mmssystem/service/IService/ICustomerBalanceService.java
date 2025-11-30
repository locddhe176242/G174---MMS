package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.entity.CustomerBalance;

import java.math.BigDecimal;

public interface ICustomerBalanceService {

    /**
     * Lấy hoặc tạo CustomerBalance cho customer
     */
    CustomerBalance getOrCreateBalance(Integer customerId);

    /**
     * Cập nhật balance khi có Invoice mới
     */
    void updateOnInvoiceCreated(Integer customerId, BigDecimal invoiceAmount);

    /**
     * Cập nhật balance khi Invoice bị xóa
     */
    void updateOnInvoiceDeleted(Integer customerId, BigDecimal invoiceAmount);

    /**
     * Cập nhật balance khi có Payment mới
     */
    void updateOnPaymentAdded(Integer customerId, BigDecimal paymentAmount);

    /**
     * Cập nhật balance khi Payment bị xóa
     */
    void updateOnPaymentDeleted(Integer customerId, BigDecimal paymentAmount);

    /**
     * Cập nhật balance khi có Credit Note được áp dụng
     */
    void updateOnCreditNoteApplied(Integer customerId, BigDecimal creditNoteAmount);

    /**
     * Cập nhật balance khi Credit Note bị hủy/xóa
     */
    void updateOnCreditNoteRemoved(Integer customerId, BigDecimal creditNoteAmount);

    /**
     * Tính lại balance từ tất cả Invoice, Payment, Credit Note
     */
    void recalculateBalance(Integer customerId);

    /**
     * Lấy outstanding balance của customer
     */
    BigDecimal getOutstandingBalance(Integer customerId);
}

