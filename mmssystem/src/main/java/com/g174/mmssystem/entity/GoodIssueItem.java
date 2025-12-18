package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Good_Issue_Items",
        indexes = {
                @Index(name = "idx_gii_issue", columnList = "issue_id"),
                @Index(name = "idx_gii_product", columnList = "product_id"),
                @Index(name = "idx_gii_delivery_item", columnList = "di_id"),
                @Index(name = "idx_gii_warehouse", columnList = "warehouse_id")
        })
public class GoodIssueItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gii_id")
    private Integer giiId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id", nullable = false)
    private GoodIssue goodIssue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "di_id", nullable = false)
    private DeliveryItem deliveryItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "issued_qty", precision = 18, scale = 2, nullable = false)
    private BigDecimal issuedQty;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
}
