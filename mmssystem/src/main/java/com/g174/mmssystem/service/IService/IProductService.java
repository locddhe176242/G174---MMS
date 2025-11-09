package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.ProductRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductResponseDTO;
import jakarta.validation.Valid;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IProductService {

    List<ProductResponseDTO> getProducts();

    List<ProductResponseDTO> searchProducts(String keyword);

    List<ProductResponseDTO> getDeletedProducts();

    ProductResponseDTO getProduct(Integer id);

    ProductResponseDTO createProduct(@Valid ProductRequestDTO request);

    ProductResponseDTO updateProduct(Integer id, @Valid ProductRequestDTO request);

    void deleteProduct(Integer id);

    void restoreProduct(Integer id);

    String uploadImage(MultipartFile file);
}
