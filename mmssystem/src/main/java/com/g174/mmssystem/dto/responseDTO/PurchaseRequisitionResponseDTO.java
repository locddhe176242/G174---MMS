package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.PurchaseRequisitionStatus; // ← Import enum mới
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PurchaseRequisitionResponseDTO {
    private Integer requisitionId;
    private String requisitionNo;
    private Integer requesterId;
    private String requesterName;
    private String purpose;
    private PurchaseRequisitionStatus status;
    private Integer approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseRequisitionItemResponseDTO> items;
}