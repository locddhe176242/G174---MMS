package com.g174.mmssystem.dto.responseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SalesOrderItemResponseDTO {
    private Integer soiId;
    private Integer productId;
    private String productSku;
    private String productName;
    private Integer warehouseId;
    private String warehouseName;
    private String uom;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;
    private String note;
}
