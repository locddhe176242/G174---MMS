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
    private LocalDate validUntil;
    private Instant quotationDate;
    private BigDecimal totalAmount;
}

