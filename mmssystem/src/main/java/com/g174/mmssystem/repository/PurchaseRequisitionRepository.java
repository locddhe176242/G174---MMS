package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.PurchaseRequisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PurchaseRequisitionRepository extends JpaRepository<PurchaseRequisition, Long> {
    // Tìm requisition mới nhất theo năm để sinh mã tiếp theo
    @Query("SELECT r FROM PurchaseRequisition r WHERE r.requisitionNo LIKE CONCAT('PR-', :year, '%') ORDER BY r.requisitionNo DESC LIMIT 1")
    Optional<PurchaseRequisition> findLatestByYear(String year);
}
