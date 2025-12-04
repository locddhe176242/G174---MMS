package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.SalesReturnInboundOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesReturnInboundOrderItemRepository extends JpaRepository<SalesReturnInboundOrderItem, Integer> {

    List<SalesReturnInboundOrderItem> findByInboundOrder_SriId(Integer sriId);
}


