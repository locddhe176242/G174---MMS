package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.APInvoice;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class APInvoiceResponseDTO {
    private Integer apInvoiceId;
    private String invoiceNo;
    private Integer vendorId;
    private String vendorName;
    private String vendorCode;
    private Integer orderId;
    private String poNo;
    private Integer receiptId;
    private String receiptNo;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal balanceAmount;
    private APInvoice.APInvoiceStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<APInvoiceItemResponseDTO> items;
    private List<APPaymentResponseDTO> payments;
}
