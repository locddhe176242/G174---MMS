package com.g174.mmssystem.dto.responseDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class PurchaseOrderDTO {
    private Integer orderId;
    private String poNo;
    private Integer vendorId;
    private String vendorName;
    private Instant orderDate;
    private String status;
    private String approvalStatus;
    private String paymentTerms;
    private Instant deliveryDate;
    private String shippingAddress;
    private BigDecimal totalAmount;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}