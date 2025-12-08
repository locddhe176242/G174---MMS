package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesReturnInboundOrderRequestDTO {

    @NotNull(message = "Return Order ID là bắt buộc")
    private Integer roId;

    private Integer warehouseId;

    private LocalDateTime expectedReceiptDate;

    private String notes;
}


