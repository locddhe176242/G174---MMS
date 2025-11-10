package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Builder
@Entity
@Table(name = "Purchase_Requisition_Items")
public class PurchaseRequisitionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pri_id")
    private Long priId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", nullable = false)
    private PurchaseRequisition purchaseRequisition;


    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String spec;

    @Column(length = 50)
    private String uom;

    @Column(name = "requested_qty", precision = 18, scale = 2, nullable = false)
    private BigDecimal requestedQty;

    @Column(name = "target_unit_price", precision = 18, scale = 2)
    private BigDecimal targetUnitPrice;

    @Column(name = "suggested_vendor_id")
    private Long suggestedVendorId;

    @Column(columnDefinition = "TEXT")
    private String note;
}
