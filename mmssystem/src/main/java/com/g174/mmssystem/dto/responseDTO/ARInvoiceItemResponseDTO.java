package com.g174.mmssystem.dto.responseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ARInvoiceItemResponseDTO {

    private Integer ariId;
    private Integer deliveryItemId;
    private Integer salesOrderItemId;
    private Integer productId;
    private String productSku;
    private String productName;
    private String description;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;
}

