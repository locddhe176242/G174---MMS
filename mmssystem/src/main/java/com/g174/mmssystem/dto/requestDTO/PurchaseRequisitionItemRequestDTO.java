package com.g174.mmssystem.dto.requestDTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionItemRequestDTO {
    private Integer priId;
    private Integer productId;
    private String productName;
    
    // Validation được xử lý ở service level dựa trên status của PR
    // Nếu PR status = Draft: cho phép requestedQty và deliveryDate null
    // Nếu PR status != Draft: bắt buộc phải có requestedQty > 0 và deliveryDate
    private BigDecimal requestedQty;
    
    private String unit;
    
    // Validation được xử lý ở service level dựa trên status của PR
    private LocalDate deliveryDate;
    
    private String note;
}

