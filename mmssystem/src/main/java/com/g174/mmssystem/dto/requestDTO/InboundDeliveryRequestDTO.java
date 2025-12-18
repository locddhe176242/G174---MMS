package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.entity.InboundDelivery;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundDeliveryRequestDTO {

    private String inboundDeliveryNo;

    @NotNull(message = "Order ID là bắt buộc")
    private Integer orderId;

    @NotNull(message = "Warehouse ID là bắt buộc")
    private Integer warehouseId;

    private LocalDateTime plannedDate;

    private LocalDateTime actualArrivalDate;

    @NotNull(message = "Vendor ID là bắt buộc")
    private Integer vendorId;

    private String shippingAddress;

    private String carrierName;

    private String trackingNumber;

    private InboundDelivery.InboundDeliveryStatus status;

    private String notes;

    private Integer createdById;

    private Integer updatedById;

    private List<InboundDeliveryItemRequestDTO> items;
}
