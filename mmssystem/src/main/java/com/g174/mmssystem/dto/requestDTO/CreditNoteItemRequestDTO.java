package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreditNoteItemRequestDTO {

    @NotNull(message = "Thiếu sản phẩm")
    private Integer productId;

    private String productCode;
    private String productName;
    private String uom;

    @NotNull(message = "Số lượng bắt buộc")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số lượng phải lớn hơn 0")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá bắt buộc")
    @DecimalMin(value = "0.0", inclusive = true, message = "Đơn giá phải >= 0")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Chiết khấu phải >= 0")
    private BigDecimal discountAmount;

    @DecimalMin(value = "0.0", inclusive = true, message = "Thuế suất phải >= 0")
    private BigDecimal taxRate;

    private String note;
}

