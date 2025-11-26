package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.APInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface APInvoiceRepository extends JpaRepository<APInvoice, Integer> {

    Optional<APInvoice> findByInvoiceNo(String invoiceNo);

    boolean existsByInvoiceNo(String invoiceNo);

    @Query("SELECT ai FROM APInvoice ai WHERE ai.deletedAt IS NULL")
    List<APInvoice> findAllActive();

    @Query("SELECT ai FROM APInvoice ai WHERE ai.deletedAt IS NULL")
    Page<APInvoice> findAllActive(Pageable pageable);

    @Query("SELECT ai FROM APInvoice ai WHERE " +
           "(LOWER(ai.invoiceNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(ai.vendor.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "ai.deletedAt IS NULL")
    List<APInvoice> searchInvoices(@Param("keyword") String keyword);

    @Query("SELECT ai FROM APInvoice ai WHERE " +
           "(LOWER(ai.invoiceNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(ai.vendor.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "ai.deletedAt IS NULL")
    Page<APInvoice> searchInvoices(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT ai FROM APInvoice ai WHERE ai.vendor.vendorId = :vendorId AND ai.deletedAt IS NULL")
    List<APInvoice> findByVendorId(@Param("vendorId") Integer vendorId);

    @Query("SELECT ai FROM APInvoice ai WHERE ai.purchaseOrder.orderId = :orderId AND ai.deletedAt IS NULL")
    List<APInvoice> findByOrderId(@Param("orderId") Integer orderId);

    @Query("SELECT ai FROM APInvoice ai WHERE ai.goodsReceipt.receiptId = :receiptId AND ai.deletedAt IS NULL")
    List<APInvoice> findByReceiptId(@Param("receiptId") Integer receiptId);

    @Query("SELECT ai FROM APInvoice ai WHERE ai.status = :status AND ai.deletedAt IS NULL")
    List<APInvoice> findByStatus(@Param("status") APInvoice.APInvoiceStatus status);

    @Query("SELECT DISTINCT ai FROM APInvoice ai " +
           "LEFT JOIN FETCH ai.items item " +
           "LEFT JOIN FETCH item.purchaseOrderItem " +
           "LEFT JOIN FETCH item.goodsReceiptItem " +
           "LEFT JOIN FETCH ai.vendor v " +
           "LEFT JOIN FETCH v.contact " +
           "LEFT JOIN FETCH ai.purchaseOrder po " +
           "LEFT JOIN FETCH ai.goodsReceipt gr " +
           "LEFT JOIN FETCH ai.payments " +
           "WHERE ai.apInvoiceId = :id AND ai.deletedAt IS NULL")
    Optional<APInvoice> findByIdWithRelations(@Param("id") Integer id);

    @Query(value = "SELECT * FROM AP_Invoices WHERE invoice_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL ORDER BY invoice_no DESC LIMIT 1", nativeQuery = true)
    Optional<APInvoice> findTopByInvoiceNoStartingWithOrderByInvoiceNoDesc(@Param("prefix") String prefix);
}
