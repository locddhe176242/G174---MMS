package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStockResponseDTO {
    private Integer warehouseId;
    private String warehouseCode;
    private String warehouseName;
    private Integer productId;
    private String productSku;
    private String productName;
    private String productUom;
    private BigDecimal productSellingPrice;
    private BigDecimal productPurchasePrice;
    private String productCategoryName;
    private String productStatus;
    private BigDecimal quantity;
}
