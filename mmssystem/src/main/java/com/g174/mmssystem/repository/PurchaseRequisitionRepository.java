package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseRequisition;
import com.g174.mmssystem.entity.PurchaseRequisitionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRequisitionRepository extends JpaRepository<PurchaseRequisition, Integer> {

    Optional<PurchaseRequisition> findByRequisitionNo(String requisitionNo);

    boolean existsByRequisitionNoAndDeletedAtIsNull(String requisitionNo);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL")
    Page<PurchaseRequisition> findAllActive(Pageable pageable);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL AND " +
            "(pr.requisitionNo LIKE %:keyword% OR pr.purpose LIKE %:keyword%)")
    Page<PurchaseRequisition> searchActive(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL AND pr.status = :status")
    Page<PurchaseRequisition> findByStatus(PurchaseRequisitionStatus status, Pageable pageable);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL AND pr.requesterId = :requesterId")
    Page<PurchaseRequisition> findByRequesterId(@Param("requesterId") Integer requesterId, Pageable pageable);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL AND pr.approverId = :approverId")
    Page<PurchaseRequisition> findByApproverId(@Param("approverId") Integer approverId, Pageable pageable);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL AND " +
            "pr.createdAt BETWEEN :startDate AND :endDate")
    Page<PurchaseRequisition> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate,
                                                     Pageable pageable);

    @Query(value = "SELECT COALESCE(MAX(CAST(REGEXP_SUBSTR(requisition_no, '[0-9]+$') AS UNSIGNED)), 0) " +
            "FROM Purchase_Requisitions " +
            "WHERE requisition_no REGEXP CONCAT('^PR-', :year, '-[0-9]+$') " +
            "AND deleted_at IS NULL", nativeQuery = true)
    Integer getMaxRequisitionNumberForYear(@Param("year") String year);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL AND pr.requisitionId = :id")
    Optional<PurchaseRequisition> findActiveById(@Param("id") Integer id);
}