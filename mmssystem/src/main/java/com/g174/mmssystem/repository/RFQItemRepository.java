package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.RFQItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RFQItemRepository extends JpaRepository<RFQItem, Integer> {
    @Query("SELECT rfi FROM RFQItem rfi WHERE rfi.rfq.rfqId = :rfqId")
    List<RFQItem> findByRfqId(@Param("rfqId") Integer rfqId);
}

