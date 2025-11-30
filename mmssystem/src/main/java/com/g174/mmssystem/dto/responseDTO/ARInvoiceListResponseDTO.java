package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.ARInvoice;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class ARInvoiceListResponseDTO {

    private Integer arInvoiceId;
    private String invoiceNo;
    private ARInvoice.InvoiceStatus status;

    private Integer customerId;
    private String customerName;

    private Integer salesOrderId;
    private String salesOrderNo;

    private Integer deliveryId;
    private String deliveryNo;

    private LocalDate invoiceDate;
    private LocalDate dueDate;

    private BigDecimal totalAmount;
    private BigDecimal balanceAmount;

    private Instant createdAt;
    private String createdByDisplay;
    private Instant updatedAt;
    private String updatedByDisplay;
}

