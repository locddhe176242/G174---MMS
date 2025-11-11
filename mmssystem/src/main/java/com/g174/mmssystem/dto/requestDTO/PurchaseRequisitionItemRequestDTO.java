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

    @Size(max = 50)
    private String productCode;

    @Size(max = 255)
    private String productName;

    private String specification;

    @Size(max = 50)
    private String uom;

    @NotNull(message = "Số lượng yêu cầu không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng yêu cầu phải lớn hơn 0")
    private BigDecimal requestedQty;

    @Builder.Default
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal estimatedUnitPrice = BigDecimal.ZERO;

    private LocalDate deliveryDate;

    private String note;
}
