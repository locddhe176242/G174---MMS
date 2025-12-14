package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ARInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ARInvoiceRepository extends JpaRepository<ARInvoice, Integer> {

    @Query("SELECT ar FROM ARInvoice ar WHERE ar.customer.customerId = :customerId AND ar.deletedAt IS NULL")
    List<ARInvoice> findByCustomerIdAndNotDeleted(@Param("customerId") Integer customerId);

    @Query("SELECT ar FROM ARInvoice ar WHERE ar.customer.customerId = :customerId AND ar.deletedAt IS NULL")
    Page<ARInvoice> findByCustomerIdAndNotDeleted(@Param("customerId") Integer customerId, Pageable pageable);

    @Query("SELECT ar FROM ARInvoice ar WHERE ar.deletedAt IS NULL")
    List<ARInvoice> findAllActiveInvoices();

    @Query("SELECT ar FROM ARInvoice ar WHERE ar.deletedAt IS NULL")
    Page<ARInvoice> findAllActiveInvoices(Pageable pageable);

    // Additional queries for business logic
    @Query("SELECT ar FROM ARInvoice ar WHERE ar.customer.customerId = :customerId AND ar.status = :status AND ar.deletedAt IS NULL")
    List<ARInvoice> findByCustomerIdAndStatus(@Param("customerId") Integer customerId, @Param("status") ARInvoice.InvoiceStatus status);

    @Query("SELECT ar FROM ARInvoice ar WHERE ar.dueDate < :currentDate AND ar.status IN ('Unpaid', 'PartiallyPaid') AND ar.deletedAt IS NULL")
    List<ARInvoice> findOverdueInvoices(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT ar FROM ARInvoice ar WHERE ar.invoiceNo = :invoiceNo AND ar.deletedAt IS NULL")
    ARInvoice findByInvoiceNo(@Param("invoiceNo") String invoiceNo);

    @Query("SELECT COUNT(ar) FROM ARInvoice ar WHERE ar.customer.customerId = :customerId AND ar.status = :status AND ar.deletedAt IS NULL")
    Long countByCustomerIdAndStatus(@Param("customerId") Integer customerId, @Param("status") ARInvoice.InvoiceStatus status);

    @Query("SELECT SUM(ar.totalAmount) FROM ARInvoice ar WHERE ar.customer.customerId = :customerId AND ar.deletedAt IS NULL")
    java.math.BigDecimal getTotalInvoiceAmountByCustomer(@Param("customerId") Integer customerId);

    @Query("SELECT SUM(ar.balanceAmount) FROM ARInvoice ar WHERE ar.customer.customerId = :customerId AND ar.deletedAt IS NULL")
    java.math.BigDecimal getTotalOutstandingAmountByCustomer(@Param("customerId") Integer customerId);

    @Query("SELECT ar FROM ARInvoice ar " +
            "WHERE ar.customer.customerId = :customerId AND ar.deletedAt IS NULL " +
            "ORDER BY ar.createdAt DESC")
    List<ARInvoice> findByCustomerIdOrderByDateDesc(@Param("customerId") Integer customerId);

    @Query("SELECT ar FROM ARInvoice ar " +
            "WHERE ar.customer.customerId = :customerId AND ar.deletedAt IS NULL " +
            "ORDER BY ar.createdAt DESC")
    Page<ARInvoice> findByCustomerIdOrderByDateDesc(@Param("customerId") Integer customerId, Pageable pageable);
    
    /**
     * Tìm tất cả AR Invoice của một Sales Order (chưa bị xóa)
     * Dùng để check dependencies khi update/delete Sales Order
     */
    @Query("SELECT ar FROM ARInvoice ar WHERE ar.salesOrder.soId = :soId AND ar.deletedAt IS NULL")
    List<ARInvoice> findBySalesOrder_SoIdAndDeletedAtIsNull(@Param("soId") Integer soId);
    
    /**
     * Tìm tất cả AR Invoice của một Delivery (chưa bị xóa)
     * Dùng để check dependencies khi update/delete Delivery
     */
    @Query("SELECT ar FROM ARInvoice ar WHERE ar.delivery.deliveryId = :deliveryId AND ar.deletedAt IS NULL")
    List<ARInvoice> findByDelivery_DeliveryIdAndDeletedAtIsNull(@Param("deliveryId") Integer deliveryId);
}