package com.g174.mmssystem.repository;

import com.g174.mmssystem.dto.responseDTO.TransactionSummaryProjection;
import com.g174.mmssystem.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL")
    List<Customer> findAllActiveCustomers();

    @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL")
    Page<Customer> findAllActiveCustomers(Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE " +
            "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
            "c.deletedAt IS NULL")
    List<Customer> searchCustomers(@Param("keyword") String keyword);

    @Query("SELECT c FROM Customer c WHERE " +
            "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
            "c.deletedAt IS NULL")
    Page<Customer> searchCustomers(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE c.address.addressId = :addressId AND c.deletedAt IS NULL")
    List<Customer> findByAddressId(@Param("addressId") Integer addressId);

    @Query("SELECT c FROM Customer c WHERE c.contact.contactId = :contactId AND c.deletedAt IS NULL")
    List<Customer> findByContactId(@Param("contactId") Integer contactId);

    // Optimized queries with JOIN FETCH
    @Query("SELECT c FROM Customer c " +
            "LEFT JOIN FETCH c.address " +
            "LEFT JOIN FETCH c.contact " +
            "WHERE c.customerId = :customerId AND c.deletedAt IS NULL")
    Optional<Customer> findByIdWithDetails(@Param("customerId") Integer customerId);

    // Native query for transaction summary - single query instead of multiple
    @Query(value = """
        SELECT 
            COUNT(DISTINCT sq.sq_id) as totalQuotations,
            COALESCE(SUM(sq.total_amount), 0) as totalQuotationAmount,
            COUNT(DISTINCT CASE WHEN sq.status = 'Active' THEN sq.sq_id END) as activeQuotations,
            COUNT(DISTINCT CASE WHEN sq.status = 'Converted' THEN sq.sq_id END) as convertedQuotations,
            COUNT(DISTINCT so.so_id) as totalOrders,
            COALESCE(SUM(so.total_amount), 0) as totalOrderAmount,
            COUNT(DISTINCT CASE WHEN so.status = 'Pending' THEN so.so_id END) as pendingOrders,
            COUNT(DISTINCT CASE WHEN so.status = 'Approved' THEN so.so_id END) as approvedOrders,
            COUNT(DISTINCT CASE WHEN so.status = 'Fulfilled' THEN so.so_id END) as fulfilledOrders,
            COUNT(DISTINCT ar.ar_invoice_id) as totalInvoices,
            COALESCE(SUM(ar.total_amount), 0) as totalInvoiceAmount,
            COALESCE(SUM(ar.total_amount - ar.balance_amount), 0) as totalPaidAmount,
            COALESCE(SUM(ar.balance_amount), 0) as totalOutstandingAmount,
            COUNT(DISTINCT CASE WHEN ar.status = 'Unpaid' THEN ar.ar_invoice_id END) as unpaidInvoices,
            COUNT(DISTINCT CASE WHEN ar.status = 'Paid' THEN ar.ar_invoice_id END) as paidInvoices,
            MAX(sq.quotation_date) as lastQuotationDate,
            MAX(so.order_date) as lastOrderDate,
            MAX(ar.created_at) as lastInvoiceDate
        FROM customers c
        LEFT JOIN sales_quotations sq ON c.customer_id = sq.customer_id AND sq.deleted_at IS NULL
        LEFT JOIN sales_orders so ON c.customer_id = so.customer_id AND so.deleted_at IS NULL
        LEFT JOIN ar_invoices ar ON c.customer_id = ar.customer_id AND ar.deleted_at IS NULL
        WHERE c.customer_id = :customerId AND c.deleted_at IS NULL
        """, nativeQuery = true)
    TransactionSummaryProjection getTransactionSummary(@Param("customerId") Integer customerId);
}