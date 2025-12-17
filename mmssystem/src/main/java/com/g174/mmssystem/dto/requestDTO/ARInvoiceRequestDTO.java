package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ARInvoiceRequestDTO {

    @NotNull(message = "Delivery ID không được để trống")
    private Integer deliveryId;

    private Integer salesOrderId;

    @NotNull(message = "Customer ID không được để trống")
    private Integer customerId;

    private LocalDate invoiceDate;

    private LocalDate dueDate;

    private java.math.BigDecimal headerDiscountPercent;

    private String notes;

    private List<ARInvoiceItemRequestDTO> items;
}
