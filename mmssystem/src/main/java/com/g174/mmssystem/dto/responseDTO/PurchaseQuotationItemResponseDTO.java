package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseQuotationItemResponseDTO {
    private Integer pqItemId;
    private Integer pqId;
    private Integer rfqItemId;
    private Integer productId;
    private String productName;
    private String productCode;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;
    private String remark;
}

