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
    private Integer poiId;
    private Integer productId;
    private String productName;
    private String productCode;
    private BigDecimal receivedQty;
    private BigDecimal acceptedQty;
    private String remark;
}

