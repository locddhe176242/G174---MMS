package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ReturnOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnOrderRepository extends JpaRepository<ReturnOrder, Integer>, JpaSpecificationExecutor<ReturnOrder> {

    ReturnOrder findByReturnNo(String returnNo);

    List<ReturnOrder> findByDelivery_DeliveryIdAndDeletedAtIsNull(Integer deliveryId);

    List<ReturnOrder> findByInvoice_ArInvoiceIdAndDeletedAtIsNull(Integer invoiceId);
}

