package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.ARInvoice;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ARInvoiceResponseDTO {

    private Integer arInvoiceId;
    private String invoiceNo;
    private ARInvoice.InvoiceStatus status;

    private Integer customerId;
    private String customerName;
    private String customerCode;

    private Integer salesOrderId;
    private String salesOrderNo;

    private Integer deliveryId;
    private String deliveryNo;

    private LocalDate invoiceDate;
    private LocalDate dueDate;

    private BigDecimal subtotal;
    private BigDecimal headerDiscountPercent;
    private BigDecimal headerDiscountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal balanceAmount;

    private String notes;

    private Instant createdAt;
    private String createdBy;
    private String createdByDisplay;
    private Instant updatedAt;
    private String updatedBy;
    private String updatedByDisplay;

    private List<ARInvoiceItemResponseDTO> items;
    private List<ARPaymentResponseDTO> payments;
}

