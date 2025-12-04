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
@Table(name = "Sales_Return_Inbound_Order_Items",
        indexes = {
                @Index(name = "idx_srii_sri", columnList = "sri_id"),
                @Index(name = "idx_srii_roi", columnList = "roi_id"),
                @Index(name = "idx_srii_product", columnList = "product_id"),
                @Index(name = "idx_srii_warehouse", columnList = "warehouse_id")
        })
public class SalesReturnInboundOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "srii_id")
    private Integer sriiId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sri_id", nullable = false)
    private SalesReturnInboundOrder inboundOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "roi_id", nullable = false)
    private ReturnOrderItem returnOrderItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "planned_qty", precision = 18, scale = 2, nullable = false)
    private BigDecimal plannedQty = BigDecimal.ZERO;

    @Column(name = "uom", length = 50)
    private String uom;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}


