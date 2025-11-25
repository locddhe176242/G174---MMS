package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.Delivery;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class DeliveryResponseDTO {

    private Integer deliveryId;
    private String deliveryNo;
    private Delivery.DeliveryStatus status;

    private Integer salesOrderId;
    private String salesOrderNo;
    private Integer customerId;
    private String customerName;

    private Integer warehouseId;
    private String warehouseName;

    private Instant plannedDate;
    private Instant actualDate;

    private String shippingAddress;
    private String carrierName;
    private String driverName;
    private String driverPhone;
    private String trackingCode;
    private String notes;

    private Instant createdAt;
    private String createdBy;
    private Instant updatedAt;
    private String updatedBy;

    private List<DeliveryItemResponseDTO> items;
}


