package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseRequisition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PurchaseRequisitionRepository extends JpaRepository<PurchaseRequisition, Integer> {
    // Tìm requisition mới nhất theo năm để sinh mã tiếp theo
    @Query(value = "SELECT * FROM Purchase_Requisitions WHERE requisition_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL ORDER BY requisition_no DESC LIMIT 1", nativeQuery = true)
    Optional<PurchaseRequisition> findTopByRequisitionNoStartingWithOrderByRequisitionNoDesc(@Param("prefix") String prefix);

    boolean existsByRequisitionNo(String requisitionNo);

    @Query("SELECT r FROM PurchaseRequisition r WHERE r.deletedAt IS NULL")
    List<PurchaseRequisition> findAllActive();

    @Query("SELECT r FROM PurchaseRequisition r WHERE r.deletedAt IS NULL")
    Page<PurchaseRequisition> findAllActive(Pageable pageable);

    @Query("SELECT r FROM PurchaseRequisition r WHERE " +
            "(LOWER(r.requisitionNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(r.purpose) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "r.deletedAt IS NULL")
    List<PurchaseRequisition> searchRequisitions(@Param("keyword") String keyword);

    @Query("SELECT r FROM PurchaseRequisition r WHERE " +
            "(LOWER(r.requisitionNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(r.purpose) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "r.deletedAt IS NULL")
    Page<PurchaseRequisition> searchRequisitions(@Param("keyword") String keyword, Pageable pageable);

    // Query với JOIN FETCH để load tất cả quan hệ cần thiết
    @Query("SELECT DISTINCT r FROM PurchaseRequisition r " +
            "LEFT JOIN FETCH r.items i " +
            "LEFT JOIN FETCH i.product " +
            "LEFT JOIN FETCH i.createdBy " +
            "LEFT JOIN FETCH i.updatedBy " +
            "LEFT JOIN FETCH r.requester req " +
            "LEFT JOIN FETCH req.profile " +
            "LEFT JOIN FETCH r.approver app " +
            "LEFT JOIN FETCH app.profile " +
            "LEFT JOIN FETCH r.createdBy cb " +
            "LEFT JOIN FETCH cb.profile " +
            "LEFT JOIN FETCH r.updatedBy ub " +
            "LEFT JOIN FETCH ub.profile " +
            "WHERE r.requisitionId = :id AND r.deletedAt IS NULL")
    Optional<PurchaseRequisition> findByIdWithRelations(@Param("id") Integer id);

    @Query("SELECT DISTINCT r FROM PurchaseRequisition r " +
            "LEFT JOIN FETCH r.items i " +
            "LEFT JOIN FETCH i.product " +
            "LEFT JOIN FETCH i.createdBy " +
            "LEFT JOIN FETCH i.updatedBy " +
            "LEFT JOIN FETCH r.requester req " +
            "LEFT JOIN FETCH req.profile " +
            "LEFT JOIN FETCH r.approver app " +
            "LEFT JOIN FETCH app.profile " +
            "LEFT JOIN FETCH r.createdBy cb " +
            "LEFT JOIN FETCH cb.profile " +
            "LEFT JOIN FETCH r.updatedBy ub " +
            "LEFT JOIN FETCH ub.profile " +
            "WHERE r.deletedAt IS NULL")
    List<PurchaseRequisition> findAllActiveWithRelations();

    // Note: Cannot use JOIN FETCH with Pageable directly
    // For Page queries, we'll use EntityGraph or fetch separately
    // This query will work but may cause N+1, consider using @EntityGraph
    @Query("SELECT r FROM PurchaseRequisition r WHERE r.deletedAt IS NULL")
    Page<PurchaseRequisition> findAllActiveWithRelations(Pageable pageable);

    @Query("SELECT DISTINCT r FROM PurchaseRequisition r " +
            "LEFT JOIN FETCH r.items i " +
            "LEFT JOIN FETCH i.product " +
            "LEFT JOIN FETCH i.createdBy " +
            "LEFT JOIN FETCH i.updatedBy " +
            "LEFT JOIN FETCH r.requester req " +
            "LEFT JOIN FETCH req.profile " +
            "LEFT JOIN FETCH r.approver app " +
            "LEFT JOIN FETCH app.profile " +
            "LEFT JOIN FETCH r.createdBy cb " +
            "LEFT JOIN FETCH cb.profile " +
            "LEFT JOIN FETCH r.updatedBy ub " +
            "LEFT JOIN FETCH ub.profile " +
            "WHERE (LOWER(r.requisitionNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(r.purpose) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "r.deletedAt IS NULL")
    List<PurchaseRequisition> searchRequisitionsWithRelations(@Param("keyword") String keyword);
}
