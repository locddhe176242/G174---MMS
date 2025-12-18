package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponseDTO {

    private Integer logId;
    private Integer userId;
    private String userName;
    private String userFullName;
    private String userEmail;
    private String action;
    private String description;
    private String activityType;
    private String tableName;
    private Integer entityId;
    private LocalDateTime logDate;
    private String logDateFormatted;
    private String ipAddress;
    private String deviceInfo;
}