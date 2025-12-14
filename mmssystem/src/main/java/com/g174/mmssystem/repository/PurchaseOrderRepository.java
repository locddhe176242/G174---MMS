package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.poNo = :poNo AND po.deletedAt IS NULL")
    Optional<PurchaseOrder> findByPoNo(@Param("poNo") String poNo);
    
    @Query("SELECT COUNT(po) > 0 FROM PurchaseOrder po WHERE po.poNo = :poNo AND po.deletedAt IS NULL")
    boolean existsByPoNo(@Param("poNo") String poNo);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.deletedAt IS NULL")
    List<PurchaseOrder> findAllActive();

    @Query("SELECT po FROM PurchaseOrder po WHERE po.deletedAt IS NULL")
    Page<PurchaseOrder> findAllActive(Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(LOWER(po.poNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "po.deletedAt IS NULL")
    List<PurchaseOrder> searchOrders(@Param("keyword") String keyword);

    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(LOWER(po.poNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "po.deletedAt IS NULL")
    Page<PurchaseOrder> searchOrders(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.vendor.vendorId = :vendorId AND po.deletedAt IS NULL")
    List<PurchaseOrder> findByVendorId(@Param("vendorId") Integer vendorId);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.purchaseQuotation.pqId = :pqId AND po.deletedAt IS NULL")
    List<PurchaseOrder> findByPqId(@Param("pqId") Integer pqId);

    @Query("SELECT DISTINCT po FROM PurchaseOrder po " +
           "LEFT JOIN FETCH po.items i " +
           "LEFT JOIN FETCH i.product " +
           "LEFT JOIN FETCH i.purchaseQuotationItem " +
           "LEFT JOIN FETCH po.vendor " +
           "LEFT JOIN FETCH po.purchaseQuotation " +
           "LEFT JOIN FETCH po.approver app " +
           "LEFT JOIN FETCH app.profile " +
           "LEFT JOIN FETCH po.createdBy cb " +
           "LEFT JOIN FETCH cb.profile " +
           "LEFT JOIN FETCH po.updatedBy ub " +
           "LEFT JOIN FETCH ub.profile " +
           "WHERE po.orderId = :id AND po.deletedAt IS NULL")
    Optional<PurchaseOrder> findByIdWithRelations(@Param("id") Integer id);

    @Query(value = "SELECT * FROM Purchase_Orders WHERE po_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL ORDER BY po_no DESC LIMIT 1", nativeQuery = true)
    Optional<PurchaseOrder> findTopByPoNoStartingWithOrderByPoNoDesc(@Param("prefix") String prefix);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po WHERE po.status = :status AND po.deletedAt IS NULL")
    Long countByStatus(@Param("status") com.g174.mmssystem.enums.PurchaseOrderStatus status);
}

