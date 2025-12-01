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
@Table(name = "vendor_balances",
        indexes = {
                @Index(name = "idx_vendor_balance", columnList = "vendor_id"),
                @Index(name = "idx_outstanding_balance", columnList = "outstanding_balance")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_vendor_balance", columnNames = "vendor_id")
        })
public class VendorBalance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "balance_id")
    private Integer balanceId;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, unique = true)
    private Vendor vendor;

    @Column(name = "total_invoiced", precision = 18, scale = 2)
    private BigDecimal totalInvoiced = BigDecimal.ZERO;

    @Column(name = "total_paid", precision = 18, scale = 2)
    private BigDecimal totalPaid = BigDecimal.ZERO;

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
     * outstanding_balance = total_invoiced - total_paid
     */
    public void recalculateOutstandingBalance() {
        outstandingBalance = totalInvoiced
                .subtract(totalPaid)
                .max(BigDecimal.ZERO);
    }
}
