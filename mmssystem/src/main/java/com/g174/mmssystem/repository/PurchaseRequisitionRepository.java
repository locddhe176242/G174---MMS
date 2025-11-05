package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseRequisition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PurchaseRequisitionRepository extends JpaRepository<PurchaseRequisition, Long> {
    // Tìm requisition mới nhất theo năm để sinh mã tiếp theo
    @Query(value = "SELECT r FROM PurchaseRequisition r WHERE r.requisitionNo LIKE CONCAT(:prefix, '%') ORDER BY r.requisitionNo DESC")
    Optional<PurchaseRequisition> findTopByRequisitionNoStartingWithOrderByRequisitionNoDesc(@Param("prefix") String prefix);

    boolean existsByRequisitionNo(String requisitionNo);

    @Query("SELECT r FROM PurchaseRequisition r WHERE r.deletedAt IS NULL")
    List<PurchaseRequisition> findAllActive();

    @Query("SELECT r FROM PurchaseRequisition r WHERE r.deletedAt IS NULL")
    Page<PurchaseRequisition> findAllActive(Pageable pageable);

    @Query("SELECT r FROM PurchaseRequisition r WHERE " +
            "(LOWER(r.requisitionNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(r.department) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(r.purpose) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "r.deletedAt IS NULL")
    List<PurchaseRequisition> searchRequisitions(@Param("keyword") String keyword);

    @Query("SELECT r FROM PurchaseRequisition r WHERE " +
            "(LOWER(r.requisitionNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(r.department) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(r.purpose) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "r.deletedAt IS NULL")
    Page<PurchaseRequisition> searchRequisitions(@Param("keyword") String keyword, Pageable pageable);
}
