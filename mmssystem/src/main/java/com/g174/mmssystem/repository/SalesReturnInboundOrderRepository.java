package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.SalesReturnInboundOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesReturnInboundOrderRepository extends JpaRepository<SalesReturnInboundOrder, Integer> {

    Optional<SalesReturnInboundOrder> findBySriNo(String sriNo);

    @Query("SELECT sri FROM SalesReturnInboundOrder sri " +
           "WHERE sri.returnOrder.roId = :roId AND sri.deletedAt IS NULL")
    List<SalesReturnInboundOrder> findByReturnOrderId(@Param("roId") Integer roId);

    @Query("SELECT sri FROM SalesReturnInboundOrder sri " +
           "WHERE sri.deletedAt IS NULL")
    List<SalesReturnInboundOrder> findAllActive();

    @Query(value = "SELECT * FROM Sales_Return_Inbound_Orders " +
                   "WHERE sri_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL " +
                   "ORDER BY sri_no DESC LIMIT 1",
           nativeQuery = true)
    Optional<SalesReturnInboundOrder> findTopBySriNoStartingWithOrderBySriNoDesc(@Param("prefix") String prefix);
}


