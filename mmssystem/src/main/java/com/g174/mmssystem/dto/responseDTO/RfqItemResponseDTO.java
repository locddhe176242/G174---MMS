package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfqItemResponseDTO {
    private Integer rfqItemId;
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


