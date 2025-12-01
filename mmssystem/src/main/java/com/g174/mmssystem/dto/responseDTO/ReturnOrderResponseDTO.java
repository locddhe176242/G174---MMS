package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.ReturnOrder;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class ReturnOrderResponseDTO {

    private Integer roId;
    private String returnNo;
    private ReturnOrder.ReturnStatus status;

    private Integer deliveryId;
    private String deliveryNo;
    private Integer salesOrderId;
    private String salesOrderNo;

    private Integer invoiceId;
    private String invoiceNo;

    private Integer customerId;
    private String customerName;

    private Integer warehouseId;
    private String warehouseName;

    private Instant returnDate;

    private String reason;
    private String notes;

    private Instant createdAt;
    private String createdBy;
    private Instant updatedAt;
    private String updatedBy;

    private List<ReturnOrderItemResponseDTO> items;
}

