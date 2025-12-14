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
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "sales_orders",
        indexes = {
                @Index(name = "idx_so_status", columnList = "status"),
                @Index(name = "idx_so_approval", columnList = "approval_status"),
                @Index(name = "idx_so_customer", columnList = "customer_id"),
                @Index(name = "idx_so_sq", columnList = "sq_id"),
                @Index(name = "idx_so_approver", columnList = "approver_id")
        })
public class SalesOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "so_id")
    private Integer soId;

    @Size(max = 30)
    @Column(name = "so_no", unique = true)
    private String soNo;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sq_id")
    private SalesQuotation salesQuotation;

    @Column(name = "order_date")
    private Instant orderDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OrderStatus status = OrderStatus.Pending;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status")
    private ApprovalStatus approvalStatus = ApprovalStatus.Pending;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Size(max = 255)
    @Column(name = "payment_terms")
    private String paymentTerms;

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

    public enum OrderStatus {
        Draft, Pending, Approved, Fulfilled, Cancelled
    }

    public enum ApprovalStatus {
        Draft, Pending, Approved, Rejected
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (orderDate == null) {
            orderDate = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SalesOrderItem> items = new ArrayList<>();
}