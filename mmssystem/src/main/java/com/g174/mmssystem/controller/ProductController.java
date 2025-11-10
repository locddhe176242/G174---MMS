package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.ProductRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductResponseDTO;
import com.g174.mmssystem.service.IService.IProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product")
@RequiredArgsConstructor
@Slf4j
public class ProductController {
    private final IProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductResponseDTO>> getProducts(
            @RequestParam(required = false) String keyword) {
        try {
            List<ProductResponseDTO> products;
            if (keyword != null && !keyword.trim().isEmpty()) {
                products = productService.searchProducts(keyword);
            } else {
                products = productService.getProducts();
            }
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách sản phẩm: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProduct(@PathVariable Integer id) {
        try {
            ProductResponseDTO product = productService.getProduct(id);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            log.error("Lỗi khi lấy sản phẩm ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Lỗi khi lấy sản phẩm ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "CREATE_PRODUCT",
            activityType = "PRODUCT_MANAGEMENT",
            description = "Tạo sản phẩm mới: #{#request.name}",
            entityId = "#{#result.productId}"
    )
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductRequestDTO request) {
        try {
            ProductResponseDTO createdProduct = productService.createProduct(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
        } catch (RuntimeException e) {
            log.error("Lỗi khi tạo sản phẩm: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Lỗi khi tạo sản phẩm: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi server khi tạo sản phẩm: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "UPDATE_PRODUCT",
            activityType = "PRODUCT_MANAGEMENT",
            description = "Cập nhật sản phẩm: #{#request.name}",
            entityId = "#{#id}"
    )
    public ResponseEntity<?> updateProduct(
            @PathVariable(required = false) Integer id,
            @RequestBody ProductRequestDTO request) {
        try {
            if (id == null) {
                log.error("Lỗi: ID sản phẩm không được để trống");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "ID sản phẩm không được để trống");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            ProductResponseDTO updatedProduct = productService.updateProduct(id, request);
            return ResponseEntity.ok(updatedProduct);
        } catch (RuntimeException e) {
            log.error("Lỗi khi cập nhật sản phẩm ID {}: {}", id, e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật sản phẩm ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi server khi cập nhật sản phẩm: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "DELETE_PRODUCT",
            activityType = "PRODUCT_MANAGEMENT",
            description = "Xóa sản phẩm ID: #{#id}",
            entityId = "#{#id}"
    )
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Lỗi khi xóa sản phẩm ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lỗi khi xóa sản phẩm ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "RESTORE_PRODUCT",
            activityType = "PRODUCT_MANAGEMENT",
            description = "Khôi phục sản phẩm ID: #{#id}",
            entityId = "#{#id}"
    )
    public ResponseEntity<Void> restoreProduct(@PathVariable Integer id) {
        try {
            productService.restoreProduct(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Lỗi khi khôi phục sản phẩm ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lỗi khi khôi phục sản phẩm ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<ProductResponseDTO>> getDeletedProducts() {
        try {
            List<ProductResponseDTO> products = productService.getDeletedProducts();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách sản phẩm đã xóa: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/upload-image")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "UPLOAD_PRODUCT_IMAGE",
            activityType = "PRODUCT_MANAGEMENT",
            description = "Upload ảnh sản phẩm: #{#file.originalFilename}"
    )
    public ResponseEntity<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = productService.uploadImage(file);
            Map<String, Object> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            response.put("message", "Upload ảnh sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Lỗi khi upload ảnh sản phẩm: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("Lỗi khi upload ảnh sản phẩm: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Lỗi server khi upload ảnh");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}