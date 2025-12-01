package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.entity.APInvoice;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class APInvoiceRequestDTO {
    private String invoiceNo;
    private Integer vendorId;
    private Integer orderId;
    private Integer receiptId;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal balanceAmount;
    private BigDecimal headerDiscount;
    private APInvoice.APInvoiceStatus status;
    private String notes;
    private List<APInvoiceItemRequestDTO> items;
}
