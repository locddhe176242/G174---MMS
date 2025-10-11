package com.g174.mmssystem.controller;

import com.g174.mmssystem.constant.Constant;
import com.g174.mmssystem.dto.requestDTO.ProductRequestDTO;
import com.g174.mmssystem.service.IService.IProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping(Constant.API_PRODUCT)
@RequiredArgsConstructor
@Slf4j
public class ProductController {
    private final IProductService productService;

    @GetMapping
    public ResponseEntity getProducts(
            @RequestParam(defaultValue = Constant.PAGE) int page,
            @RequestParam(defaultValue = Constant.SIZE) int size,
            @RequestParam(required = false, defaultValue = "productId") String sortBy,
            @RequestParam(required = false, defaultValue = Constant.ASC) String sortOrder,
            @RequestParam(required = false) String fieldSearch
    ) {
        return new ResponseEntity<>(productService.getProducts(fieldSearch, sortOrder, sortBy, size, page),
                HttpStatus.OK);
    }

    @GetMapping(value = Constant.ID_PATH)
    public ResponseEntity getProductDetail(
            @PathVariable(value = Constant.ID) Integer id
    ) {
        return new ResponseEntity<>(productService.getProduct(id),
                HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity createProduct(
            @Valid @RequestBody ProductRequestDTO ProductRequest
    ) {
        return new ResponseEntity<>(productService.createProduct(ProductRequest),
                HttpStatus.OK);
    }

    @PutMapping(value = Constant.ID_PATH)
    public ResponseEntity updateProduct(
            @PathVariable(value = Constant.ID) Integer id,
            @Valid @RequestBody ProductRequestDTO ProductRequest
    ) {
        return new ResponseEntity<>(productService.updateProduct(id, ProductRequest),
                HttpStatus.OK);
    }
}
