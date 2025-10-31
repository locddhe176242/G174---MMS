package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.ProductCategoryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductCategoryResponseDTO;
import com.g174.mmssystem.entity.ProductCategory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductCategoryMapper {

    public ProductCategory toEntity(ProductCategoryRequestDTO dto) {
        if (dto == null) {
            return null;
        }

        return ProductCategory.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public ProductCategoryResponseDTO toResponseDTO(ProductCategory entity) {
        if (entity == null) {
            return null;
        }

        return ProductCategoryResponseDTO.builder()
                .categoryId(entity.getCategoryId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }

    public List<ProductCategoryResponseDTO> toResponseDTOList(List<ProductCategory> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public void updateEntityFromDTO(ProductCategory entity, ProductCategoryRequestDTO dto) {
        if (entity == null || dto == null) {
            return;
        }

        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setUpdatedAt(LocalDateTime.now());
    }
}
