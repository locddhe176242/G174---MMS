package com.g174.mmssystem.entity;

import com.g174.mmssystem.enums.RequisitionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Purchase_Requisitions",
        indexes = {
                @Index(name = "idx_pr_no", columnList = "requisition_no"),
                @Index(name = "idx_pr_status", columnList = "status, deleted_at"),
                @Index(name = "idx_pr_requester", columnList = "requester_id"),
                @Index(name = "idx_pr_approver", columnList = "approver_id"),
                @Index(name = "idx_pr_created_at", columnList = "created_at"),
                @Index(name = "idx_pr_date", columnList = "requisition_date")
        })
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
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private RequisitionStatus status = RequisitionStatus.Draft;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "purchaseRequisition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequisitionItem> items;
}

