package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SalesOrderItemRequestDTO {

    @NotNull(message = "Sản phẩm bắt buộc")
    private Integer productId;

    private Integer warehouseId;

    private String uom;

    @NotNull(message = "Số lượng bắt buộc")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá bắt buộc")
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "100.0", inclusive = true)
    private BigDecimal discountPercent;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "100.0", inclusive = true)
    private BigDecimal taxRate;

    private String note;
}

