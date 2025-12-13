package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodIssueItemRequestDTO {
    @NotNull(message = "Delivery Item ID là bắt buộc")
    private Integer diId;

    @NotNull(message = "Product ID là bắt buộc")
    private Integer productId;

    @NotNull(message = "Số lượng xuất là bắt buộc")
    private BigDecimal issuedQty;

    private String remark;
}

