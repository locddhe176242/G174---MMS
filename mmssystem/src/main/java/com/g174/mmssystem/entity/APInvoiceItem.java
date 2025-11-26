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
@Table(name = "AP_Invoice_Items",
        indexes = {
                @Index(name = "idx_api_invoice", columnList = "ap_invoice_id")
        })
public class APInvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "api_id")
    private Integer apiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ap_invoice_id", nullable = false)
    private APInvoice apInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poi_id")
    private PurchaseOrderItem purchaseOrderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gri_id")
    private GoodsReceiptItem goodsReceiptItem;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "quantity", precision = 18, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate;

    @Column(name = "line_total", precision = 18, scale = 2)
    private BigDecimal lineTotal;
}
