package com.g174.mmssystem.dto.responseDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransactionSummaryDTO {
    private Integer vendorId;

    // Purchase Quotations
    private Long totalQuotations;
    private BigDecimal totalQuotationAmount;
    private Long activeQuotations;
    private Long convertedQuotations;

    // Purchase Orders
    private Long totalOrders;
    private BigDecimal totalOrderAmount;
    private Long pendingOrders;
    private Long approvedOrders;
    private Long completedOrders;

    // AP Invoices
    private Long totalInvoices;
    private BigDecimal totalInvoiceAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalOutstandingAmount;
    private Long unpaidInvoices;
    private Long partiallyPaidInvoices;
    private Long paidInvoices;
}