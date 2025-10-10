package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "users",
        indexes = {
                @Index(name = "idx_users_username", columnList = "username", unique = true),
                @Index(name = "idx_users_email", columnList = "email", unique = true),
                @Index(name = "idx_users_employee_code", columnList = "employee_code", unique = true),
                @Index(name = "idx_users_department_id", columnList = "department_id"),
                @Index(name = "idx_users_status_deleted", columnList = "status, deleted_at"),
                @Index(name = "idx_users_last_login", columnList = "last_login DESC"),
                @Index(name = "idx_users_created_at", columnList = "created_at DESC")
        })
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id", nullable = false)
    private Integer id;

    @Size(max = 255)
    @NotNull
    @Column(name = "username", nullable = false)
    private String username;

    @Size(max = 255)
    @NotNull
    @Column(name = "email", nullable = false)
    private String email;

    @Size(max = 255)
    @NotNull
    @Column(name = "password", nullable = false)
    private String password;

    @Size(max = 50)
    @NotNull
    @Column(name = "employee_code", nullable = false, length = 50)
    private String employeeCode;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserStatus status = UserStatus.Active;

    @Size(max = 6)
    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_expiry")
    private Instant otpExpiry;

    @Column(name = "otp_used")
    private Boolean otpUsed = false;

    @Column(name = "otp_attempts")
    private Integer otpAttempts = 0;

    @Column(name = "last_otp_request_time")
    private Instant lastOtpRequestTime;

    @Column(name = "last_login")
    private Instant lastLogin;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserProfile profile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Set<UserRole> userRoles = new HashSet<>();

    public enum UserStatus {
        Active, Inactive
    }

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