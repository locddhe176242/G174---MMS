package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PurchaseRequisitionItemRequestDTO {

    @NotNull(message = "Product ID is required")
    private Integer productId;

    @NotNull(message = "Requested quantity is required")
    private BigDecimal requestedQty;

    @NotNull(message = "Delivery date is required")
    private LocalDate deliveryDate;

    private BigDecimal valuationPrice;

    private BigDecimal priceUnit = BigDecimal.ONE;

    private String note;
}