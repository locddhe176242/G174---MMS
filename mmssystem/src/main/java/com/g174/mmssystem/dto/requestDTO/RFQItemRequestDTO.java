package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RFQItemRequestDTO {
    private Long priId;
    
    private Integer productId;
    
    private String productCode;
    
    private String productName;
    
    private String spec;
    
    private String uom;
    
    @NotNull(message = "Số lượng là bắt buộc")
    private BigDecimal quantity;
    
    private LocalDate deliveryDate;
    
    private BigDecimal targetPrice;
    
    private BigDecimal priceUnit;
    
    private String note;
}

