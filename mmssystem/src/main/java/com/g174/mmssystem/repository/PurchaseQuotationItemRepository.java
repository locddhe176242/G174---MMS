package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseQuotationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseQuotationItemRepository extends JpaRepository<PurchaseQuotationItem, Integer> {
    
    @Query("SELECT pqi FROM PurchaseQuotationItem pqi WHERE pqi.purchaseQuotation.pqId = :pqId")
    List<PurchaseQuotationItem> findByPqId(@Param("pqId") Integer pqId);

    @Query("SELECT pqi FROM PurchaseQuotationItem pqi WHERE pqi.rfqItem.rfqItemId = :rfqItemId")
    List<PurchaseQuotationItem> findByRfqItemId(@Param("rfqItemId") Integer rfqItemId);

    @Query("SELECT pqi FROM PurchaseQuotationItem pqi WHERE pqi.product.productId = :productId")
    List<PurchaseQuotationItem> findByProductId(@Param("productId") Integer productId);
}

