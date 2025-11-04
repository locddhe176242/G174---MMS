package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionItemRequestDTO {

    private Long planItemId;

    private Long productId;

    @NotBlank(message = "Mã sản phẩm không được để trống")
    @Size(max = 50)
    private String productCode;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255)
    private String productName;

    private String spec;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String uom;

    @NotNull(message = "Số lượng yêu cầu không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng yêu cầu phải lớn hơn 0")
    private BigDecimal requestedQty;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal targetUnitPrice;

    private Long suggestedVendorId;

    private String note;
}
