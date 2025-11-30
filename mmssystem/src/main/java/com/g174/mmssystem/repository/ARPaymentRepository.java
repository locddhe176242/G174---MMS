package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ARPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ARPaymentRepository extends JpaRepository<ARPayment, Integer> {

    List<ARPayment> findByInvoice_ArInvoiceId(Integer invoiceId);

    List<ARPayment> findByInvoice_ArInvoiceIdOrderByPaymentDateDesc(Integer invoiceId);

    @Query("SELECT SUM(p.amount) FROM ARPayment p WHERE p.invoice.arInvoiceId = :invoiceId")
    java.math.BigDecimal getTotalPaidByInvoiceId(@Param("invoiceId") Integer invoiceId);

    @Query("SELECT SUM(p.amount) FROM ARPayment p WHERE p.invoice.customer.customerId = :customerId")
    java.math.BigDecimal getTotalPaidByCustomerId(@Param("customerId") Integer customerId);
}

