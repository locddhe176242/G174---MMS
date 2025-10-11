package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.responseDTO.ProductCategoryResponseDTO;
import com.g174.mmssystem.entity.ProductCategory;
import com.g174.mmssystem.repository.ProductCategoryRepository;
import com.g174.mmssystem.service.IService.IProductCategoryService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductCategoryServiceImpl implements IProductCategoryService {
    private final ProductCategoryRepository productCategoryRepository;

    public ProductCategoryServiceImpl(ProductCategoryRepository productCategoryRepository) {
        this.productCategoryRepository = productCategoryRepository;
    }

    @Override
    public List<ProductCategoryResponseDTO> getProductCategories() {
        List<ProductCategory> categories = productCategoryRepository.findAll();

        return categories.stream()
                .filter(category -> category.getDeletedAt() == null)
                .map(category -> ProductCategoryResponseDTO.builder()
                        .categoryId(category.getCategoryId())
                        .name(category.getName())
                        .deletedAt(category.getDeletedAt())
                        .build())
                .toList();
    }
}
