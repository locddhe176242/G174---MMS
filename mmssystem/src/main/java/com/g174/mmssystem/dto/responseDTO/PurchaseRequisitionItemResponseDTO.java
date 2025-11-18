package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionItemResponseDTO {
    private Integer priId;
    private Integer productId;
    private String productName;
    private String productCode;
    private BigDecimal requestedQty;
    private String unit;
    private LocalDate deliveryDate;
    private String note;
}

