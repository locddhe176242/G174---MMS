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
    // Dùng cho UI: đơn hàng đã có Delivery / AR Invoice hay chưa
    private Boolean hasDelivery;
    private Boolean hasInvoice;
    // Đơn hàng đã giao hết hàng chưa (tất cả items đều remainingQty <= 0)
    private Boolean isFullyDelivered;
    private Instant orderDate;
    private BigDecimal totalAmount;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdByDisplay;
    private String updatedByDisplay;
}
