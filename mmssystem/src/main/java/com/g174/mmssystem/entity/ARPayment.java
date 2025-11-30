package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "ar_payments",
        indexes = {
                @Index(name = "idx_arp_invoice", columnList = "ar_invoice_id"),
                @Index(name = "idx_arp_date", columnList = "payment_date")
        })
public class ARPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ar_payment_id")
    private Integer arPaymentId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ar_invoice_id", nullable = false)
    private ARInvoice invoice;

    @NotNull
    @DecimalMin(value = "0.01", inclusive = true)
    @DecimalMax(value = "999999999999999.99", inclusive = true)
    @Column(name = "amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_date")
    private Instant paymentDate;

    @Size(max = 50)
    @Column(name = "method", length = 50)
    private String method;

    @Size(max = 100)
    @Column(name = "reference_no", length = 100)
    private String referenceNo;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (paymentDate == null) {
            paymentDate = Instant.now();
        }
    }
}

