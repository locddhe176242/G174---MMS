package com.g174.mmssystem.dto.responseDTO;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class CustomerDetailResponseDTO {
    private Integer customerId;
    private String firstName;
    private String lastName;
    private AddressInfo address;
    private ContactInfo contact;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;

    // Transaction Summary
    private TransactionSummaryDTO transactionSummary;

    // Recent Transactions
    private List<QuotationSummaryDTO> recentQuotations;
    private List<OrderSummaryDTO> recentOrders;
    private List<InvoiceSummaryDTO> recentInvoices;

    @Data
    public static class AddressInfo {
        private Integer addressId;
        private String street;
        private String city;
        private String country;
    }

    @Data
    public static class ContactInfo {
        private Integer contactId;
        private String phone;
        private String email;
    }

    @Data
    public static class QuotationSummaryDTO {
        private Integer sqId;
        private String quotationNo;
        private Instant quotationDate;
        private String status;
        private BigDecimal totalAmount;
    }

    @Data
    public static class OrderSummaryDTO {
        private Integer soId;
        private String soNo;
        private Instant orderDate;
        private String status;
        private String approvalStatus;
        private BigDecimal totalAmount;
    }

    @Data
    public static class InvoiceSummaryDTO {
        private Integer arInvoiceId;
        private String invoiceNo;
        private String invoiceDate;
        private String dueDate;
        private String status;
        private BigDecimal totalAmount;
        private BigDecimal balanceAmount;
    }
}