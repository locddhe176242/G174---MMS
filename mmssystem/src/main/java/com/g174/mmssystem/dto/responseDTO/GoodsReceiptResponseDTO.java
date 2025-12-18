package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.GoodsReceipt;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptResponseDTO {
    private Integer receiptId;
    private String receiptNo;
    
    private GoodsReceipt.SourceType sourceType;
    
    // For Purchase flow
    private Integer inboundDeliveryId;
    private String inboundDeliveryNo;
    private Integer orderId;  // From Inbound Delivery -> PO
    private String poNo;      // From Inbound Delivery -> PO
    
    // For SalesReturn flow
    private Integer roId;
    private String returnNo;
    private Integer sriId;
    private String sriNo;
    
    private Integer warehouseId;
    private String warehouseName;
    private String warehouseCode;
    private LocalDateTime receivedDate;
    private GoodsReceipt.GoodsReceiptStatus status;
    private Integer createdById;
    private String createdByName;
    private Integer approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<GoodsReceiptItemResponseDTO> items;
    private Boolean hasInvoice; // Đánh dấu GR đã được tạo invoice
    
    // Thông tin tiến độ nhập kho
    private Double totalReceivedQty; // Tổng số lượng đã nhận (tất cả các GR của Inbound Delivery này)
    private Double totalExpectedQty;  // Tổng số lượng dự kiến
    private String inboundDeliveryStatus; // Trạng thái của Inbound Delivery
}

