package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.InboundDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InboundDeliveryRepository extends JpaRepository<InboundDelivery, Integer> {

    Optional<InboundDelivery> findByInboundDeliveryNoAndDeletedAtIsNull(String inboundDeliveryNo);

    List<InboundDelivery> findByPurchaseOrder_OrderIdAndDeletedAtIsNull(Integer orderId);

    @Query("SELECT id FROM InboundDelivery id WHERE id.purchaseOrder = :purchaseOrder AND id.deletedAt IS NULL")
    List<InboundDelivery> findByPurchaseOrder(@Param("purchaseOrder") com.g174.mmssystem.entity.PurchaseOrder purchaseOrder);

    List<InboundDelivery> findByWarehouse_WarehouseIdAndDeletedAtIsNull(Integer warehouseId);

    List<InboundDelivery> findByVendor_VendorIdAndDeletedAtIsNull(Integer vendorId);

    List<InboundDelivery> findByStatusAndDeletedAtIsNull(InboundDelivery.InboundDeliveryStatus status);

    @Query("SELECT id FROM InboundDelivery id WHERE id.deletedAt IS NULL ORDER BY id.createdAt DESC")
    Page<InboundDelivery> findAllActive(Pageable pageable);

    @Query("SELECT id FROM InboundDelivery id WHERE id.deletedAt IS NULL ORDER BY id.createdAt DESC")
    List<InboundDelivery> findAllActiveList();

    @Query("SELECT id FROM InboundDelivery id " +
            "WHERE id.deletedAt IS NULL " +
            "AND (LOWER(id.inboundDeliveryNo) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(id.purchaseOrder.poNo) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(id.vendor.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY id.createdAt DESC")
    Page<InboundDelivery> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query(value = "SELECT * FROM Inbound_Deliveries " +
            "WHERE inbound_delivery_no LIKE :prefix% " +
            "AND deleted_at IS NULL " +
            "ORDER BY inbound_delivery_no DESC LIMIT 1",
            nativeQuery = true)
    Optional<InboundDelivery> findTopByInboundDeliveryNoStartingWithOrderByInboundDeliveryNoDesc(@Param("prefix") String prefix);

    @Query(value = "SELECT * FROM Inbound_Deliveries " +
            "WHERE inbound_delivery_no LIKE :prefix% " +
            "ORDER BY inbound_delivery_no DESC LIMIT 1",
            nativeQuery = true)
    Optional<InboundDelivery> findTopByInboundDeliveryNoStartingWithIncludingDeletedOrderByInboundDeliveryNoDesc(@Param("prefix") String prefix);

    @Query("SELECT DISTINCT id FROM InboundDelivery id " +
            "LEFT JOIN FETCH id.items " +
            "WHERE id.deletedAt IS NULL " +
            "ORDER BY id.createdAt DESC")
    List<InboundDelivery> findAllActiveWithItems();

    @Query("SELECT id FROM InboundDelivery id " +
            "LEFT JOIN FETCH id.purchaseOrder po " +
            "LEFT JOIN FETCH id.vendor " +
            "WHERE id.deletedAt IS NULL " +
            "AND id.status = 'Pending' " +
            "ORDER BY id.createdAt DESC")
    List<InboundDelivery> findPendingInboundDeliveriesWithDetails();

    boolean existsByInboundDeliveryNo(String inboundDeliveryNo);
}
