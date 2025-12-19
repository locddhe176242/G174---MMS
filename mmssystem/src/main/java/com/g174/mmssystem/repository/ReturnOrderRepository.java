package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ReturnOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnOrderRepository extends JpaRepository<ReturnOrder, Integer>, JpaSpecificationExecutor<ReturnOrder> {

    ReturnOrder findByReturnNo(String returnNo);

    List<ReturnOrder> findByDelivery_DeliveryIdAndDeletedAtIsNull(Integer deliveryId);

    List<ReturnOrder> findByInvoice_ArInvoiceIdAndDeletedAtIsNull(Integer invoiceId);

    /**
     * Tìm số đơn trả hàng lớn nhất bắt đầu bằng prefix (để generate số tuần tự)
     */
    @Query("SELECT MAX(ro.returnNo) FROM ReturnOrder ro WHERE ro.returnNo LIKE CONCAT(:prefix, '%') AND ro.deletedAt IS NULL")
    String findMaxReturnNo(@Param("prefix") String prefix);

    /**
     * Lấy tất cả Return Orders với các relationship được eager load để tránh LazyInitializationException
     */
    @Query("SELECT DISTINCT ro FROM ReturnOrder ro " +
           "LEFT JOIN FETCH ro.delivery d " +
           "LEFT JOIN FETCH d.salesOrder so " +
           "LEFT JOIN FETCH so.customer c " +
           "LEFT JOIN FETCH ro.invoice inv " +
           "LEFT JOIN FETCH ro.warehouse w " +
           "LEFT JOIN FETCH ro.createdBy cb " +
           "LEFT JOIN FETCH ro.updatedBy ub " +
           "WHERE ro.deletedAt IS NULL")
    List<ReturnOrder> findAllWithRelations();

    /**
     * Lấy Return Order theo ID với các relationship được eager load để tránh LazyInitializationException
     */
    @Query("SELECT ro FROM ReturnOrder ro " +
           "LEFT JOIN FETCH ro.delivery d " +
           "LEFT JOIN FETCH d.salesOrder so " +
           "LEFT JOIN FETCH so.customer c " +
           "LEFT JOIN FETCH ro.invoice inv " +
           "LEFT JOIN FETCH ro.warehouse w " +
           "LEFT JOIN FETCH ro.createdBy cb " +
           "LEFT JOIN FETCH ro.updatedBy ub " +
           "WHERE ro.roId = :id AND ro.deletedAt IS NULL")
    java.util.Optional<ReturnOrder> findByIdWithRelations(@Param("id") Integer id);
}

