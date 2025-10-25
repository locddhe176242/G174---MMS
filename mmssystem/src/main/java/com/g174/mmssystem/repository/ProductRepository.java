package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {  // FIXED: Long -> Integer

    Optional<Product> findBySku(String sku);

    boolean existsBySkuAndDeletedAtIsNull(String sku);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL")
    Page<Product> findAllActive(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL")
    List<Product> findAllActive();  // Thêm method này cho frontend

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND " +
            "(p.sku LIKE %:keyword% OR p.name LIKE %:keyword% OR p.description LIKE %:keyword%)")
    Page<Product> searchActive(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND p.status = :status")
    Page<Product> findByStatus(@Param("status") Product.ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND p.categoryId = :categoryId")
    Page<Product> findByCategoryId(@Param("categoryId") Integer categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND p.productId = :id")
    Optional<Product> findActiveById(@Param("id") Integer id);  // FIXED: Long -> Integer
}