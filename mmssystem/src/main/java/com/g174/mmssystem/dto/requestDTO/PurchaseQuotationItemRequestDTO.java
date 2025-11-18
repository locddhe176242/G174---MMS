package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseQuotationItemRequestDTO {
    @NotNull(message = "RFQ Item ID là bắt buộc")
    private Integer rfqItemId;

    private Integer productId;

    @NotNull(message = "Số lượng là bắt buộc")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá là bắt buộc")
    private BigDecimal unitPrice;

    private BigDecimal taxRate;

    private BigDecimal taxAmount;

    @NotNull(message = "Tổng tiền dòng là bắt buộc")
    private BigDecimal lineTotal;

    private String remark;
}

