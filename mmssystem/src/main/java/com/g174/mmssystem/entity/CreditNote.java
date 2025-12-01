package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "credit_notes",
        indexes = {
                @Index(name = "idx_credit_note_status", columnList = "status, deleted_at"),
                @Index(name = "idx_credit_note_invoice", columnList = "invoice_id"),
                @Index(name = "idx_credit_note_return_order", columnList = "ro_id")
        })
public class CreditNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_id")
    private Integer cnId;

    @Size(max = 30)
    @Column(name = "credit_note_no", unique = true, nullable = false)
    private String creditNoteNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private ARInvoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ro_id")
    private ReturnOrder returnOrder;

    @Column(name = "credit_note_date", nullable = false)
    private Instant creditNoteDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private CreditNoteStatus status = CreditNoteStatus.Draft;

    @Column(name = "subtotal", precision = 18, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "creditNote", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CreditNoteItem> items = new ArrayList<>();

    public enum CreditNoteStatus {
        Draft,    // Nháp
        Issued,   // Đã xuất
        Applied,  // Đã áp dụng (vào Invoice)
        Cancelled // Đã hủy
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (creditNoteDate == null) {
            creditNoteDate = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}

