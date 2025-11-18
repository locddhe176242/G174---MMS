package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseRequisition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRequisitionRepository extends JpaRepository<PurchaseRequisition, Long> {
    
    Optional<PurchaseRequisition> findByRequisitionNo(String requisitionNo);
    
    boolean existsByRequisitionNo(String requisitionNo);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL")
    List<PurchaseRequisition> findAllActive();

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE pr.deletedAt IS NULL")
    Page<PurchaseRequisition> findAllActive(Pageable pageable);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE " +
           "(LOWER(pr.requisitionNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(pr.purpose) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "pr.deletedAt IS NULL")
    List<PurchaseRequisition> searchRequisitions(@Param("keyword") String keyword);

    @Query("SELECT pr FROM PurchaseRequisition pr WHERE " +
           "(LOWER(pr.requisitionNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(pr.purpose) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "pr.deletedAt IS NULL")
    Page<PurchaseRequisition> searchRequisitions(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT DISTINCT pr FROM PurchaseRequisition pr " +
           "LEFT JOIN FETCH pr.items i " +
           "LEFT JOIN FETCH i.product " +
           "LEFT JOIN FETCH pr.requester r " +
           "LEFT JOIN FETCH r.profile " +
           "LEFT JOIN FETCH pr.approver a " +
           "LEFT JOIN FETCH a.profile " +
           "LEFT JOIN FETCH pr.createdBy cb " +
           "LEFT JOIN FETCH cb.profile " +
           "LEFT JOIN FETCH pr.updatedBy ub " +
           "LEFT JOIN FETCH ub.profile " +
           "WHERE pr.requisitionId = :id AND pr.deletedAt IS NULL")
    Optional<PurchaseRequisition> findByIdWithRelations(@Param("id") Long id);

    @Query(value = "SELECT * FROM Purchase_Requisitions WHERE requisition_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL ORDER BY requisition_no DESC LIMIT 1", nativeQuery = true)
    Optional<PurchaseRequisition> findTopByRequisitionNoStartingWithOrderByRequisitionNoDesc(@Param("prefix") String prefix);
}

