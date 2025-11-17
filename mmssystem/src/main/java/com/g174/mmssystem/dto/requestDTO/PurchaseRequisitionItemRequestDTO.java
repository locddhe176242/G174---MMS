package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionItemRequestDTO {

    private Long productId;

    @Size(max = 255)
    private String productName;

    @NotNull(message = "Số lượng yêu cầu không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng yêu cầu phải lớn hơn 0")
    private BigDecimal requestedQty;

    @Size(max = 50)
    private String unit;

    @NotNull(message = "Ngày giao hàng là bắt buộc")
    private LocalDate deliveryDate;

    private String note;
}
