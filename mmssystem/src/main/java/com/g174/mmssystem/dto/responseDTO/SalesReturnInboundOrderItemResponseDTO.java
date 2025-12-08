package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesReturnInboundOrderItemResponseDTO {

    private Integer sriiId;
    private Integer sriId;

    private Integer roiId;
    private Integer productId;
    private String productCode;
    private String productName;

    private Integer warehouseId;
    private String warehouseName;

    private BigDecimal plannedQty;
    private String uom;

    private String note;
}


