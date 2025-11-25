package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.SalesQuotationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesQuotationItemRepository extends JpaRepository<SalesQuotationItem, Integer> {

    List<SalesQuotationItem> findBySalesQuotation_SqId(Integer quotationId);

    void deleteBySalesQuotation_SqId(Integer quotationId);
}
