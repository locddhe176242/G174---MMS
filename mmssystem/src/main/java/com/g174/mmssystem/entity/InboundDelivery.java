package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Inbound_Deliveries",
        indexes = {
                @Index(name = "idx_inbound_delivery_no", columnList = "inbound_delivery_no"),
                @Index(name = "idx_inbound_delivery_status", columnList = "status, deleted_at"),
                @Index(name = "idx_inbound_delivery_order", columnList = "order_id"),
                @Index(name = "idx_inbound_delivery_warehouse", columnList = "warehouse_id"),
                @Index(name = "idx_inbound_delivery_planned_date", columnList = "planned_date"),
                @Index(name = "idx_inbound_delivery_created_at", columnList = "created_at")
        })
public class InboundDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inbound_delivery_id")
    private Integer inboundDeliveryId;

    @Column(name = "inbound_delivery_no", length = 30, unique = true, nullable = false)
    private String inboundDeliveryNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "planned_date")
    private LocalDateTime plannedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private InboundDeliveryStatus status = InboundDeliveryStatus.Draft;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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

    @OneToMany(mappedBy = "inboundDelivery", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InboundDeliveryItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "inboundDelivery", cascade = CascadeType.ALL)
    @Builder.Default
    private List<GoodsReceipt> goodsReceipts = new ArrayList<>();

    public enum InboundDeliveryStatus {
        Draft,      // Purchase đang soạn
        Pending,    // Đã gửi, chờ Warehouse nhập kho
        Completed,  // Đã nhập kho (có GR)
        Cancelled   // Đã hủy
    }

    @PrePersist
    protected void onCreate() {
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
