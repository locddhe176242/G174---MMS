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

    private Instant createdAt;
    private Instant updatedAt;
    private String createdByDisplay;
    private String updatedByDisplay;
}

