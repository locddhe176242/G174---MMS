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
}
