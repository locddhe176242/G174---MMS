package com.g174.mmssystem.dto.responseDTO;

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
    private Integer productId;
    private String sku;
    private String name;
    private String description;
    private String uom;
    private Float size;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private String status;
    private String barcode;
    private String imageUrl;
    private Integer categoryId;
    private String categoryName;
    private Integer quantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private String createdBy;
    private String updatedBy;
}
