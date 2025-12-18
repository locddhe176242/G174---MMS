package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.InboundDelivery;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundDeliveryListResponseDTO {

    private Integer inboundDeliveryId;
    private String inboundDeliveryNo;
    private String poNo;
    private String warehouseName;
    private String vendorName;
    private LocalDateTime plannedDate;
    private LocalDateTime actualArrivalDate;
    private String trackingNumber;
    private InboundDelivery.InboundDeliveryStatus status;
    private LocalDateTime createdAt;
    private String createdByName;
    private Integer totalItems;
    private Integer receivedItems;
}
