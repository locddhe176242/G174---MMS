package com.g174.mmssystem.dto.responseDTO;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionItemResponseDTO {
    private Long priId;
    private Long productId;
    private String productCode;
    private String productName;
    private String uom;
    private BigDecimal requestedQty;
    private BigDecimal targetUnitPrice;
    private String note;
}
