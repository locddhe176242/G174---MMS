package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.enums.ApprovalStatus;
import com.g174.mmssystem.enums.Priority;
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
    private LocalDate requisitionDate;
    private String requesterName;
    private Integer departmentId;
    private String departmentName;
    private String purpose;
    private String justification;
    private LocalDate neededBy;
    private Priority priority;
    private BigDecimal totalEstimated;
    private String currencyCode;
    private ApprovalStatus approvalStatus;
    private Integer approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalRemarks;
    private RequisitionStatus status;
    private Long convertedToPoId;
    private String createdByName;
    private String updatedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseRequisitionItemResponseDTO> items;
}
