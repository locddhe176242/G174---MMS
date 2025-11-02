package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.ProductCategoryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductCategoryResponseDTO;
import com.g174.mmssystem.entity.ProductCategory;
import com.g174.mmssystem.mapper.ProductCategoryMapper;
import com.g174.mmssystem.repository.ProductCategoryRepository;
import com.g174.mmssystem.service.IService.IProductCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class ProductCategoryServiceImpl implements IProductCategoryService {
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductCategoryMapper productCategoryMapper;

    public ProductCategoryServiceImpl(ProductCategoryRepository productCategoryRepository, 
                                    ProductCategoryMapper productCategoryMapper) {
        this.productCategoryRepository = productCategoryRepository;
        this.productCategoryMapper = productCategoryMapper;
    }

    @Override
    public List<ProductCategoryResponseDTO> getProductCategories() {
        List<ProductCategory> categories = productCategoryRepository.findAllActiveOrderByName();
        return productCategoryMapper.toResponseDTOList(categories);
    }

    @Override
    public List<ProductCategoryResponseDTO> getDeletedProductCategories() {
        List<ProductCategory> categories = productCategoryRepository.findAllDeletedOrderByName();
        return productCategoryMapper.toResponseDTOList(categories);
    }

    @Override
    public ProductCategoryResponseDTO getProductCategory(Integer id) {
        ProductCategory category = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
        
        if (category.getDeletedAt() != null) {
            throw new RuntimeException("Danh mục đã bị xóa");
        }
        
        return productCategoryMapper.toResponseDTO(category);
    }

    @Override
    @Transactional
    public ProductCategoryResponseDTO createProductCategory(ProductCategoryRequestDTO request) {
        if (productCategoryRepository.existsByNameAndDeletedAtIsNull(request.getName())) {
            throw new RuntimeException("Tên danh mục đã tồn tại: " + request.getName());
        }

        ProductCategory category = productCategoryMapper.toEntity(request);
        ProductCategory savedCategory = productCategoryRepository.save(category);
        log.info("Tạo danh mục mới: {}", savedCategory.getName());
        
        return productCategoryMapper.toResponseDTO(savedCategory);
    }

    @Override
    @Transactional
    public ProductCategoryResponseDTO updateProductCategory(Integer id, ProductCategoryRequestDTO request) {
        ProductCategory category = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
        
        if (category.getDeletedAt() != null) {
            throw new RuntimeException("Không thể cập nhật danh mục đã bị xóa");
        }

        if (!category.getName().equals(request.getName()) && 
            productCategoryRepository.existsByNameAndDeletedAtIsNull(request.getName())) {
            throw new RuntimeException("Tên danh mục đã tồn tại: " + request.getName());
        }

        productCategoryMapper.updateEntityFromDTO(category, request);
        ProductCategory updatedCategory = productCategoryRepository.save(category);
        log.info("Cập nhật danh mục: {}", updatedCategory.getName());
        
        return productCategoryMapper.toResponseDTO(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteProductCategory(Integer id) {
        ProductCategory category = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
        
        if (category.getDeletedAt() != null) {
            throw new RuntimeException("Danh mục đã bị xóa");
        }

        category.setDeletedAt(LocalDateTime.now());
        productCategoryRepository.save(category);
        log.info("Xóa danh mục: {}", category.getName());
    }

    @Override
    @Transactional
    public void restoreProductCategory(Integer id) {
        ProductCategory category = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
        
        if (category.getDeletedAt() == null) {
            throw new RuntimeException("Danh mục chưa bị xóa");
        }

        category.setDeletedAt(null);
        productCategoryRepository.save(category);
        log.info("Khôi phục danh mục: {}", category.getName());
    }
}
