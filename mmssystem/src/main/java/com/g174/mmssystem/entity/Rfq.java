package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "RFQs",
        indexes = {
                @Index(name = "idx_rfq_no", columnList = "rfq_no"),
                @Index(name = "idx_rfq_status", columnList = "status, deleted_at"),
                @Index(name = "idx_rfq_requisition", columnList = "requisition_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rfq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rfq_id")
    private Integer rfqId;

    @Column(name = "rfq_no", nullable = false, unique = true, length = 30)
    private String rfqNo;

    @Column(name = "requisition_id")
    private Integer requisitionId;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status = Status.DRAFT;

    @Column(name = "selected_vendor_id")
    private Integer selectedVendorId;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "RFQ_Vendors",
            joinColumns = @JoinColumn(name = "rfq_id"),
            inverseJoinColumns = @JoinColumn(name = "vendor_id")
    )
    @Builder.Default
    private Set<Vendor> selectedVendors = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "rfq", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RfqItem> items = new ArrayList<>();

    public enum Status {
        DRAFT("Draft"),
        PENDING("Pending"),
        SENT("Sent"),
        CLOSED("Closed"),
        CANCELLED("Cancelled");

        private final String label;

        Status(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}


