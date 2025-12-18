package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderItemRequestDTO {
    private Integer pqItemId;

    // Removed @NotNull to allow manual PO creation without selecting from product dropdown
    private Integer productId;

    private String uom;

    @NotNull(message = "Số lượng là bắt buộc")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá là bắt buộc")
    private BigDecimal unitPrice;

    private BigDecimal discountPercent;

    private BigDecimal taxRate;

    private BigDecimal taxAmount;

    @NotNull(message = "Tổng tiền dòng là bắt buộc")
    private BigDecimal lineTotal;

    private LocalDate deliveryDate;

    private String note;
}

