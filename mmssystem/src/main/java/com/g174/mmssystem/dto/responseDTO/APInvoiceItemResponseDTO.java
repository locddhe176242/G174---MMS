package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class APInvoiceItemResponseDTO {
    private Integer apiId;
    private Integer apInvoiceId;
    private Integer poiId;
    private Integer griId;
    private String description;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal taxRate;
    private BigDecimal lineTotal;
    private String productName;
    private String productSku;
}
