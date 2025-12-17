package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class SalesQuotationRequestDTO {

    @NotNull(message = "Khách hàng bắt buộc")
    private Integer customerId;

    private LocalDate quotationDate;

    @Size(max = 255)
    private String paymentTerms;

    @Size(max = 255)
    private String deliveryTerms;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal headerDiscountPercent = BigDecimal.ZERO;

    private String notes;

    @NotEmpty(message = "Cần ít nhất một dòng sản phẩm")
    @Valid
    private List<SalesQuotationItemRequestDTO> items;
}