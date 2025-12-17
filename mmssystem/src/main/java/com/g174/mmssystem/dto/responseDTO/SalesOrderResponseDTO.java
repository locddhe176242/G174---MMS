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
    private BigDecimal headerDiscountPercent;
    private BigDecimal headerDiscountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String notes;
    private String approverName;
    private Instant approvedAt;
    private Instant createdAt;
    private Integer createdById;
    private String createdBy;
    private String createdByDisplay;
    private Instant updatedAt;
    private Integer updatedById;
    private String updatedBy;
    private String updatedByDisplay;
    private List<SalesOrderItemResponseDTO> items;
}