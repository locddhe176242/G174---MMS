package com.g174.mmssystem.dto.responseDTO;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class TransactionSummaryDTO {
    private Integer customerId;
    private String customerName;

    // Quotation Summary
    private Long totalQuotations;
    private BigDecimal totalQuotationAmount;
    private Long activeQuotations;
    private Long convertedQuotations;

    // Order Summary
    private Long totalOrders;
    private BigDecimal totalOrderAmount;
    private Long pendingOrders;
    private Long approvedOrders;
    private Long fulfilledOrders;

    // Invoice Summary
    private Long totalInvoices;
    private BigDecimal totalInvoiceAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalOutstandingAmount;
    private Long unpaidInvoices;
    private Long paidInvoices;

    // Recent Activity
    private Instant lastQuotationDate;
    private Instant lastOrderDate;
    private Instant lastInvoiceDate;
}