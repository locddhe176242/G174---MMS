package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.constant.Constant;
import com.g174.mmssystem.dto.requestDTO.ProductRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductResponseDTO;
import com.g174.mmssystem.entity.Product;
import com.g174.mmssystem.entity.ProductCategory;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.enums.ProductStatus;
import com.g174.mmssystem.repository.ProductCategoryRepository;
import com.g174.mmssystem.repository.ProductRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IProductService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements IProductService {
    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final UserRepository userRepository;

    public ProductServiceImpl(ProductRepository productRepository, ProductCategoryRepository productCategoryRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.productCategoryRepository = productCategoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Object getProducts(String fieldSearch, String sortOrder, String sortBy, int size, int page) {
        Sort sort = Sort.by(sortBy == null || sortBy.isEmpty() ? "createdAt" : sortBy);
        sort = Constant.DESC.equalsIgnoreCase(sortOrder) ? sort.descending() : sort.ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> products = productRepository.findAll(pageable);

        List<Product> filteredList = products.getContent()
                .stream()
                .filter(p -> p.getDeletedAt() == null)
                .toList();

        Page<Product> filteredPage = new PageImpl<>(
                filteredList,
                pageable,
                products.getTotalElements()
        );

        Page<ProductResponseDTO> dtoPage = filteredPage.map(this::convertToDTO);

        return dtoPage;
    }

    @Override
    public ProductResponseDTO getProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(Constant.NOT_FOUND_PRODUCT + id));

        if (product.getDeletedAt() != null) {
            throw new EntityNotFoundException(Constant.NOT_FOUND_PRODUCT + id);
        }

        return convertToDTO(product);
    }

    @Override
    @Transactional
    public ProductResponseDTO createProduct(ProductRequestDTO dto) {

        if (productRepository.existsBySku(dto.getSku())) {
            throw new IllegalArgumentException(Constant.SKU_EXISTED);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new EntityNotFoundException(Constant.USER_NOT_FOUND + username));

        ProductCategory category = productCategoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException(Constant.NOT_FOUND_CATEGORY));

        ProductStatus status = dto.getStatus() != null ? dto.getStatus() : ProductStatus.IN_STOCK;

        Product product = Product.builder()
                .sku(dto.getSku())
                .name(dto.getName())
                .barcode(dto.getBarcode())
                .description(dto.getDescription())
                .uom(dto.getUom())
                .sellingPrice(dto.getSellingPrice())
                .purchasePrice(dto.getPurchasePrice())
                .category(category)
                .imageUrl(dto.getImageUrl())
                .status(status)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(user)
                .updatedBy(user)
                .build();

        Product saved = productRepository.save(product);

        return ProductResponseDTO.builder()
                .id(saved.getProductId())
                .sku(saved.getSku())
                .name(saved.getName())
                .description(saved.getDescription())
                .uom(saved.getUom())
                .sellingPrice(saved.getSellingPrice())
                .purchasePrice(saved.getPurchasePrice())
                .barcode(saved.getBarcode())
                .imageUrl(saved.getImageUrl())
                .status(saved.getStatus())
                .categoryName(saved.getCategory().getName())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .createdBy(saved.getCreatedBy().getUsername())
                .updatedBy(saved.getUpdatedBy().getUsername())
                .build();
    }

    @Override
    @Transactional
    public ProductResponseDTO updateProduct(Integer id, ProductRequestDTO dto) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(Constant.NOT_FOUND_PRODUCT + id));

        if (product.getDeletedAt() != null) {
            throw new EntityNotFoundException(Constant.NOT_FOUND_PRODUCT + id);
        }

        if (dto.getSku() != null) {
            String newSku = dto.getSku().trim();
            String currentSku = product.getSku().trim();

            if (!newSku.equalsIgnoreCase(currentSku)) {
                boolean exists = productRepository.existsBySku(newSku);
                if (exists) {
                    throw new IllegalArgumentException(Constant.SKU_EXISTED);
                }
                product.setSku(newSku);
            }
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new EntityNotFoundException(Constant.USER_NOT_FOUND));

        if (dto.getName() != null) product.setName(dto.getName());
        if (dto.getDescription() != null) product.setDescription(dto.getDescription());
        if (dto.getUom() != null) product.setUom(dto.getUom());
        if (dto.getSellingPrice() != null) product.setSellingPrice(dto.getSellingPrice());
        if (dto.getPurchasePrice() != null) product.setPurchasePrice(dto.getPurchasePrice());
        if (dto.getImageUrl() != null) product.setImageUrl(dto.getImageUrl());
        if (dto.getStatus() != null) product.setStatus(dto.getStatus());

        if (dto.getCategoryId() != null) {
            ProductCategory category = productCategoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException(Constant.NOT_FOUND_CATEGORY));
            product.setCategory(category);
        }

        product.setUpdatedAt(LocalDateTime.now());
        product.setUpdatedBy(user);

        Product saved = productRepository.save(product);

        return ProductResponseDTO.builder()
                .id(saved.getProductId())
                .sku(saved.getSku())
                .name(saved.getName())
                .description(saved.getDescription())
                .uom(saved.getUom())
                .sellingPrice(saved.getSellingPrice())
                .purchasePrice(saved.getPurchasePrice())
                .barcode(saved.getBarcode())
                .imageUrl(saved.getImageUrl())
                .status(saved.getStatus())
                .categoryName(saved.getCategory() != null ? saved.getCategory().getName() : null)
                .categoryName(saved.getCategory() != null ? saved.getCategory().getName() : null)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .createdBy(saved.getCreatedBy() != null ? saved.getCreatedBy().getUsername() : null)
                .updatedBy(saved.getUpdatedBy() != null ? saved.getUpdatedBy().getUsername() : null)
                .build();
    }

    private ProductResponseDTO convertToDTO(Product product) {
        return ProductResponseDTO.builder()
                .id(product.getProductId())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .uom(product.getUom())
                .purchasePrice(product.getPurchasePrice())
                .sellingPrice(product.getSellingPrice())
                .status(product.getStatus())
                .barcode(product.getBarcode())
                .imageUrl(product.getImageUrl())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .createdBy(product.getCreatedBy() != null ? product.getCreatedBy().getUsername() : null)
                .updatedBy(product.getUpdatedBy() != null ? product.getUpdatedBy().getUsername() : null)
                .build();
    }
}
