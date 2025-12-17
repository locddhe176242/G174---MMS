package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundDeliveryItemResponseDTO {

    private Integer idiId;
    private Integer inboundDeliveryId;
    private Integer poiId;
    private Integer productId;
    private String productSku;
    private String productCode; // Alias for productSku
    private String productName;
    private BigDecimal orderedQty; // From PurchaseOrderItem
    private BigDecimal expectedQty;
    private BigDecimal receivedQty; // Total received quantity from Goods Receipts
    private String uom;
    private String notes;
}
