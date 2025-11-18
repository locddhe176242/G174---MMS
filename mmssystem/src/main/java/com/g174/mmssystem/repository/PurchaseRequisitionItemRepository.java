package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRequisitionItemRepository extends JpaRepository<PurchaseRequisitionItem, Integer> {
    
    @Query("SELECT pri FROM PurchaseRequisitionItem pri WHERE pri.purchaseRequisition.requisitionId = :requisitionId")
    List<PurchaseRequisitionItem> findByRequisitionId(@Param("requisitionId") Long requisitionId);

    @Query("SELECT pri FROM PurchaseRequisitionItem pri WHERE pri.product.productId = :productId")
    List<PurchaseRequisitionItem> findByProductId(@Param("productId") Integer productId);
}

