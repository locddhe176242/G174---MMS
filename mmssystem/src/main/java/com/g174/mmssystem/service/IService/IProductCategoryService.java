package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.ProductCategoryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductCategoryResponseDTO;
import jakarta.validation.Valid;

import java.util.List;

public interface IProductCategoryService {

    List<ProductCategoryResponseDTO> getProductCategories();

    List<ProductCategoryResponseDTO> getDeletedProductCategories();

    ProductCategoryResponseDTO getProductCategory(Integer id);

    ProductCategoryResponseDTO createProductCategory(@Valid ProductCategoryRequestDTO request);
 
    ProductCategoryResponseDTO updateProductCategory(Integer id, @Valid ProductCategoryRequestDTO request);

    void deleteProductCategory(Integer id);

    void restoreProductCategory(Integer id);
}
