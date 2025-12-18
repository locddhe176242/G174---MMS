package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.InboundDeliveryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InboundDeliveryItemRepository extends JpaRepository<InboundDeliveryItem, Integer> {

    @Query("SELECT idi FROM InboundDeliveryItem idi WHERE idi.inboundDelivery.inboundDeliveryId = :inboundDeliveryId")
    List<InboundDeliveryItem> findByInboundDeliveryId(@Param("inboundDeliveryId") Integer inboundDeliveryId);

    @Query("SELECT idi FROM InboundDeliveryItem idi " +
            "WHERE idi.purchaseOrderItem.poiId = :poiId")
    List<InboundDeliveryItem> findByPurchaseOrderItemId(@Param("poiId") Integer poiId);

    @Query("SELECT idi FROM InboundDeliveryItem idi " +
            "WHERE idi.product.productId = :productId")
    List<InboundDeliveryItem> findByProductId(@Param("productId") Integer productId);

    void deleteByInboundDelivery_InboundDeliveryId(Integer inboundDeliveryId);
}
