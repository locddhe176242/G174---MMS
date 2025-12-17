package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptItemResponseDTO {
    private Integer griId;
    private Integer receiptId;

    // For Purchase flow
    private Integer idiId;
    // For SalesReturn flow
    private Integer roiId;
    
    private Integer productId;
    private String productName;
    private String productCode;
    private BigDecimal receivedQty;
    private BigDecimal acceptedQty;
    private String remark;
    
    // Additional fields from PurchaseOrderItem for invoice creation
    private String uom;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal taxRate;
}

