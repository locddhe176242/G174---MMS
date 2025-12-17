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
    // Dùng cho UI: báo giá đã được chuyển sang Sales Order hay chưa
    private Boolean hasSalesOrder;
    private Integer salesOrderId;
    private Instant quotationDate;
    private LocalDate validUntil;
    private String paymentTerms;
    private String deliveryTerms;
    private BigDecimal headerDiscountPercent;
    private BigDecimal headerDiscountAmount;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String notes;
    private Instant createdAt;
    private Integer createdById;
    private String createdBy;
    private String createdByDisplay;
    private Instant updatedAt;
    private Integer updatedById;
    private String updatedBy;
    private String updatedByDisplay;
    private List<SalesQuotationItemResponseDTO> items;
}