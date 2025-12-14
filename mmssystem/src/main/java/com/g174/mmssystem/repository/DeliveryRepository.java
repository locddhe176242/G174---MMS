package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Integer>, JpaSpecificationExecutor<Delivery> {

    Delivery findByDeliveryNo(String deliveryNo);
    
    /**
     * Tìm tất cả Delivery của một Sales Order (chưa bị xóa)
     * Dùng để check dependencies khi update/delete Sales Order
     */
    @Query("SELECT d FROM Delivery d WHERE d.salesOrder.soId = :soId AND d.deletedAt IS NULL")
    List<Delivery> findBySalesOrder_SoIdAndDeletedAtIsNull(@Param("soId") Integer soId);
}

