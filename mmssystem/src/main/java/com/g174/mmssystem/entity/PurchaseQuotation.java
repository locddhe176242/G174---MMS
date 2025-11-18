package com.g174.mmssystem.entity;

import com.g174.mmssystem.enums.PurchaseQuotationStatus;
import jakarta.persistence.*;
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
@Entity
@Table(name = "Purchase_Quotations",
        indexes = {
                @Index(name = "idx_pq_no", columnList = "pq_no"),
                @Index(name = "idx_pq_status", columnList = "status, deleted_at"),
                @Index(name = "idx_pq_rfq", columnList = "rfq_id"),
                @Index(name = "idx_pq_vendor", columnList = "vendor_id")
        })
public class PurchaseQuotation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pq_id")
    private Integer pqId;

    @Column(name = "pq_no", length = 30, unique = true, nullable = false)
    private String pqNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", nullable = false)
    private RFQ rfq;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "pq_date")
    private LocalDateTime pqDate;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "is_tax_included")
    @Builder.Default
    private Boolean isTaxIncluded = false;

    @Column(name = "delivery_terms", length = 255)
    private String deliveryTerms;

    @Column(name = "payment_terms", length = 255)
    private String paymentTerms;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "warranty_months")
    private Integer warrantyMonths;

    @Column(name = "header_discount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal headerDiscount = BigDecimal.ZERO;

    @Column(name = "shipping_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private PurchaseQuotationStatus status = PurchaseQuotationStatus.Pending;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "purchaseQuotation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseQuotationItem> items;

    @PrePersist
    protected void onCreate() {
        if (pqDate == null) {
            pqDate = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

