package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.GoodIssue;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodIssueResponseDTO {
    private Integer issueId;
    private String issueNo;

    private Integer deliveryId;
    private String deliveryNo;

    private Integer salesOrderId;
    private String salesOrderNo;

    private Integer customerId;
    private String customerName;

    private Integer warehouseId;
    private String warehouseName;
    private String warehouseCode;

    private LocalDateTime issueDate;
    private GoodIssue.GoodIssueStatus status;

    private Integer createdById;
    private String createdByName;

    private Integer approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String notes;

    private List<GoodIssueItemResponseDTO> items;
}
