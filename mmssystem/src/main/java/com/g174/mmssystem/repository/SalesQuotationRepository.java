package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.SalesQuotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface SalesQuotationRepository extends JpaRepository<SalesQuotation, Integer>, JpaSpecificationExecutor<SalesQuotation> {

    @Query("SELECT sq FROM SalesQuotation sq WHERE sq.customer.customerId = :customerId AND sq.deletedAt IS NULL")
    List<SalesQuotation> findByCustomerIdAndNotDeleted(@Param("customerId") Integer customerId);

    @Query("SELECT sq FROM SalesQuotation sq WHERE sq.customer.customerId = :customerId AND sq.deletedAt IS NULL")
    Page<SalesQuotation> findByCustomerIdAndNotDeleted(@Param("customerId") Integer customerId, Pageable pageable);

    @Query("SELECT sq FROM SalesQuotation sq WHERE sq.deletedAt IS NULL")
    List<SalesQuotation> findAllActiveQuotations();

    @Query("SELECT sq FROM SalesQuotation sq WHERE sq.deletedAt IS NULL")
    Page<SalesQuotation> findAllActiveQuotations(Pageable pageable);

    // Additional queries for business logic
    @Query("SELECT sq FROM SalesQuotation sq WHERE sq.customer.customerId = :customerId AND sq.status = :status AND sq.deletedAt IS NULL")
    List<SalesQuotation> findByCustomerIdAndStatus(@Param("customerId") Integer customerId, @Param("status") SalesQuotation.QuotationStatus status);

    @Query("SELECT sq FROM SalesQuotation sq WHERE sq.validUntil < :currentDate AND sq.status = 'Active' AND sq.deletedAt IS NULL")
    List<SalesQuotation> findExpiredQuotations(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT sq FROM SalesQuotation sq WHERE sq.quotationNo = :quotationNo AND sq.deletedAt IS NULL")
    SalesQuotation findByQuotationNo(@Param("quotationNo") String quotationNo);

    @Query("SELECT COUNT(sq) FROM SalesQuotation sq WHERE sq.customer.customerId = :customerId AND sq.status = :status AND sq.deletedAt IS NULL")
    Long countByCustomerIdAndStatus(@Param("customerId") Integer customerId, @Param("status") SalesQuotation.QuotationStatus status);

    @Query("SELECT SUM(sq.totalAmount) FROM SalesQuotation sq WHERE sq.customer.customerId = :customerId AND sq.deletedAt IS NULL")
    java.math.BigDecimal getTotalQuotationAmountByCustomer(@Param("customerId") Integer customerId);

    @Query("SELECT sq FROM SalesQuotation sq " +
            "WHERE sq.customer.customerId = :customerId AND sq.deletedAt IS NULL " +
            "ORDER BY sq.quotationDate DESC")
    List<SalesQuotation> findByCustomerIdOrderByDateDesc(@Param("customerId") Integer customerId);

    @Query("SELECT sq FROM SalesQuotation sq " +
            "WHERE sq.customer.customerId = :customerId AND sq.deletedAt IS NULL " +
            "ORDER BY sq.quotationDate DESC")
    Page<SalesQuotation> findByCustomerIdOrderByDateDesc(@Param("customerId") Integer customerId, Pageable pageable);
}