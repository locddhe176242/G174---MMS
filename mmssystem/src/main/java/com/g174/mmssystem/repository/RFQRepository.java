package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.RFQ;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RFQRepository extends JpaRepository<RFQ, Integer> {
    Optional<RFQ> findByRfqNo(String rfqNo);
    boolean existsByRfqNo(String rfqNo);

    @Query("SELECT r FROM RFQ r WHERE r.deletedAt IS NULL")
    List<RFQ> findAllActive();

    @Query("SELECT r FROM RFQ r WHERE r.deletedAt IS NULL")
    Page<RFQ> findAllActive(Pageable pageable);

    @Query("SELECT r FROM RFQ r WHERE " +
           "(LOWER(r.rfqNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.notes) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "r.deletedAt IS NULL")
    List<RFQ> searchRFQs(@Param("keyword") String keyword);

    @Query("SELECT r FROM RFQ r WHERE " +
           "(LOWER(r.rfqNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.notes) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "r.deletedAt IS NULL")
    Page<RFQ> searchRFQs(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT r FROM RFQ r WHERE r.requisition.requisitionId = :requisitionId AND r.deletedAt IS NULL")
    List<RFQ> findByRequisitionId(@Param("requisitionId") Long requisitionId);

    @Query("SELECT DISTINCT r FROM RFQ r " +
           "LEFT JOIN FETCH r.items i " +
           "LEFT JOIN FETCH i.product " +
           "LEFT JOIN FETCH i.purchaseRequisitionItem " +
           "LEFT JOIN FETCH r.requisition " +
           "LEFT JOIN FETCH r.selectedVendor " +
           "LEFT JOIN FETCH r.createdBy cb " +
           "LEFT JOIN FETCH cb.profile " +
           "WHERE r.rfqId = :id AND r.deletedAt IS NULL")
    Optional<RFQ> findByIdWithRelations(@Param("id") Integer id);

    @Query(value = "SELECT * FROM RFQs WHERE rfq_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL ORDER BY rfq_no DESC LIMIT 1", nativeQuery = true)
    Optional<RFQ> findTopByRfqNoStartingWithOrderByRfqNoDesc(@Param("prefix") String prefix);
    
    /**
     * Tìm các RFQ quá hạn (due_date < today) và chưa đóng
     */
    @Query("SELECT r FROM RFQ r WHERE r.dueDate < :today " +
           "AND r.status IN ('Sent', 'Pending') " +
           "AND r.deletedAt IS NULL")
    List<RFQ> findOverdueRFQs(@Param("today") LocalDate today);
    
    /**
     * Tìm các RFQ sắp hết hạn (due_date trong khoảng từ today đến endDate)
     */
    @Query("SELECT r FROM RFQ r WHERE r.dueDate >= :startDate " +
           "AND r.dueDate <= :endDate " +
           "AND r.status IN ('Sent', 'Pending') " +
           "AND r.deletedAt IS NULL")
    List<RFQ> findExpiringRFQs(@Param("startDate") LocalDate startDate, 
                                @Param("endDate") LocalDate endDate);
}

