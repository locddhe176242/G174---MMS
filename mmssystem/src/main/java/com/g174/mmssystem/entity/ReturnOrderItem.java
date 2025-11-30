package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "return_order_items",
        indexes = {
                @Index(name = "idx_return_item_return_order", columnList = "ro_id"),
                @Index(name = "idx_return_item_delivery_item", columnList = "di_id"),
                @Index(name = "idx_return_item_product", columnList = "product_id")
        })
public class ReturnOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roi_id")
    private Integer roiId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ro_id", nullable = false)
    private ReturnOrder returnOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "di_id", nullable = false)
    private DeliveryItem deliveryItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "returned_qty", precision = 18, scale = 2, nullable = false)
    private BigDecimal returnedQty = BigDecimal.ZERO;

    @Column(name = "uom", length = 50)
    private String uom;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}

