package com.g174.mmssystem.dto.responseDTO;

import java.math.BigDecimal;
import java.time.Instant;

public interface TransactionSummaryProjection {
    Long getTotalQuotations();
    BigDecimal getTotalQuotationAmount();
    Long getActiveQuotations();
    Long getConvertedQuotations();
    Long getTotalOrders();
    BigDecimal getTotalOrderAmount();
    Long getPendingOrders();
    Long getApprovedOrders();
    Long getFulfilledOrders();
    Long getTotalInvoices();
    BigDecimal getTotalInvoiceAmount();
    BigDecimal getTotalPaidAmount();
    BigDecimal getTotalOutstandingAmount();
    Long getUnpaidInvoices();
    Long getPaidInvoices();
    Instant getLastQuotationDate();
    Instant getLastOrderDate();
    Instant getLastInvoiceDate();
}