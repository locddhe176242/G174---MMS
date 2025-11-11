package com.g174.mmssystem.entity;

import com.g174.mmssystem.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "Purchase_Requisitions")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Builder
public class PurchaseRequisition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "requisition_id")
    private Long requisitionId;

    @Column(name = "requisition_no", length = 30, unique = true, nullable = false)
    private String requisitionNo;

    @Column(name = "requisition_date")
    private LocalDate requisitionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(columnDefinition = "TEXT")
    private String purpose;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(name = "needed_by")
    private LocalDate neededBy;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Priority priority = Priority.Medium;

    @Builder.Default
    @Column(name = "total_estimated", precision = 18, scale = 2)
    private BigDecimal totalEstimated = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "currency_code", length = 10)
    private String currencyCode = "VND";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    private ApprovalStatus approvalStatus = ApprovalStatus.Draft;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_remarks", columnDefinition = "TEXT")
    private String approvalRemarks;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RequisitionStatus status = RequisitionStatus.Open;

    @Column(name = "converted_to_po_id")
    private Long convertedToPoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "purchaseRequisition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequisitionItem> items;
}
