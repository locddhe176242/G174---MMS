package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.ActivityLogResponseDTO;
import com.g174.mmssystem.entity.ActivityLog;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ActivityLogMapper {
    
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    
    public ActivityLogResponseDTO toResponseDTO(ActivityLog activityLog) {
        if (activityLog == null) {
            return null;
        }
        
        ActivityLogResponseDTO dto = new ActivityLogResponseDTO();
        dto.setLogId(activityLog.getLogId());
        dto.setUserId(activityLog.getUser() != null ? activityLog.getUser().getId() : null);
        dto.setUserEmail(activityLog.getUser() != null ? activityLog.getUser().getEmail() : null);
        dto.setAction(activityLog.getAction());
        dto.setDescription(activityLog.getDescription());
        dto.setActivityType(activityLog.getActivityType());
        dto.setEntityId(activityLog.getEntityId());
        dto.setLogDate(activityLog.getLogDate());
        dto.setLogDateFormatted(activityLog.getLogDate() != null ? 
            activityLog.getLogDate().format(DATE_TIME_FORMATTER) : null);
        dto.setIpAddress(activityLog.getIpAddress());
        dto.setDeviceInfo(activityLog.getDeviceInfo());
        
        return dto;
    }
    
    public List<ActivityLogResponseDTO> toResponseDTOList(List<ActivityLog> activityLogs) {
        if (activityLogs == null) {
            return null;
        }
        
        return activityLogs.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}
