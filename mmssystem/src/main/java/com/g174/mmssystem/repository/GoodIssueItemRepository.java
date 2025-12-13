package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.GoodIssueItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodIssueItemRepository extends JpaRepository<GoodIssueItem, Integer> {
    
    @Query("SELECT gii FROM GoodIssueItem gii WHERE gii.goodIssue.issueId = :issueId")
    List<GoodIssueItem> findByIssueId(@Param("issueId") Integer issueId);

    @Query("SELECT gii FROM GoodIssueItem gii WHERE gii.product.productId = :productId")
    List<GoodIssueItem> findByProductId(@Param("productId") Integer productId);

    @Query("SELECT gii FROM GoodIssueItem gii WHERE gii.deliveryItem.diId = :diId")
    List<GoodIssueItem> findByDeliveryItemId(@Param("diId") Integer diId);
}

