package com.g174.mmssystem.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
@Getter
@Setter
@Entity
@Table(name = "vendors",
        indexes = {
                @Index(name = "idx_vendor_name", columnList = "name"),
                @Index(name = "idx_vendor_code", columnList = "vendor_code", unique = true),
                @Index(name = "idx_vendor_address", columnList = "address_id"),
                @Index(name = "idx_vendor_contact", columnList = "contact_id")
        })
public class Vendor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vendor_id")
    private Integer vendorId;
    @NotBlank
    @Size(max = 255)
    @Column(name = "name", nullable = false)
    private String name;
    @NotBlank
    @Size(max = 255)
    @Column(name = "vendor_code", nullable = false, unique = true)
    private String vendorCode;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;
    @Column(name = "created_at")
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
    @Column(name = "deleted_at")
    private Instant deletedAt;
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}