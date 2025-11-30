package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "customer_balances",
        indexes = {
                @Index(name = "idx_customer_balance", columnList = "customer_id"),
                @Index(name = "idx_outstanding_balance", columnList = "outstanding_balance")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_customer_balance", columnNames = "customer_id")
        })
public class CustomerBalance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "balance_id")
    private Integer balanceId;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Column(name = "total_invoiced", precision = 18, scale = 2)
    private BigDecimal totalInvoiced = BigDecimal.ZERO;

    @Column(name = "total_paid", precision = 18, scale = 2)
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @Column(name = "total_credit_note", precision = 18, scale = 2)
    private BigDecimal totalCreditNote = BigDecimal.ZERO;

    @Column(name = "outstanding_balance", precision = 18, scale = 2)
    private BigDecimal outstandingBalance = BigDecimal.ZERO;

    @Column(name = "last_updated_at")
    private Instant lastUpdatedAt;

    @PrePersist
    protected void onCreate() {
        lastUpdatedAt = Instant.now();
        recalculateOutstandingBalance();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdatedAt = Instant.now();
        recalculateOutstandingBalance();
    }

    /**
     * Tính lại outstanding balance
     * outstanding_balance = total_invoiced - total_paid - total_credit_note
     */
    public void recalculateOutstandingBalance() {
        outstandingBalance = totalInvoiced
                .subtract(totalPaid)
                .subtract(totalCreditNote)
                .max(BigDecimal.ZERO);
    }
}

