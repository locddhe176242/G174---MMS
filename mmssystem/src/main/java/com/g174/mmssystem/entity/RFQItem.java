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
@Table(name = "RFQ_Items",
        indexes = {
                @Index(name = "idx_rfq_item_rfq", columnList = "rfq_id"),
                @Index(name = "idx_rfq_item_product", columnList = "product_id")
        })
public class RFQItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rfq_item_id")
    private Integer rfqItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", nullable = false)
    private RFQ rfq;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pri_id")
    private PurchaseRequisitionItem purchaseRequisitionItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "spec", columnDefinition = "TEXT")
    private String spec;

    @Column(name = "uom", length = 50)
    private String uom;

    @Column(name = "quantity", precision = 18, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "target_price", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal targetPrice = BigDecimal.ZERO;

    @Column(name = "price_unit", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal priceUnit = BigDecimal.ONE;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}

