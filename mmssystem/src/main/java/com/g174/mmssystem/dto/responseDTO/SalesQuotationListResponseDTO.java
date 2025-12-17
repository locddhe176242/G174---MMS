package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.SalesQuotation;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class SalesQuotationListResponseDTO {
    private Integer quotationId;
    private String quotationNo;
    private SalesQuotation.QuotationStatus status;
    private Integer customerId;
    private String customerName;
    // Dùng cho UI: báo giá đã được chuyển sang Sales Order hay chưa
    private Boolean hasSalesOrder;
    private Integer salesOrderId;
    private LocalDate validUntil;
    private Instant quotationDate;
    private BigDecimal totalAmount;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdByDisplay;
    private String updatedByDisplay;
}