package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DeliveryItemRequestDTO {

    @NotNull(message = "Thiếu Sales Order Item ID")
    private Integer salesOrderItemId;

    @NotNull(message = "Thiếu sản phẩm")
    private Integer productId;

    private Integer warehouseId;

    @NotNull(message = "Thiếu số lượng giao dự kiến")
    @DecimalMin(value = "0.0001", message = "Số lượng giao dự kiến phải lớn hơn 0")
    @DecimalMax(value = "999999999999999.99", message = "Số lượng giao dự kiến quá lớn")
    private BigDecimal plannedQty;

    @DecimalMin(value = "0.0", message = "Số lượng đã giao không được âm")
    @DecimalMax(value = "999999999999999.99", message = "Số lượng đã giao quá lớn")
    private BigDecimal deliveredQty;

    private String note;
}


