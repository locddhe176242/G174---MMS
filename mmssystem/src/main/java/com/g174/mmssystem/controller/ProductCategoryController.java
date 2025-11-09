package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.ProductCategoryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductCategoryResponseDTO;
import com.g174.mmssystem.service.IService.IProductCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/category")
@RequiredArgsConstructor
@Slf4j
public class ProductCategoryController {
    private final IProductCategoryService productCategoryService;

    @GetMapping
    public ResponseEntity<List<ProductCategoryResponseDTO>> getProductCategories() {
        try {
            List<ProductCategoryResponseDTO> categories = productCategoryService.getProductCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách danh mục: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductCategoryResponseDTO> getProductCategory(@PathVariable Integer id) {
        try {
            ProductCategoryResponseDTO category = productCategoryService.getProductCategory(id);
            return ResponseEntity.ok(category);
        } catch (RuntimeException e) {
            log.error("Lỗi khi lấy danh mục ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh mục ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('PURCHASER')")
    public ResponseEntity<ProductCategoryResponseDTO> createProductCategory(@Valid @RequestBody ProductCategoryRequestDTO request) {
        try {
            ProductCategoryResponseDTO createdCategory = productCategoryService.createProductCategory(request);
            log.info("Tạo danh mục mới thành công: {}", createdCategory.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
        } catch (RuntimeException e) {
            log.error("Lỗi khi tạo danh mục: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lỗi khi tạo danh mục: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('PURCHASER')")
    public ResponseEntity<ProductCategoryResponseDTO> updateProductCategory(
            @PathVariable Integer id, 
            @Valid @RequestBody ProductCategoryRequestDTO request) {
        try {
            ProductCategoryResponseDTO updatedCategory = productCategoryService.updateProductCategory(id, request);
            log.info("Cập nhật danh mục ID {} thành công: {}", id, updatedCategory.getName());
            return ResponseEntity.ok(updatedCategory);
        } catch (RuntimeException e) {
            log.error("Lỗi khi cập nhật danh mục ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật danh mục ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('PURCHASER')")
    public ResponseEntity<Void> deleteProductCategory(@PathVariable Integer id) {
        try {
            productCategoryService.deleteProductCategory(id);
            log.info("Xóa danh mục ID {} thành công", id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Lỗi khi xóa danh mục ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lỗi khi xóa danh mục ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasRole('MANAGER') or hasRole('PURCHASER')")
    public ResponseEntity<Void> restoreProductCategory(@PathVariable Integer id) {
        try {
            productCategoryService.restoreProductCategory(id);
            log.info("Khôi phục danh mục ID {} thành công", id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Lỗi khi khôi phục danh mục ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lỗi khi khôi phục danh mục ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<ProductCategoryResponseDTO>> getDeletedProductCategories() {
        try {
            List<ProductCategoryResponseDTO> categories = productCategoryService.getDeletedProductCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách danh mục đã xóa: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
