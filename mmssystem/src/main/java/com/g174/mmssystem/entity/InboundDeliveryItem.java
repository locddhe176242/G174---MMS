package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Inbound_Delivery_Items",
        indexes = {
                @Index(name = "idx_idi_inbound_delivery", columnList = "inbound_delivery_id"),
                @Index(name = "idx_idi_poi", columnList = "poi_id"),
                @Index(name = "idx_idi_product", columnList = "product_id")
        })
public class InboundDeliveryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idi_id")
    private Integer idiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inbound_delivery_id", nullable = false)
    private InboundDelivery inboundDelivery;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poi_id", nullable = false)
    private PurchaseOrderItem purchaseOrderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "expected_qty", precision = 18, scale = 2, nullable = false)
    private BigDecimal expectedQty;

    @Column(name = "uom", length = 50)
    private String uom;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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
