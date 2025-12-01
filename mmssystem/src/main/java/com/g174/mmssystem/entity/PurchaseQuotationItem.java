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
@Table(name = "Purchase_Quotation_Items",
        indexes = {
                @Index(name = "idx_pqi_pq", columnList = "pq_id"),
                @Index(name = "idx_pqi_product", columnList = "product_id")
        })
public class PurchaseQuotationItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pq_item_id")
    private Integer pqItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pq_id", nullable = false)
    private PurchaseQuotation purchaseQuotation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_item_id", nullable = false)
    private RFQItem rfqItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "quantity", precision = 18, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 18, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate;

    @Column(name = "tax_amount", precision = 18, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "line_total", precision = 18, scale = 2, nullable = false)
    private BigDecimal lineTotal;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
}

