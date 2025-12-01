package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.enums.RequisitionStatus;
import lombok.*;

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
    private Integer requesterId;
    private String requesterName;
    private String purpose;
    private RequisitionStatus status;
    private Integer approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private Integer createdById;
    private String createdByName;
    private Integer updatedById;
    private String updatedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseRequisitionItemResponseDTO> items;
}

