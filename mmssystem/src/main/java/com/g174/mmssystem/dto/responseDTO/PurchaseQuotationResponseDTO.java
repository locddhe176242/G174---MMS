package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.enums.PurchaseQuotationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseQuotationResponseDTO {
    private Integer pqId;
    private String pqNo;
    private Integer rfqId;
    private String rfqNo;
    private Integer vendorId;
    private String vendorName;
    private String vendorCode;
    private LocalDateTime pqDate;
    private LocalDate validUntil;
    private Boolean isTaxIncluded;
    private String deliveryTerms;
    private String paymentTerms;
    private Integer leadTimeDays;
    private Integer warrantyMonths;
    private BigDecimal headerDiscount;
    private BigDecimal shippingCost;
    private BigDecimal totalAmount;
    private PurchaseQuotationStatus status;
    private Integer createdById;
    private String createdByName;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseQuotationItemResponseDTO> items;
}

