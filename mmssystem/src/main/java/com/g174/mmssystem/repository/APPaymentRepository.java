package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.APPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface APPaymentRepository extends JpaRepository<APPayment, Integer> {

    @Query("SELECT ap FROM APPayment ap WHERE ap.apInvoice.apInvoiceId = :invoiceId ORDER BY ap.paymentDate DESC")
    List<APPayment> findByInvoiceId(@Param("invoiceId") Integer invoiceId);

    @Query("SELECT ap FROM APPayment ap WHERE ap.method = :method ORDER BY ap.paymentDate DESC")
    List<APPayment> findByMethod(@Param("method") String method);

    @Query("SELECT COALESCE(SUM(ap.amount), 0) FROM APPayment ap " +
           "WHERE ap.apInvoice.vendor.vendorId = :vendorId")
    java.math.BigDecimal getTotalPaidByVendorId(@Param("vendorId") Integer vendorId);

    // Find all payments with search
    @Query("SELECT ap FROM APPayment ap " +
           "JOIN ap.apInvoice inv " +
           "JOIN inv.vendor v " +
           "WHERE (:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(inv.invoiceNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(v.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(ap.referenceNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY ap.paymentDate DESC")
    org.springframework.data.domain.Page<APPayment> findAllWithSearch(
            @Param("keyword") String keyword,
            org.springframework.data.domain.Pageable pageable
    );
}
