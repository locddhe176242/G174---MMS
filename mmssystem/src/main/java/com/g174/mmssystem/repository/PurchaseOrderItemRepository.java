package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Integer> {
    
    @Query("SELECT poi FROM PurchaseOrderItem poi WHERE poi.purchaseOrder.orderId = :orderId")
    List<PurchaseOrderItem> findByOrderId(@Param("orderId") Integer orderId);

    @Query("SELECT poi FROM PurchaseOrderItem poi WHERE poi.product.productId = :productId")
    List<PurchaseOrderItem> findByProductId(@Param("productId") Integer productId);

    @Query("SELECT poi FROM PurchaseOrderItem poi WHERE poi.purchaseQuotationItem.pqItemId = :pqItemId")
    List<PurchaseOrderItem> findByPqItemId(@Param("pqItemId") Integer pqItemId);
}

