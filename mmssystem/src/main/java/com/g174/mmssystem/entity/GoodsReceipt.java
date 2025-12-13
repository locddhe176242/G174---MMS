package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Goods_Receipts",
        indexes = {
                @Index(name = "idx_gr_no", columnList = "receipt_no"),
                @Index(name = "idx_gr_status", columnList = "status, deleted_at"),
                @Index(name = "idx_gr_order", columnList = "order_id"),
                @Index(name = "idx_gr_warehouse", columnList = "warehouse_id"),
                @Index(name = "idx_gr_return_order", columnList = "ro_id"),
                @Index(name = "idx_gr_source_type", columnList = "source_type")
        })
public class GoodsReceipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "receipt_id")
    private Integer receiptId;

    @Column(name = "receipt_no", length = 30, unique = true, nullable = false)
    private String receiptNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = true)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "received_date")
    private LocalDateTime receivedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private GoodsReceiptStatus status = GoodsReceiptStatus.Pending;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type")
    @Builder.Default
    private SourceType sourceType = SourceType.Purchase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ro_id")
    private ReturnOrder returnOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "goodsReceipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoodsReceiptItem> items;

    public enum GoodsReceiptStatus {
        Pending, Approved, Rejected
    }

    public enum SourceType {
        Purchase,
        SalesReturn
    }

    @PrePersist
    protected void onCreate() {
        if (receivedDate == null) {
            receivedDate = LocalDateTime.now();
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
