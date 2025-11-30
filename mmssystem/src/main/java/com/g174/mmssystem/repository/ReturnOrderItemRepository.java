package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ReturnOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnOrderItemRepository extends JpaRepository<ReturnOrderItem, Integer> {

    List<ReturnOrderItem> findByReturnOrder_RoId(Integer returnOrderId);

    List<ReturnOrderItem> findByDeliveryItem_DiId(Integer deliveryItemId);

    void deleteByReturnOrder_RoId(Integer returnOrderId);
}

