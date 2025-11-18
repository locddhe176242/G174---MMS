package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RFQItemResponseDTO {
    private Integer rfqItemId;
    private Integer rfqId;
    private Long priId;
    private Integer productId;
    private String productCode;
    private String productName;
    private String spec;
    private String uom;
    private BigDecimal quantity;
    private LocalDate deliveryDate;
    private BigDecimal targetPrice;
    private BigDecimal priceUnit;
    private String note;
}

