package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.Delivery;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class DeliveryListResponseDTO {

    private Integer deliveryId;
    private String deliveryNo;
    private Delivery.DeliveryStatus status;
    private String trackingCode;
    private Integer salesOrderId;
    private String salesOrderNo;
    private Integer customerId;
    private String customerName;
    private Integer warehouseId;
    private String warehouseName;
    private Instant plannedDate;
    private Instant actualDate;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdByDisplay;
    private String updatedByDisplay;
}

