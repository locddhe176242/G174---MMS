package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "sales_quotations",
        indexes = {
                @Index(name = "idx_sq_status", columnList = "status"),
                @Index(name = "idx_sq_customer", columnList = "customer_id")
        })
public class SalesQuotation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sq_id")
    private Integer sqId;

    @Size(max = 30)
    @Column(name = "quotation_no", unique = true)
    private String quotationNo;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "quotation_date")
    private Instant quotationDate;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Size(max = 255)
    @Column(name = "payment_terms")
    private String paymentTerms;

    @Size(max = 255)
    @Column(name = "delivery_terms")
    private String deliveryTerms;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "100.0", inclusive = true)
    @Column(name = "header_discount_percent", precision = 5, scale = 2)
    private BigDecimal headerDiscountPercent = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "header_discount_amount", precision = 18, scale = 2)
    private BigDecimal headerDiscountAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "subtotal", precision = 18, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "tax_amount", precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "total_amount", precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private QuotationStatus status = QuotationStatus.Draft;

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

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "salesQuotation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SalesQuotationItem> items = new ArrayList<>();

    public enum QuotationStatus {
        Draft, Active, Converted, Cancelled, Expired
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (quotationDate == null) {
            quotationDate = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}