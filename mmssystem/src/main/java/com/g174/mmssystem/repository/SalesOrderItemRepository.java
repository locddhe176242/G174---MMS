package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Integer> {

    List<SalesOrderItem> findBySalesOrder_SoId(Integer orderId);

    void deleteBySalesOrder_SoId(Integer orderId);
}

