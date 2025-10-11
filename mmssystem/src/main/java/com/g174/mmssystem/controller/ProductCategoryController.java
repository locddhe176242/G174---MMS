package com.g174.mmssystem.controller;

import com.g174.mmssystem.constant.Constant;
import com.g174.mmssystem.service.IService.IProductCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Constant.API_CATEGORY)
@RequiredArgsConstructor
@Slf4j
public class ProductCategoryController {
    private final IProductCategoryService productCategoryService;

    @GetMapping
    public ResponseEntity getProductCategories(
    ) {
        return new ResponseEntity<>(productCategoryService.getProductCategories(),
                HttpStatus.OK);
    }
}
