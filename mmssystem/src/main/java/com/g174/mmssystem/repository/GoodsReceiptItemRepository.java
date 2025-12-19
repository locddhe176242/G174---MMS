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

    // Query by Purchase Order Item directly (new flow: PO → GR)
    @Query("SELECT gri FROM GoodsReceiptItem gri WHERE gri.purchaseOrderItem.poiId = :poiId")
    List<GoodsReceiptItem> findByPoiId(@Param("poiId") Integer poiId);
    
    // Query by Return Order Item for Sales Return flow
    @Query("SELECT gri FROM GoodsReceiptItem gri " +
           "WHERE gri.returnOrderItem.roiId = :roiId " +
           "AND gri.goodsReceipt.status = 'Approved' " +
           "AND gri.goodsReceipt.sourceType = 'SalesReturn' " +
           "AND gri.goodsReceipt.deletedAt IS NULL")
    List<GoodsReceiptItem> findApprovedByRoiId(@Param("roiId") Integer roiId);
}

