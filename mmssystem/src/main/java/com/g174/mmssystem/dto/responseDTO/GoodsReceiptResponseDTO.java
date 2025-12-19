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
    
    // For Purchase flow: Direct PO → GR
    private Integer orderId;
    private String poNo;
    
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
    
    // Progress tracking fields for partial delivery
    private Integer totalReceivedQty;  // Tổng số lượng đã nhận (từ tất cả GR của PO)
    private Integer totalExpectedQty;   // Tổng số lượng dự kiến (từ PO)
    private String poStatus;            // Trạng thái của Purchase Order
}
