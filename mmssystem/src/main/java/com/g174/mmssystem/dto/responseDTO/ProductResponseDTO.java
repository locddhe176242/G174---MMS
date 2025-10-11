package com.g174.mmssystem.dto.responseDTO;


import com.g174.mmssystem.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponseDTO {
    private Integer id;
    private String sku;
    private String name;
    private String description;
    private String uom;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private ProductStatus status;
    private String barcode;
    private String imageUrl;
    private String categoryName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
