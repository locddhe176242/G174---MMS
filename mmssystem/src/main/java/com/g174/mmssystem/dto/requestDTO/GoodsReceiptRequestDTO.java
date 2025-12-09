package com.g174.mmssystem.dto.requestDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.g174.mmssystem.entity.GoodsReceipt;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptRequestDTO {
    private String receiptNo;

    // For Purchase: orderId is required
    // For SalesReturn: sriId is required, orderId is null
    private Integer orderId;

    // For SalesReturn: Sales Return Inbound Order ID
    private Integer sriId;

    @NotNull(message = "Warehouse ID là bắt buộc")
    private Integer warehouseId;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss[.SSS]", shape = JsonFormat.Shape.STRING)
    private LocalDateTime receivedDate;

    private Integer createdById;

    // Source type: Purchase or SalesReturn
    @Builder.Default
    private GoodsReceipt.SourceType sourceType = GoodsReceipt.SourceType.Purchase;

    // Items: Required for Purchase, optional for SalesReturn (can be auto-created)
    @Valid
    private List<GoodsReceiptItemRequestDTO> items;
}

