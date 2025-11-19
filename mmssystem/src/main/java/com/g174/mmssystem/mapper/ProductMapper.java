package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.ProductRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductResponseDTO;
import com.g174.mmssystem.entity.Product;
import com.g174.mmssystem.entity.ProductCategory;
import com.g174.mmssystem.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductMapper {

    public Product toEntity(ProductRequestDTO dto, ProductCategory category, User createdBy) {
        if (dto == null) {
            return null;
        }

        Product.Status status = dto.getStatus() != null
                ? Product.Status.valueOf(dto.getStatus().toUpperCase())
                : Product.Status.IN_STOCK;

        return Product.builder()
                .sku(dto.getSku())
                .name(dto.getName())
                .description(dto.getDescription())
                .uom(dto.getUom())
                .size(dto.getSize())
                .sellingPrice(dto.getSellingPrice())
                .purchasePrice(dto.getPurchasePrice())
                .category(category)
                .imageUrl(dto.getImageUrl())
                .status(status)
                .barcode(dto.getBarcode())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(createdBy)
                .updatedBy(createdBy)
                .build();
    }

    public ProductResponseDTO toResponseDTO(Product entity) {
        if (entity == null) {
            return null;
        }

        return ProductResponseDTO.builder()
                .productId(entity.getProductId())
                .sku(entity.getSku())
                .name(entity.getName())
                .description(entity.getDescription())
                .uom(entity.getUom())
                .size(entity.getSize())
                .purchasePrice(entity.getPurchasePrice())
                .sellingPrice(entity.getSellingPrice())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .barcode(entity.getBarcode())
                .imageUrl(entity.getImageUrl())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getCategoryId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .totalQuantity(null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .createdBy(entity.getCreatedBy() != null ? entity.getCreatedBy().getEmail() : null)
                .updatedBy(entity.getUpdatedBy() != null ? entity.getUpdatedBy().getEmail() : null)
                .build();
    }

    public List<ProductResponseDTO> toResponseDTOList(List<Product> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public void updateEntityFromDTO(Product entity, ProductRequestDTO dto, ProductCategory category, User updatedBy) {
        if (entity == null || dto == null) {
            return;
        }

        if (dto.getSku() != null) entity.setSku(dto.getSku());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getUom() != null) entity.setUom(dto.getUom());
        if (dto.getSize() != null) entity.setSize(dto.getSize());
        if (dto.getSellingPrice() != null) entity.setSellingPrice(dto.getSellingPrice());
        if (dto.getPurchasePrice() != null) entity.setPurchasePrice(dto.getPurchasePrice());
        if (dto.getImageUrl() != null) entity.setImageUrl(dto.getImageUrl());
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            try {
                entity.setStatus(Product.Status.valueOf(dto.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
            }
        }
        if (dto.getBarcode() != null) entity.setBarcode(dto.getBarcode());
        if (category != null) entity.setCategory(category);
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(updatedBy);
    }
}
