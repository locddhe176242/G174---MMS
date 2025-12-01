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
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;

    private String reason;
    private String notes;

    private Instant createdAt;
    private String createdBy;
    private Instant updatedAt;
    private String updatedBy;

    private List<CreditNoteItemResponseDTO> items;
}

