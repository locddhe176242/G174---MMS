package com.g174.mmssystem.dto.responseDTO;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PurchaseRequisitionItemResponseDTO {

    private Integer priId;
    private Integer requisitionId;
    private Integer productId;
    private String productCode;
    private String productName;
    private BigDecimal requestedQty;
    private LocalDate deliveryDate;
    private BigDecimal valuationPrice;
    private BigDecimal priceUnit;
    private String note;
}