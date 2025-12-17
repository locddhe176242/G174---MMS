package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "return_orders", indexes = {
        @Index(name = "idx_return_order_status", columnList = "status, deleted_at"),
        @Index(name = "idx_return_order_delivery", columnList = "delivery_id"),
        @Index(name = "idx_return_order_invoice", columnList = "invoice_id"),
        @Index(name = "idx_return_order_receipt", columnList = "receipt_id"),
        @Index(name = "idx_return_order_gr_status", columnList = "goods_receipt_status")
})
public class ReturnOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ro_id")
    private Integer roId;

    @Size(max = 30)
    @Column(name = "return_no", unique = true, nullable = false)
    private String returnNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "delivery_id", nullable = false)
    private Delivery delivery;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private ARInvoice invoice;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "return_date")
    private Instant returnDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ReturnStatus status = ReturnStatus.Draft;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "goods_receipt_status")
    private GoodsReceiptStatus goodsReceiptStatus = GoodsReceiptStatus.None;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id")
    private GoodsReceipt goodsReceipt;

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

    @OneToMany(mappedBy = "returnOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReturnOrderItem> items = new ArrayList<>();

    public enum ReturnStatus {
        Draft,
        Approved,
        Completed,
        Cancelled
    }

    public enum GoodsReceiptStatus {
        None,
        Pending,
        Completed
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (returnDate == null) {
            returnDate = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
