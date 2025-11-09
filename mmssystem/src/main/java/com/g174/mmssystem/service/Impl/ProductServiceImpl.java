package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.ProductRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ProductResponseDTO;
import com.g174.mmssystem.entity.Product;
import com.g174.mmssystem.entity.ProductCategory;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.mapper.ProductMapper;
import com.g174.mmssystem.repository.ProductCategoryRepository;
import com.g174.mmssystem.repository.ProductRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class ProductServiceImpl implements IProductService {
    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final UserRepository userRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(ProductRepository productRepository,
                              ProductCategoryRepository productCategoryRepository,
                              UserRepository userRepository,
                              ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productCategoryRepository = productCategoryRepository;
        this.userRepository = userRepository;
        this.productMapper = productMapper;
    }

    @Override
    public List<ProductResponseDTO> getProducts() {
        List<Product> products = productRepository.findAllActiveOrderByCreatedAt();
        return productMapper.toResponseDTOList(products);
    }

    @Override
    public List<ProductResponseDTO> searchProducts(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getProducts();
        }
        List<Product> products = productRepository.searchActiveProducts(keyword.trim());
        return productMapper.toResponseDTOList(products);
    }

    @Override
    public List<ProductResponseDTO> getDeletedProducts() {
        List<Product> products = productRepository.findAllDeletedOrderByCreatedAt();
        return productMapper.toResponseDTOList(products);
    }

    @Override
    public ProductResponseDTO getProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));

        if (product.getDeletedAt() != null) {
            throw new RuntimeException("Sản phẩm đã bị xóa");
        }

        return productMapper.toResponseDTO(product);
    }

    @Override
    @Transactional
    public ProductResponseDTO createProduct(ProductRequestDTO request) {
        if (productRepository.existsBySkuAndDeletedAtIsNull(request.getSku())) {
            throw new RuntimeException("SKU đã tồn tại: " + request.getSku());
        }

        ProductCategory category = productCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + request.getCategoryId()));

        User user = getCurrentUser();
        Product product = productMapper.toEntity(request, category, user);
        Product savedProduct = productRepository.save(product);
        return productMapper.toResponseDTO(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponseDTO updateProduct(Integer id, ProductRequestDTO request) {
        if (id == null) {
            throw new RuntimeException("ID sản phẩm không được để trống");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));

        if (product.getDeletedAt() != null) {
            throw new RuntimeException("Không thể cập nhật sản phẩm đã bị xóa");
        }

        if (request.getSku() != null && !product.getSku().equals(request.getSku()) &&
                productRepository.existsBySkuAndDeletedAtIsNull(request.getSku())) {
            throw new RuntimeException("SKU đã tồn tại: " + request.getSku());
        }

        ProductCategory category = null;
        if (request.getCategoryId() != null) {
            category = productCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + request.getCategoryId()));
        }

        User user = getCurrentUser();
        productMapper.updateEntityFromDTO(product, request, category, user);
        Product updatedProduct = productRepository.save(product);
        return productMapper.toResponseDTO(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));

        if (product.getDeletedAt() != null) {
            throw new RuntimeException("Sản phẩm đã bị xóa");
        }

        product.setDeletedAt(LocalDateTime.now());
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void restoreProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));

        if (product.getDeletedAt() == null) {
            throw new RuntimeException("Sản phẩm chưa bị xóa");
        }

        product.setDeletedAt(null);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public String uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File trống");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("File phải là hình ảnh");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Kích thước file phải nhỏ hơn 5MB");
        }

        try {
            Path uploadsDir = Paths.get("uploads/products");
            Files.createDirectories(uploadsDir);

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String filename = UUID.randomUUID().toString() + extension;

            Path filePath = uploadsDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            return "/uploads/products/" + filename;

        } catch (IOException e) {
            throw new RuntimeException("Tải lên ảnh sản phẩm thất bại: " + e.getMessage(), e);
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));
    }
}