package com.g174.mmssystem.dto.responseDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class PurchaseQuotationDTO {
    private Integer pqId;
    private String pqNo;
    private Integer vendorId;
    private String vendorName;
    private Instant pqDate;
    private LocalDate validUntil;
    private String deliveryTerms;
    private String paymentTerms;
    private BigDecimal headerDiscount;
    private BigDecimal totalAmount;
    private String status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}