package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Purchase_Requisition_Items",
        indexes = {
                @Index(name = "idx_pri_requisition", columnList = "requisition_id"),
                @Index(name = "idx_pri_product", columnList = "product_id")
        })
public class PurchaseRequisitionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pri_id")
    private Integer priId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", nullable = false)
    private PurchaseRequisition purchaseRequisition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "requested_qty", precision = 18, scale = 2)
    private BigDecimal requestedQty;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

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
}

