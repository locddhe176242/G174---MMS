package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.APInvoice;
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
    private Integer vendorId;
    private String vendorName;
    private String vendorCode;
    private LocalDateTime paymentDate;
    private BigDecimal amount;
    private String method;
    private String referenceNo;
    private String notes;
    private APInvoice.APInvoiceStatus invoiceStatus;
    private LocalDateTime createdAt;
}
