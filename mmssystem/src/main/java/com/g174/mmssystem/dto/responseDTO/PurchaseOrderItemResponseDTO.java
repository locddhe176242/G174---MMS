package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderItemResponseDTO {
    private Integer poiId;
    private Integer orderId;
    private Integer pqItemId;
    private Integer productId;
    private String productName;
    private String productCode;
    private String uom;
    private BigDecimal quantity;
    private BigDecimal receivedQty;  // Số lượng đã nhập kho
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;
    private LocalDate deliveryDate;
    private String note;
}

