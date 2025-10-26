package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Activity_Logs", indexes = {
        @Index(name = "idx_log_user", columnList = "user_id"),
        @Index(name = "idx_log_entity", columnList = "entity_id"),
        @Index(name = "idx_log_date", columnList = "log_date")
})
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "action")
    private String action;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "activity_type", length = 50)
    private String activityType;

    @Column(name = "entity_id")
    private Integer entityId;

    @CreationTimestamp
    @Column(name = "log_date")
    private LocalDateTime logDate;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;
}