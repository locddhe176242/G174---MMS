package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseQuotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseQuotationRepository extends JpaRepository<PurchaseQuotation, Integer> {
    
    Optional<PurchaseQuotation> findByPqNo(String pqNo);
    
    boolean existsByPqNo(String pqNo);

    @Query("SELECT pq FROM PurchaseQuotation pq WHERE pq.deletedAt IS NULL")
    List<PurchaseQuotation> findAllActive();

    @Query("SELECT pq FROM PurchaseQuotation pq WHERE pq.deletedAt IS NULL")
    Page<PurchaseQuotation> findAllActive(Pageable pageable);

    @Query("SELECT pq FROM PurchaseQuotation pq WHERE " +
           "(LOWER(pq.pqNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "pq.deletedAt IS NULL")
    List<PurchaseQuotation> searchQuotations(@Param("keyword") String keyword);

    @Query("SELECT pq FROM PurchaseQuotation pq WHERE " +
           "(LOWER(pq.pqNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "pq.deletedAt IS NULL")
    Page<PurchaseQuotation> searchQuotations(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT pq FROM PurchaseQuotation pq WHERE pq.rfq.rfqId = :rfqId AND pq.deletedAt IS NULL")
    List<PurchaseQuotation> findByRfqId(@Param("rfqId") Integer rfqId);

    @Query("SELECT pq FROM PurchaseQuotation pq WHERE pq.vendor.vendorId = :vendorId AND pq.deletedAt IS NULL")
    List<PurchaseQuotation> findByVendorId(@Param("vendorId") Integer vendorId);

    @Query("SELECT pq FROM PurchaseQuotation pq WHERE pq.rfq.rfqId = :rfqId AND pq.vendor.vendorId = :vendorId")
    List<PurchaseQuotation> findByRfqIdAndVendorId(@Param("rfqId") Integer rfqId, @Param("vendorId") Integer vendorId);

    @Query("SELECT DISTINCT pq FROM PurchaseQuotation pq " +
           "LEFT JOIN FETCH pq.items i " +
           "LEFT JOIN FETCH i.product " +
           "LEFT JOIN FETCH i.rfqItem " +
           "LEFT JOIN FETCH pq.rfq " +
           "LEFT JOIN FETCH pq.vendor " +
           "LEFT JOIN FETCH pq.createdBy cb " +
           "LEFT JOIN FETCH cb.profile " +
           "WHERE pq.pqId = :id AND pq.deletedAt IS NULL")
    Optional<PurchaseQuotation> findByIdWithRelations(@Param("id") Integer id);

    @Query(value = "SELECT * FROM Purchase_Quotations WHERE pq_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL ORDER BY pq_no DESC LIMIT 1", nativeQuery = true)
    Optional<PurchaseQuotation> findTopByPqNoStartingWithOrderByPqNoDesc(@Param("prefix") String prefix);
}

