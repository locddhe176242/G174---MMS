package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.ProductRequestDTO;
import jakarta.validation.Valid;

public interface IProductService {
    Object getProducts(String fieldSearch, String sortOrder, String sortBy, int size, int page);

    Object getProduct(Integer id);

    Object createProduct(@Valid ProductRequestDTO productRequest);

    Object updateProduct(Integer id, @Valid ProductRequestDTO productRequest);
}
