package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ReturnOrderItemRequestDTO {

    @NotNull(message = "Thiếu Delivery Item ID")
    private Integer deliveryItemId;

    @NotNull(message = "Thiếu sản phẩm")
    private Integer productId;

    @NotNull(message = "Thiếu kho")
    private Integer warehouseId;

    @NotNull(message = "Số lượng trả lại bắt buộc")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số lượng trả lại phải lớn hơn 0")
    private BigDecimal returnedQty;

    private String uom;

    private String reason;

    private String note;
}

