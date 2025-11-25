package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class DeliveryRequestDTO {

    @NotNull(message = "Thiếu Sales Order ID")
    private Integer salesOrderId;

    @NotNull(message = "Thiếu kho xuất hàng")
    private Integer warehouseId;

    private LocalDate plannedDate;

    private LocalDate actualDate;

    private String shippingAddress;

    @jakarta.validation.constraints.Size(max = 150, message = "Tên đơn vị vận chuyển không được vượt quá 150 ký tự")
    private String carrierName;

    @jakarta.validation.constraints.Size(max = 150, message = "Tên người giao hàng không được vượt quá 150 ký tự")
    private String driverName;

    @jakarta.validation.constraints.Size(max = 50, message = "Số điện thoại không được vượt quá 50 ký tự")
    private String driverPhone;

    @jakarta.validation.constraints.Size(max = 100, message = "Mã vận đơn không được vượt quá 100 ký tự")
    private String trackingCode;

    private String notes;

    @Valid
    @NotEmpty(message = "Cần ít nhất một dòng giao hàng")
    private List<DeliveryItemRequestDTO> items;
}


