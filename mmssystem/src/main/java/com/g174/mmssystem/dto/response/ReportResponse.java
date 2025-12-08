package com.g174.mmssystem.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.g174.mmssystem.enums.ReportStatus;
import com.g174.mmssystem.enums.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {
    
    private Integer reportId;
    
    private String name;
    
    private ReportType type;
    
    private ReportStatus status;
    
    private String description;
    
    private Object reportData; // Will be parsed from JSON
    
    private Integer generatedByUserId;
    
    private String generatedByEmail;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime generatedAt;
}
