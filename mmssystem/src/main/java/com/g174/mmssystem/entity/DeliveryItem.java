package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "delivery_items",
        indexes = {
                @Index(name = "idx_delivery_item_delivery", columnList = "delivery_id"),
                @Index(name = "idx_delivery_item_soi", columnList = "soi_id"),
                @Index(name = "idx_delivery_item_product", columnList = "product_id")
        })
public class DeliveryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "di_id")
    private Integer diId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "delivery_id", nullable = false)
    private Delivery delivery;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "soi_id", nullable = false)
    private SalesOrderItem salesOrderItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "ordered_qty", precision = 18, scale = 2)
    private BigDecimal orderedQty = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "planned_qty", precision = 18, scale = 2)
    private BigDecimal plannedQty = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "delivered_qty", precision = 18, scale = 2)
    private BigDecimal deliveredQty = BigDecimal.ZERO;

    @Column(name = "uom", length = 50)
    private String uom;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}

