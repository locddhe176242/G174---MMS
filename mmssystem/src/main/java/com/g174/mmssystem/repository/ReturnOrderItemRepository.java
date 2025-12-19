package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ReturnOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnOrderItemRepository extends JpaRepository<ReturnOrderItem, Integer> {

    List<ReturnOrderItem> findByReturnOrder_RoId(Integer returnOrderId);

    @Query("SELECT roi FROM ReturnOrderItem roi " +
           "JOIN FETCH roi.product " +
           "JOIN FETCH roi.warehouse " +
           "LEFT JOIN FETCH roi.deliveryItem di " +
           "LEFT JOIN FETCH di.salesOrderItem soi " +
           "WHERE roi.returnOrder.roId = :returnOrderId")
    List<ReturnOrderItem> findByReturnOrder_RoIdWithRelations(@Param("returnOrderId") Integer returnOrderId);

    List<ReturnOrderItem> findByDeliveryItem_DiId(Integer deliveryItemId);

    void deleteByReturnOrder_RoId(Integer returnOrderId);
}

