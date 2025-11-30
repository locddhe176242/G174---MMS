package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.CreditNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditNoteRepository extends JpaRepository<CreditNote, Integer>, JpaSpecificationExecutor<CreditNote> {

    CreditNote findByCreditNoteNo(String creditNoteNo);

    List<CreditNote> findByInvoice_ArInvoiceIdAndDeletedAtIsNull(Integer invoiceId);

    List<CreditNote> findByReturnOrder_RoIdAndDeletedAtIsNull(Integer returnOrderId);

    @Query("SELECT cn FROM CreditNote cn WHERE cn.invoice.customer.customerId = :customerId AND cn.deletedAt IS NULL")
    List<CreditNote> findByCustomerIdAndDeletedAtIsNull(@Param("customerId") Integer customerId);
}

