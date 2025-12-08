package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    boolean existsBySkuAndDeletedAtIsNull(String sku);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    List<Product> findAllActiveOrderByCreatedAt();

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND (p.name LIKE %:keyword% OR p.sku LIKE %:keyword%) ORDER BY p.createdAt DESC")
    List<Product> searchActiveProducts(@Param("keyword") String keyword);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NOT NULL ORDER BY p.createdAt DESC")
    List<Product> findAllDeletedOrderByCreatedAt();
}