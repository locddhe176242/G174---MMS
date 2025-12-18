package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Purchase_Order_Items",
        indexes = {
                @Index(name = "idx_poi_order", columnList = "order_id"),
                @Index(name = "idx_poi_product", columnList = "product_id")
        })
public class PurchaseOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "poi_id")
    private Integer poiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pq_item_id")
    private PurchaseQuotationItem purchaseQuotationItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")  // Removed nullable=false to allow manual PO entry
    private Product product;

    @Column(name = "uom", length = 50)
    private String uom;

    @Column(name = "quantity", precision = 18, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "received_qty", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal receivedQty = BigDecimal.ZERO;

    @Column(name = "invoiced_qty", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal invoicedQty = BigDecimal.ZERO;

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

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}

