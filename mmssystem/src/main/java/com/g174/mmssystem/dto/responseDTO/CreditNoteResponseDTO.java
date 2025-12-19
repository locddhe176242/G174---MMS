package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.CreditNote;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class CreditNoteResponseDTO {

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

    private BigDecimal subtotal;
    private BigDecimal headerDiscountPercent;
    private BigDecimal headerDiscountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    
    /**
     * Số tiền Credit Note được áp dụng để bù trừ vào balance của Invoice
     * (phần <= số tiền còn nợ)
     */
    private BigDecimal appliedToBalance;
    
    /**
     * Số tiền phải trả lại khách hàng (phần Credit Note vượt quá số tiền còn nợ)
     */
    private BigDecimal refundAmount;
    
    /**
     * Số tiền đã trả lại khách hàng (để track việc đã trả hay chưa)
     */
    private BigDecimal refundPaidAmount;

    private String reason;
    private String notes;

    private Instant createdAt;
    private String createdBy;
    private Instant updatedAt;
    private String updatedBy;

    private List<CreditNoteItemResponseDTO> items;
}
