package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreditNoteRequestDTO {

    @NotNull(message = "Thiếu Invoice ID")
    private Integer invoiceId;

    private Integer returnOrderId;

    private LocalDate creditNoteDate;

    private java.math.BigDecimal headerDiscountPercent;

    private String reason;

    private String notes;

    @Valid
    @NotEmpty(message = "Cần ít nhất một dòng sản phẩm")
    private List<CreditNoteItemRequestDTO> items;
}

