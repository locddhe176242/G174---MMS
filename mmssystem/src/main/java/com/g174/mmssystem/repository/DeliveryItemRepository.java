package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.DeliveryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DeliveryItemRepository extends JpaRepository<DeliveryItem, Integer> {

    List<DeliveryItem> findByDelivery_DeliveryId(Integer deliveryId);

    void deleteByDelivery_DeliveryId(Integer deliveryId);

    @Query("select coalesce(sum(di.plannedQty), 0) from DeliveryItem di where di.salesOrderItem.soiId = :soiId and di.delivery.deletedAt is null and di.delivery.status <> com.g174.mmssystem.entity.Delivery$DeliveryStatus.Cancelled")
    BigDecimal sumPlannedQtyBySalesOrderItem(@Param("soiId") Integer soiId);

    // Tính tổng plannedQty từ các Delivery chưa Delivered (Draft, Picked, Shipped)
    @Query("select coalesce(sum(di.plannedQty), 0) from DeliveryItem di where di.salesOrderItem.soiId = :soiId and di.delivery.deletedAt is null and di.delivery.status <> com.g174.mmssystem.entity.Delivery$DeliveryStatus.Cancelled and di.delivery.status <> com.g174.mmssystem.entity.Delivery$DeliveryStatus.Delivered")
    BigDecimal sumPlannedQtyBySalesOrderItemExcludingDelivered(@Param("soiId") Integer soiId);

    @Query("select coalesce(sum(di.deliveredQty), 0) from DeliveryItem di where di.salesOrderItem.soiId = :soiId and di.delivery.deletedAt is null and di.delivery.status = com.g174.mmssystem.entity.Delivery$DeliveryStatus.Delivered")
    BigDecimal sumDeliveredQtyBySalesOrderItem(@Param("soiId") Integer soiId);

    // Lấy danh sách DeliveryItem đã planned (chưa Delivered) để kiểm tra số lượng trong kho
    @Query("select di from DeliveryItem di where di.salesOrderItem.soiId = :soiId and di.delivery.deletedAt is null and di.delivery.status <> com.g174.mmssystem.entity.Delivery$DeliveryStatus.Cancelled and di.delivery.status <> com.g174.mmssystem.entity.Delivery$DeliveryStatus.Delivered")
    List<DeliveryItem> findPlannedItemsBySalesOrderItem(@Param("soiId") Integer soiId);
}

