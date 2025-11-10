package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.enums.ApprovalStatus;
import com.g174.mmssystem.enums.RequisitionStatus;
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
public class PurchaseRequisitionResponseDTO {
    private Long requisitionId;
    private String requisitionNo;
    private String requesterName;
    private String department;
    private String costCenter;
    private LocalDate neededBy;
    private Integer destinationWarehouseId;
    private String destinationWarehouseName;
    private String purpose;
    private ApprovalStatus approvalStatus;
    private Integer approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private BigDecimal totalEstimated;
    private RequisitionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseRequisitionItemResponseDTO> items;
}
