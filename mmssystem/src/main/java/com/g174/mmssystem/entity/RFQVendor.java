package com.g174.mmssystem.entity;

import com.g174.mmssystem.enums.RFQVendorStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "RFQ_Vendors",
        indexes = {
                @Index(name = "idx_rfq_vendor_vendor", columnList = "vendor_id")
        })
@IdClass(RFQVendorId.class)
public class RFQVendor implements Serializable {

    @Id
    @Column(name = "rfq_id", nullable = false)
    private Integer rfqId;

    @Id
    @Column(name = "vendor_id", nullable = false)
    private Integer vendorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private RFQVendorStatus status = RFQVendorStatus.Invited;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", insertable = false, updatable = false)
    private RFQ rfq;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", insertable = false, updatable = false)
    private Vendor vendor;
}

