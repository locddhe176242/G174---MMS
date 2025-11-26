package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.enums.PurchaseOrderApprovalStatus;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderResponseDTO {
    private Integer orderId;
    private String poNo;
    private Integer vendorId;
    private String vendorName;
    private String vendorCode;
    private Integer pqId;
    private String pqNo;
    private LocalDateTime orderDate;
    private PurchaseOrderStatus status;
    private PurchaseOrderApprovalStatus approvalStatus;
    private Integer approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String paymentTerms;
    private LocalDateTime deliveryDate;
    private String shippingAddress;
    private BigDecimal headerDiscount;
    private BigDecimal totalBeforeTax;
    private BigDecimal taxAmount;
    private BigDecimal totalAfterTax;
    private Integer createdById;
    private String createdByName;
    private Integer updatedById;
    private String updatedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseOrderItemResponseDTO> items;
}

