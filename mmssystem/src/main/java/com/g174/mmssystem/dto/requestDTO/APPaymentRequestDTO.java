package com.g174.mmssystem.dto.requestDTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class APPaymentRequestDTO {
    private Integer apInvoiceId;
    private LocalDateTime paymentDate;
    private BigDecimal amount;
    private String method;
    private String referenceNo;
    private String notes;
}
