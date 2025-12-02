package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Response DTO cho Debt Transaction
 * Tổng hợp từ APInvoice, APPayment, ARInvoice, ARPayment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtTransactionResponseDTO {

    /**
     * ID của transaction (có thể là APInvoiceId, APPaymentId, ARInvoiceId, ARPaymentId)
     */
    private Long id;

    /**
     * Mã khách hàng hoặc nhà cung cấp
     */
    private String customerVendorCode;

    /**
     * Loại: "Customer" hoặc "Vendor"
     */
    private String customerVendorType;

    /**
     * Tên khách hàng hoặc nhà cung cấp
     */
    private String customerVendorName;

    /**
     * Số tiền nợ (TK Nợ)
     */
    private BigDecimal debitAmount;

    /**
     * Số tiền có (TK Có)
     */
    private BigDecimal creditAmount;

    /**
     * Nội dung giao dịch
     */
    private String transactionContent;

    /**
     * Ngày giao dịch
     */
    private LocalDate transactionDate;

    /**
     * Loại giao dịch: "AP_INVOICE", "AP_PAYMENT", "AR_INVOICE", "AR_PAYMENT"
     */
    private String transactionType;

    /**
     * Reference number (invoice no, payment reference, etc.)
     */
    private String referenceNo;
}