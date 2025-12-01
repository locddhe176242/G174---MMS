package com.g174.mmssystem.dto.requestDTO;

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

    @NotNull(message = "Purchase Order ID là bắt buộc")
    private Integer orderId;

    @NotNull(message = "Warehouse ID là bắt buộc")
    private Integer warehouseId;

    private LocalDateTime receivedDate;

    private Integer createdById;

    @NotEmpty(message = "Danh sách items không được để trống")
    private List<GoodsReceiptItemRequestDTO> items;
}

