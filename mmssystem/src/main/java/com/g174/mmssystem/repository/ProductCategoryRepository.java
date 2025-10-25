package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Integer> {

    @Query("SELECT pc FROM ProductCategory pc WHERE pc.deletedAt IS NULL")
    List<ProductCategory> findAllActive();

    @Query("SELECT pc FROM ProductCategory pc WHERE pc.deletedAt IS NULL AND pc.categoryId = :id")
    Optional<ProductCategory> findActiveById(@Param("id") Integer id);

    @Query("SELECT pc FROM ProductCategory pc WHERE pc.deletedAt IS NULL AND pc.name LIKE %:keyword%")
    List<ProductCategory> searchActive(@Param("keyword") String keyword);
}