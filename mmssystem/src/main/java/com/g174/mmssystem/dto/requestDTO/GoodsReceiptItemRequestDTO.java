package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptItemRequestDTO {
    private Integer poiId;

    private Integer roiId;

    @NotNull(message = "Product ID là bắt buộc")
    private Integer productId;

    @NotNull(message = "Số lượng nhận là bắt buộc")
    private BigDecimal receivedQty;

    private BigDecimal acceptedQty;

    private String remark;
}

