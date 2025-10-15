package com.g174.mmssystem.dto.responseDTO;


import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransactionSummaryDTO {
    private Integer vendorId;

    // Purchase Quotations
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class TransactionSummaryDTO {
    private Integer customerId;
    private String customerName;

    // Quotation Summary
 main
    private Long totalQuotations;
    private BigDecimal totalQuotationAmount;
    private Long activeQuotations;
    private Long convertedQuotations;

    // Purchase Orders

    // Order Summary
 main
    private Long totalOrders;
    private BigDecimal totalOrderAmount;
    private Long pendingOrders;
    private Long approvedOrders;

    private Long completedOrders;

    // AP Invoices

    private Long fulfilledOrders;

    // Invoice Summary
 main
    private Long totalInvoices;
    private BigDecimal totalInvoiceAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalOutstandingAmount;
    private Long unpaidInvoices;

    private Long partiallyPaidInvoices;
    private Long paidInvoices;

    private Long paidInvoices;

    // Recent Activity
    private Instant lastQuotationDate;
    private Instant lastOrderDate;
    private Instant lastInvoiceDate;
 main
}