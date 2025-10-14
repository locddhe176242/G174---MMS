package com.g174.mmssystem.dto.responseDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class APInvoiceDTO {
    private Integer apInvoiceId;
    private String invoiceNo;
    private Integer vendorId;
    private String vendorName;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal balanceAmount;
    private String status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}