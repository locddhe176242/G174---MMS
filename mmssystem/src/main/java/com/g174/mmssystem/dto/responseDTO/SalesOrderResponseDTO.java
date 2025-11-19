package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.SalesOrder;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class SalesOrderResponseDTO {
    private Integer orderId;
    private String orderNo;
    private SalesOrder.OrderStatus status;
    private SalesOrder.ApprovalStatus approvalStatus;
    private Integer customerId;
    private String customerName;
    private String customerCode;
    private Integer quotationId;
    private Instant orderDate;
    private String shippingAddress;
    private String paymentTerms;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String notes;
    private Instant createdAt;
    private String createdBy;
    private Instant updatedAt;
    private String updatedBy;
    private List<SalesOrderItemResponseDTO> items;
}

