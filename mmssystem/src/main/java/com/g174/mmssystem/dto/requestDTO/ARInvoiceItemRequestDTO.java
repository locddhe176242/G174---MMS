package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ARInvoiceItemRequestDTO {

    @NotNull(message = "Delivery Item ID không được để trống")
    private Integer deliveryItemId;

    private Integer salesOrderItemId;

    @NotNull(message = "Product ID không được để trống")
    private Integer productId;

    private String description;

    @NotNull(message = "Số lượng không được để trống")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá không được để trống")
    private BigDecimal unitPrice;

    private BigDecimal taxRate;

    private BigDecimal taxAmount;

    @NotNull(message = "Tổng dòng không được để trống")
    private BigDecimal lineTotal;
}

