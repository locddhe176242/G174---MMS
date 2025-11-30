package com.g174.mmssystem.dto.responseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class ARPaymentResponseDTO {

    private Integer arPaymentId;
    private Integer arInvoiceId;
    private String invoiceNo;
    private BigDecimal amount;
    private Instant paymentDate;
    private String method;
    private String referenceNo;
    private String notes;
    private Instant createdAt;
}

