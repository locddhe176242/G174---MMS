package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class ARPaymentRequestDTO {

    @NotNull(message = "Invoice ID không được để trống")
    private Integer invoiceId;

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền thanh toán phải lớn hơn 0")
    private BigDecimal amount;

    private Instant paymentDate;

    private String method;

    private String referenceNo;

    private String notes;
}

