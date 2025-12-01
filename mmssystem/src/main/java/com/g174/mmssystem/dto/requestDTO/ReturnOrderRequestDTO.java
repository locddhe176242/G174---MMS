package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ReturnOrderRequestDTO {

    @NotNull(message = "Thiếu Delivery ID")
    private Integer deliveryId;

    private Integer invoiceId;

    @NotNull(message = "Thiếu kho nhận hàng trả lại")
    private Integer warehouseId;

    private LocalDate returnDate;

    private String reason;

    private String notes;

    @Valid
    @NotEmpty(message = "Cần ít nhất một dòng sản phẩm trả lại")
    private List<ReturnOrderItemRequestDTO> items;
}

