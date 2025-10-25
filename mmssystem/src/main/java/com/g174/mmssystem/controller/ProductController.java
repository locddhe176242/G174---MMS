package com.g174.mmssystem.controller;

import com.g174.mmssystem.entity.Product;
import com.g174.mmssystem.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        try {
            List<Product> products = productRepository.findAllActive();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            log.error("Error getting all products", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Product>> getAllProductsPage(Pageable pageable) {
        try {
            Page<Product> products = productRepository.findAllActive(pageable);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            log.error("Error getting products page", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Integer id) {  // FIXED: Long -> Integer
        try {
            Product product = productRepository.findActiveById(id)
                    .orElse(null);
            if (product != null) {
                return ResponseEntity.ok(product);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error getting product with ID: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Product>> searchProducts(@RequestParam String keyword, Pageable pageable) {
        try {
            Page<Product> products = productRepository.searchActive(keyword, pageable);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            log.error("Error searching products with keyword: {}", keyword, e);
            return ResponseEntity.status(500).build();
        }
    }
}