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
    
    private Integer orderId;
    private String poNo;
    
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
}

