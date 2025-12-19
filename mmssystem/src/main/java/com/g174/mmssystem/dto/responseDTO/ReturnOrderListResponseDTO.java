package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.ReturnOrder;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ReturnOrderListResponseDTO {

    private Integer roId;
    private String returnNo;
    private ReturnOrder.ReturnStatus status;
    private ReturnOrder.GoodsReceiptStatus goodsReceiptStatus;

    private Integer deliveryId;
    private String deliveryNo;
    private Integer salesOrderId;
    private String salesOrderNo;

    private Integer invoiceId;
    private String invoiceNo;

    private Integer customerId;
    private String customerName;

    private Integer warehouseId;
    private String warehouseName;

    private Instant returnDate;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdByDisplay;
    private String updatedByDisplay;
}

