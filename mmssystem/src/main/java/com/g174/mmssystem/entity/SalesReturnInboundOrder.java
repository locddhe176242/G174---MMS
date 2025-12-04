package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Sales_Return_Inbound_Orders",
        indexes = {
                @Index(name = "idx_sri_no", columnList = "sri_no"),
                @Index(name = "idx_sri_status", columnList = "status, deleted_at"),
                @Index(name = "idx_sri_ro", columnList = "ro_id"),
                @Index(name = "idx_sri_warehouse", columnList = "warehouse_id")
        })
public class SalesReturnInboundOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sri_id")
    private Integer sriId;

    @Column(name = "sri_no", length = 30, unique = true, nullable = false)
    private String sriNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ro_id", nullable = false)
    private ReturnOrder returnOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "expected_receipt_date")
    private LocalDateTime expectedReceiptDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    @Builder.Default
    private Status status = Status.Draft;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "inboundOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SalesReturnInboundOrderItem> items = new ArrayList<>();

    public enum Status {
        Draft,
        Approved,
        SentToWarehouse,
        Completed,
        Cancelled
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}


