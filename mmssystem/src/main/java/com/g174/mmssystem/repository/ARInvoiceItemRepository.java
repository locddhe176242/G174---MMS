package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ARInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ARInvoiceItemRepository extends JpaRepository<ARInvoiceItem, Integer> {

    List<ARInvoiceItem> findByInvoice_ArInvoiceId(Integer invoiceId);

    @Modifying
    @Query("DELETE FROM ARInvoiceItem ari WHERE ari.invoice.arInvoiceId = :invoiceId")
    void deleteByInvoiceId(@Param("invoiceId") Integer invoiceId);
}

