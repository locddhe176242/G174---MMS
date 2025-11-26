package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.GoodsReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Integer> {
    
    Optional<GoodsReceipt> findByReceiptNo(String receiptNo);
    
    boolean existsByReceiptNo(String receiptNo);

    @Query("SELECT gr FROM GoodsReceipt gr WHERE gr.deletedAt IS NULL")
    List<GoodsReceipt> findAllActive();

    @Query("SELECT gr FROM GoodsReceipt gr WHERE gr.deletedAt IS NULL")
    Page<GoodsReceipt> findAllActive(Pageable pageable);

    @Query("SELECT gr FROM GoodsReceipt gr WHERE " +
           "(LOWER(gr.receiptNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "gr.deletedAt IS NULL")
    List<GoodsReceipt> searchReceipts(@Param("keyword") String keyword);

    @Query("SELECT gr FROM GoodsReceipt gr WHERE " +
           "(LOWER(gr.receiptNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "gr.deletedAt IS NULL")
    Page<GoodsReceipt> searchReceipts(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT gr FROM GoodsReceipt gr WHERE gr.purchaseOrder.orderId = :orderId AND gr.deletedAt IS NULL")
    List<GoodsReceipt> findByOrderId(@Param("orderId") Integer orderId);

    @Query("SELECT gr FROM GoodsReceipt gr WHERE gr.warehouse.warehouseId = :warehouseId AND gr.deletedAt IS NULL")
    List<GoodsReceipt> findByWarehouseId(@Param("warehouseId") Integer warehouseId);

    @Query("SELECT gr FROM GoodsReceipt gr " +
           "LEFT JOIN FETCH gr.purchaseOrder po " +
           "LEFT JOIN FETCH po.vendor " +
           "LEFT JOIN FETCH gr.warehouse " +
           "LEFT JOIN FETCH gr.createdBy cb " +
           "LEFT JOIN FETCH cb.profile " +
           "LEFT JOIN FETCH gr.approvedBy ab " +
           "LEFT JOIN FETCH ab.profile " +
           "WHERE gr.receiptId = :id AND gr.deletedAt IS NULL")
    Optional<GoodsReceipt> findByIdWithRelations(@Param("id") Integer id);
    
    @Query("SELECT DISTINCT gr FROM GoodsReceipt gr " +
           "LEFT JOIN FETCH gr.items i " +
           "LEFT JOIN FETCH i.product " +
           "LEFT JOIN FETCH i.purchaseOrderItem " +
           "WHERE gr.receiptId = :id AND gr.deletedAt IS NULL")
    Optional<GoodsReceipt> findByIdWithItems(@Param("id") Integer id);

    @Query(value = "SELECT * FROM Goods_Receipts WHERE receipt_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL ORDER BY receipt_no DESC LIMIT 1", nativeQuery = true)
    Optional<GoodsReceipt> findTopByReceiptNoStartingWithOrderByReceiptNoDesc(@Param("prefix") String prefix);
}

