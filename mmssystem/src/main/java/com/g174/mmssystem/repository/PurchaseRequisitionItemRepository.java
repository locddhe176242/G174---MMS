package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRequisitionItemRepository extends JpaRepository<PurchaseRequisitionItem, Integer> {  // FIXED: Long -> Integer

    List<PurchaseRequisitionItem> findByRequisitionId(Integer requisitionId);

    @Modifying
    @Query("DELETE FROM PurchaseRequisitionItem pri WHERE pri.requisitionId = :requisitionId")
    void deleteByRequisitionId(@Param("requisitionId") Integer requisitionId);
}