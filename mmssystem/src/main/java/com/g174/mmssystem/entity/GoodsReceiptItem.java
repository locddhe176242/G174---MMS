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
@Table(name = "Goods_Receipt_Items",
        indexes = {
                @Index(name = "idx_gri_receipt", columnList = "receipt_id"),
                @Index(name = "idx_gri_idi", columnList = "idi_id"),
                @Index(name = "idx_gri_product", columnList = "product_id"),
                @Index(name = "idx_gri_return_item", columnList = "roi_id")
        })
public class GoodsReceiptItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gri_id")
    private Integer griId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id", nullable = false)
    private GoodsReceipt goodsReceipt;

    // Dùng khi phiếu nhập là từ Inbound Delivery (Purchase flow)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idi_id", nullable = true)
    private InboundDeliveryItem inboundDeliveryItem;

    // Dùng khi phiếu nhập là từ Đơn trả hàng (SalesReturn flow)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roi_id")
    private ReturnOrderItem returnOrderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "received_qty", precision = 18, scale = 2, nullable = false)
    private BigDecimal receivedQty;

    @Column(name = "accepted_qty", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal acceptedQty = BigDecimal.ZERO;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
}

