package com.g174.mmssystem.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.g174.mmssystem.enums.ReportStatus;
import com.g174.mmssystem.enums.ReportType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Reports", indexes = {
    @Index(name = "idx_report_type", columnList = "type"),
    @Index(name = "idx_report_status", columnList = "status"),
    @Index(name = "idx_report_date", columnList = "generated_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ReportType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReportStatus status = ReportStatus.Pending;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "report_data", columnDefinition = "JSON")
    private String reportData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by")
    private User generatedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt = LocalDateTime.now();
}
