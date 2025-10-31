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

    boolean existsByNameAndDeletedAtIsNull(String name);

    Optional<ProductCategory> findByNameAndDeletedAtIsNull(String name);

    @Query("SELECT c FROM ProductCategory c WHERE c.deletedAt IS NULL ORDER BY c.name ASC")
    List<ProductCategory> findAllActiveOrderByName();

    @Query("SELECT c FROM ProductCategory c WHERE c.deletedAt IS NULL AND c.name LIKE %:name% ORDER BY c.name ASC")
    List<ProductCategory> findByNameContainingIgnoreCaseAndDeletedAtIsNull(@Param("name") String name);

    @Query("SELECT c FROM ProductCategory c WHERE c.deletedAt IS NOT NULL ORDER BY c.name ASC")
    List<ProductCategory> findAllDeletedOrderByName();
}
