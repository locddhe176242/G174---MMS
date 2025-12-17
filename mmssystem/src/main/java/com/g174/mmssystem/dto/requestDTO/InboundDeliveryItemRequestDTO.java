package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundDeliveryItemRequestDTO {

    @NotNull(message = "Purchase Order Item ID là bắt buộc")
    private Integer poiId;

    @NotNull(message = "Product ID là bắt buộc")
    private Integer productId;

    @NotNull(message = "Expected quantity là bắt buộc")
    @Positive(message = "Expected quantity phải lớn hơn 0")
    private BigDecimal expectedQty;

    private String uom;

    private String notes;
}
