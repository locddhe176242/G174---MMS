package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class SalesOrderRequestDTO {

    @NotNull(message = "Khách hàng bắt buộc")
    private Integer customerId;

    private Integer salesQuotationId;

    private LocalDate orderDate;

    private String shippingAddress;

    private String paymentTerms;

    private String deliveryTerms;

    private java.math.BigDecimal headerDiscountPercent;

    private String notes;

    @NotEmpty(message = "Cần ít nhất một dòng sản phẩm")
    @Valid
    private List<SalesOrderItemRequestDTO> items;
}