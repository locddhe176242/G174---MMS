package com.g174.mmssystem.dto.responseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CreditNoteItemResponseDTO {

    private Integer cniId;

    private Integer productId;
    private String productSku;
    private String productCode;
    private String productName;
    private String uom;

    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;

    private String note;
}

