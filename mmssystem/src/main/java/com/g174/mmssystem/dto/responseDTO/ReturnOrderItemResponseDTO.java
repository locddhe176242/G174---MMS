package com.g174.mmssystem.dto.responseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReturnOrderItemResponseDTO {

    private Integer roiId;

    private Integer deliveryItemId;
    private Integer productId;
    private String productSku;
    private String productCode;
    private String productName;

    private Integer warehouseId;
    private String warehouseName;

    private BigDecimal returnedQty;
    private String uom;

    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private BigDecimal taxRate;

    private String reason;
    private String note;
}

