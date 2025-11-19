package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.SalesOrder;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class SalesOrderListResponseDTO {
    private Integer orderId;
    private String orderNo;
    private SalesOrder.OrderStatus status;
    private SalesOrder.ApprovalStatus approvalStatus;
    private Integer customerId;
    private String customerName;
    private Instant orderDate;
    private BigDecimal totalAmount;
}

