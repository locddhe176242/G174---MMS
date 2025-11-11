package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfqItemRequestDTO {
    private Integer productId;

    @Size(max = 50, message = "Mã sản phẩm không được quá 50 ký tự")
    private String productCode;

    @Size(max = 255, message = "Tên sản phẩm không được quá 255 ký tự")
    private String productName;

    private String spec;

    @Size(max = 50, message = "Đơn vị tính không được quá 50 ký tự")
    private String uom;

    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.01", inclusive = true, message = "Số lượng phải > 0")
    private BigDecimal quantity;

    private LocalDate deliveryDate;

    @DecimalMin(value = "0.0", inclusive = true, message = "Giá mục tiêu phải >= 0")
    private BigDecimal targetPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Đơn vị giá phải >= 0")
    private BigDecimal priceUnit;

    private String note;
}


