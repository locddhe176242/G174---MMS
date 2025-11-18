package com.g174.mmssystem.entity;

import com.g174.mmssystem.enums.PurchaseOrderApprovalStatus;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Purchase_Orders",
        indexes = {
                @Index(name = "idx_po_no", columnList = "po_no"),
                @Index(name = "idx_po_status", columnList = "status, approval_status, deleted_at"),
                @Index(name = "idx_po_vendor", columnList = "vendor_id")
        })
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "po_no", length = 30, unique = true, nullable = false)
    private String poNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pq_id")
    private PurchaseQuotation purchaseQuotation;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private PurchaseOrderStatus status = PurchaseOrderStatus.Pending;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private PurchaseOrderApprovalStatus approvalStatus = PurchaseOrderApprovalStatus.Pending;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "payment_terms", length = 255)
    private String paymentTerms;

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "total_before_tax", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalBeforeTax = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_after_tax", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAfterTax = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderItem> items;

    @PrePersist
    protected void onCreate() {
        if (orderDate == null) {
            orderDate = LocalDateTime.now();
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

