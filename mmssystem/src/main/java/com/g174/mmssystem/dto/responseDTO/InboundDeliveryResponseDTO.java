package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.InboundDelivery;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundDeliveryResponseDTO {

    private Integer inboundDeliveryId;
    private String inboundDeliveryNo;
    private Integer orderId;
    private String poNo;
    private Integer warehouseId;
    private String warehouseName;
    private String warehouseCode;
    private LocalDateTime plannedDate;
    private LocalDateTime actualArrivalDate;
    private Integer vendorId;
    private String vendorName;
    private String vendorCode;
    private String shippingAddress;
    private String carrierName;
    private String trackingNumber;
    private InboundDelivery.InboundDeliveryStatus status;
    private String notes;
    private Integer createdById;
    private String createdByName;
    private Integer updatedById;
    private String updatedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InboundDeliveryItemResponseDTO> items;
    private Boolean hasGoodsReceipt; // Đánh dấu ID đã có Goods Receipt
}
