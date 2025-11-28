package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "sales_order_items",
        indexes = {
                @Index(name = "idx_soi_order", columnList = "so_id"),
                @Index(name = "idx_soi_product", columnList = "product_id")
        })
public class SalesOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "soi_id")
    private Integer soiId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "so_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @Size(max = 50)
    @Column(name = "uom")
    private String uom;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "quantity", precision = 18, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "discount_amount", precision = 18, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "100.0", inclusive = true)
    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "tax_amount", precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "line_total", precision = 18, scale = 2)
    private BigDecimal lineTotal = BigDecimal.ZERO;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}
