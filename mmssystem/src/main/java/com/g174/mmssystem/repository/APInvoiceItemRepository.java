package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.APInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface APInvoiceItemRepository extends JpaRepository<APInvoiceItem, Integer> {

    @Query("SELECT aii FROM APInvoiceItem aii WHERE aii.apInvoice.apInvoiceId = :invoiceId")
    List<APInvoiceItem> findByInvoiceId(@Param("invoiceId") Integer invoiceId);

    @Query("SELECT aii FROM APInvoiceItem aii WHERE aii.purchaseOrderItem.poiId = :poiId")
    List<APInvoiceItem> findByPoiId(@Param("poiId") Integer poiId);

    @Query("SELECT aii FROM APInvoiceItem aii WHERE aii.goodsReceiptItem.griId = :griId")
    List<APInvoiceItem> findByGriId(@Param("griId") Integer griId);
}
