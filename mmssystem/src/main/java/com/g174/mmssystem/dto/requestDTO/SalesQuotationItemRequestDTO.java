package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SalesQuotationItemRequestDTO {

    private Integer productId;

    @Size(max = 50)
    private String productCode;

    @Size(max = 255)
    private String productName;

    @Size(max = 50)
    private String uom;

    @NotNull(message = "Số lượng bắt buộc")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số lượng phải lớn hơn 0")
    private BigDecimal quantity;

    @DecimalMin(value = "0.0", inclusive = true, message = "Đơn giá phải >= 0")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Chiết khấu phải >= 0")
    @DecimalMax(value = "100.0", inclusive = true, message = "Chiết khấu tối đa 100%")
    private BigDecimal discountPercent;

    @DecimalMin(value = "0.0", inclusive = true, message = "Thuế suất phải >= 0")
    private BigDecimal taxRate;

    private String note;
}
