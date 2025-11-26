package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "AP_Payments",
        indexes = {
                @Index(name = "idx_app_invoice", columnList = "ap_invoice_id"),
                @Index(name = "idx_app_date", columnList = "payment_date")
        })
public class APPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ap_payment_id")
    private Integer apPaymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ap_invoice_id", nullable = false)
    private APInvoice apInvoice;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "method", length = 50)
    private String method;

    @Column(name = "reference_no", length = 100)
    private String referenceNo;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (paymentDate == null) {
            paymentDate = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
