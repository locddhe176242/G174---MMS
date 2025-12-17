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
@Table(name = "ar_invoices", indexes = {
        @Index(name = "idx_ar_status", columnList = "status"),
        @Index(name = "idx_ar_customer", columnList = "customer_id"),
        @Index(name = "idx_ar_so", columnList = "so_id")
})
public class ARInvoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ar_invoice_id")
    private Integer arInvoiceId;

    @Size(max = 50)
    @Column(name = "invoice_no", unique = true)
    private String invoiceNo;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "so_id")
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id")
    private Delivery delivery;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "subtotal", precision = 18, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

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
    @Column(name = "tax_amount", precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "total_amount", precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "balance_amount", precision = 18, scale = 2)
    private BigDecimal balanceAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InvoiceStatus status = InvoiceStatus.Unpaid;

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

    @OneToMany(mappedBy = "invoice", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private List<ARInvoiceItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private List<ARPayment> payments = new ArrayList<>();

    public enum InvoiceStatus {
        Unpaid, PartiallyPaid, Paid, Cancelled
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (invoiceDate == null) {
            invoiceDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}