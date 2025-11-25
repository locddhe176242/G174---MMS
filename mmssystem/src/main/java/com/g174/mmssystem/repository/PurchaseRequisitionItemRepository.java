package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseRequisitionItemRepository extends JpaRepository<PurchaseRequisitionItem, Integer> {
    List<PurchaseRequisitionItem> findByPurchaseRequisition_RequisitionId(Integer requisitionId);
}
