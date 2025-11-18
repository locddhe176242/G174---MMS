package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.enums.PurchaseQuotationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotEmpty;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseQuotationRequestDTO {
    private String pqNo;

    @NotNull(message = "RFQ ID là bắt buộc")
    private Integer rfqId;

    @NotNull(message = "Vendor ID là bắt buộc")
    private Integer vendorId;

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

    private String notes;

    @NotEmpty(message = "Danh sách items không được để trống")
    private List<PurchaseQuotationItemRequestDTO> items;
}

