package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.CreditNote;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class CreditNoteListResponseDTO {

    private Integer cnId;
    private String creditNoteNo;
    private CreditNote.CreditNoteStatus status;

    private Integer invoiceId;
    private String invoiceNo;
    private Integer salesOrderId;
    private String salesOrderNo;

    private Integer returnOrderId;
    private String returnOrderNo;

    private Integer customerId;
    private String customerName;

    private Instant creditNoteDate;

    private BigDecimal totalAmount;
    
    /**
     * Số tiền Credit Note được áp dụng để bù trừ vào balance của Invoice
     */
    private BigDecimal appliedToBalance;
    
    /**
     * Số tiền phải trả lại khách hàng
     */
    private BigDecimal refundAmount;
    
    /**
     * Số tiền đã trả lại khách hàng
     */
    private BigDecimal refundPaidAmount;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdByDisplay;
    private String updatedByDisplay;
}

