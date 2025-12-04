package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.SalesReturnInboundOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesReturnInboundOrderResponseDTO {

    private Integer sriId;
    private String sriNo;

    private SalesReturnInboundOrder.Status status;

    private Integer roId;
    private String returnNo;

    private Integer warehouseId;
    private String warehouseName;
    private String warehouseCode;

    private LocalDateTime expectedReceiptDate;

    private String notes;

    private Integer createdById;
    private String createdByName;
    private Integer approvedById;
    private String approvedByName;

    private Instant approvedAt;
    private Instant createdAt;
    private Instant updatedAt;

    private List<SalesReturnInboundOrderItemResponseDTO> items;
}


