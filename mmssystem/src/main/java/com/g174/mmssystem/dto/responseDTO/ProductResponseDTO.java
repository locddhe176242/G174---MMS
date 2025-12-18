package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
    private String imageUrl; // Legacy field - first image URL
    private List<String> imageUrls; // All image URLs as array
    private Integer categoryId;
    private String categoryName;
    private java.math.BigDecimal totalQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private String createdBy;
    private String updatedBy;
}