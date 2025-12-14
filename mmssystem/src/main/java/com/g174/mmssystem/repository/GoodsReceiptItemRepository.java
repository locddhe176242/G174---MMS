package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.GoodsReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptItemRepository extends JpaRepository<GoodsReceiptItem, Integer> {
    
    @Query("SELECT gri FROM GoodsReceiptItem gri WHERE gri.goodsReceipt.receiptId = :receiptId")
    List<GoodsReceiptItem> findByReceiptId(@Param("receiptId") Integer receiptId);

    @Query("SELECT gri FROM GoodsReceiptItem gri WHERE gri.product.productId = :productId")
    List<GoodsReceiptItem> findByProductId(@Param("productId") Integer productId);

    @Query("SELECT gri FROM GoodsReceiptItem gri WHERE gri.purchaseOrderItem.poiId = :poiId")
    List<GoodsReceiptItem> findByPoiId(@Param("poiId") Integer poiId);
}

