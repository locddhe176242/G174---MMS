package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Integer>, JpaSpecificationExecutor<SalesOrder> {

    @Query("SELECT so FROM SalesOrder so WHERE so.customer.customerId = :customerId AND so.deletedAt IS NULL")
    List<SalesOrder> findByCustomerIdAndNotDeleted(@Param("customerId") Integer customerId);

    @Query("SELECT so FROM SalesOrder so WHERE so.customer.customerId = :customerId AND so.deletedAt IS NULL")
    Page<SalesOrder> findByCustomerIdAndNotDeleted(@Param("customerId") Integer customerId, Pageable pageable);

    @Query("SELECT so FROM SalesOrder so WHERE so.deletedAt IS NULL")
    List<SalesOrder> findAllActiveOrders();

    @Query("SELECT so FROM SalesOrder so WHERE so.deletedAt IS NULL")
    Page<SalesOrder> findAllActiveOrders(Pageable pageable);

    // Additional queries for business logic
    @Query("SELECT so FROM SalesOrder so WHERE so.customer.customerId = :customerId AND so.status = :status AND so.deletedAt IS NULL")
    List<SalesOrder> findByCustomerIdAndStatus(@Param("customerId") Integer customerId, @Param("status") SalesOrder.OrderStatus status);

    @Query("SELECT so FROM SalesOrder so WHERE so.customer.customerId = :customerId AND so.approvalStatus = :approvalStatus AND so.deletedAt IS NULL")
    List<SalesOrder> findByCustomerIdAndApprovalStatus(@Param("customerId") Integer customerId, @Param("approvalStatus") SalesOrder.ApprovalStatus approvalStatus);

    @Query("SELECT so FROM SalesOrder so WHERE so.soNo = :soNo AND so.deletedAt IS NULL")
    SalesOrder findBySoNo(@Param("soNo") String soNo);

    @Query("SELECT COUNT(so) FROM SalesOrder so WHERE so.customer.customerId = :customerId AND so.status = :status AND so.deletedAt IS NULL")
    Long countByCustomerIdAndStatus(@Param("customerId") Integer customerId, @Param("status") SalesOrder.OrderStatus status);

    @Query("SELECT SUM(so.totalAmount) FROM SalesOrder so WHERE so.customer.customerId = :customerId AND so.deletedAt IS NULL")
    java.math.BigDecimal getTotalOrderAmountByCustomer(@Param("customerId") Integer customerId);

    @Query("SELECT so FROM SalesOrder so WHERE so.salesQuotation.sqId = :sqId AND so.deletedAt IS NULL")
    List<SalesOrder> findBySalesQuotationId(@Param("sqId") Integer sqId);

    @Query("SELECT so FROM SalesOrder so " +
            "WHERE so.customer.customerId = :customerId AND so.deletedAt IS NULL " +
            "ORDER BY so.orderDate DESC")
    List<SalesOrder> findByCustomerIdOrderByDateDesc(@Param("customerId") Integer customerId);

    @Query("SELECT so FROM SalesOrder so " +
            "WHERE so.customer.customerId = :customerId AND so.deletedAt IS NULL " +
            "ORDER BY so.orderDate DESC")
    Page<SalesOrder> findByCustomerIdOrderByDateDesc(@Param("customerId") Integer customerId, Pageable pageable);

    @Query("SELECT COUNT(so) FROM SalesOrder so WHERE so.status = :status AND so.deletedAt IS NULL")
    Long countByStatus(@Param("status") SalesOrder.OrderStatus status);
}