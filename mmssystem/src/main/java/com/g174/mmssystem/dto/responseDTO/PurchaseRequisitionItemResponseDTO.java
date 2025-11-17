package com.g174.mmssystem.dto.responseDTO;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionItemResponseDTO {
    private Long priId;
    private Long productId;
    private String productName;
    private BigDecimal requestedQty;
    private String unit;
    private LocalDate deliveryDate;
    private String note;
    private String createdByName;
    private String updatedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
