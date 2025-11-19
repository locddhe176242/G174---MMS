package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.SalesQuotation;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class SalesQuotationResponseDTO {
    private Integer quotationId;
    private String quotationNo;
    private SalesQuotation.QuotationStatus status;
    private Integer customerId;
    private String customerName;
    private String customerCode;
    private Instant quotationDate;
    private LocalDate validUntil;
    private String paymentTerms;
    private String deliveryTerms;
    private BigDecimal headerDiscount;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String notes;
    private Instant createdAt;
    private String createdBy;
    private Instant updatedAt;
    private String updatedBy;
    private List<SalesQuotationItemResponseDTO> items;
}

