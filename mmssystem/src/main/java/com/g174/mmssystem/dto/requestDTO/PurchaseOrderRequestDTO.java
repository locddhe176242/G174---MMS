package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.enums.PurchaseOrderApprovalStatus;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderRequestDTO {
    private String poNo;

    @NotNull(message = "Vendor ID là bắt buộc")
    private Integer vendorId;

    private Integer pqId;

    private LocalDateTime orderDate;

    private PurchaseOrderStatus status;

    private PurchaseOrderApprovalStatus approvalStatus;

    private Integer approverId;

    private LocalDateTime approvedAt;

    private String paymentTerms;

    private LocalDateTime deliveryDate;

    private String shippingAddress;

    private BigDecimal headerDiscount;

    private BigDecimal totalBeforeTax;

    private BigDecimal taxAmount;

    private BigDecimal totalAfterTax;

    private Integer createdById;

    private Integer updatedById;

    @NotEmpty(message = "Danh sách items không được để trống")
    private List<PurchaseOrderItemRequestDTO> items;
}

