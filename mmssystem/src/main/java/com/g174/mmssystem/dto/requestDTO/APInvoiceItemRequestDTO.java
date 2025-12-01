package com.g174.mmssystem.dto.requestDTO;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class APInvoiceItemRequestDTO {
    private Integer poiId;
    private Integer griId;
    private String description;
    private String uom;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal taxRate;
    private BigDecimal lineTotal;
}
