package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Purchase_Requisition_Items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequisitionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pri_id")
    private Integer priId;

    @Column(name = "requisition_id", nullable = false)
    private Integer requisitionId;

    @Column(name = "product_id", nullable = false)
    private Integer productId;  // CHANGED: Long -> Integer

    @Column(name = "requested_qty", nullable = false, precision = 18, scale = 2)
    private BigDecimal requestedQty;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "valuation_price", precision = 18, scale = 2)
    private BigDecimal valuationPrice;

    @Column(name = "price_unit", precision = 10, scale = 2)
    private BigDecimal priceUnit = BigDecimal.ONE;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}