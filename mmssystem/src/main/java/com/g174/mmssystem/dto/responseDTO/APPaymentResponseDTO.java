package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class APPaymentResponseDTO {
    private Integer apPaymentId;
    private Integer apInvoiceId;
    private String invoiceNo;
    private LocalDateTime paymentDate;
    private BigDecimal amount;
    private String method;
    private String referenceNo;
    private String notes;
    private LocalDateTime createdAt;
}
