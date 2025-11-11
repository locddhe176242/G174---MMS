package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "RFQ_Items",
        indexes = {
                @Index(name = "idx_rfq_item_rfq", columnList = "rfq_id"),
                @Index(name = "idx_rfq_item_product", columnList = "product_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RfqItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rfq_item_id")
    private Integer rfqItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", nullable = false)
    private Rfq rfq;

    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "spec", columnDefinition = "TEXT")
    private String spec;

    @Column(name = "uom", length = 50)
    private String uom;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 2)
    private BigDecimal quantity;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "target_price", precision = 18, scale = 2)
    private BigDecimal targetPrice;

    @Column(name = "price_unit", precision = 10, scale = 2)
    private BigDecimal priceUnit;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}


