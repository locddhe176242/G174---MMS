package com.g174.mmssystem.dto.responseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DeliveryItemResponseDTO {

    private Integer deliveryItemId;
    private Integer salesOrderItemId;
    private Integer productId;
    private String productSku;
    private String productName;
    private Integer warehouseId;
    private String warehouseName;
    private BigDecimal orderedQty;
    private BigDecimal plannedQty;
    private BigDecimal deliveredQty;
    private String uom;
    private String note;
}


