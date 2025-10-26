package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.responseDTO.ActivityLogResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface IActivityLogService {
    
    void logUserActivity(Integer userId, String action, String activityType, String description, String ipAddress, String deviceInfo);
    void logUserActivity(Integer userId, String action, String activityType, String description, String ipAddress);
    void logUserActivity(Integer userId, String action, String activityType, String description);
    
    void logEntityActivity(Integer userId, String action, String activityType, Integer entityId, String description, String ipAddress);
    void logEntityActivity(Integer userId, String action, String activityType, Integer entityId, String description);
    
    Page<ActivityLogResponseDTO> getUserActivityLogs(Integer userId, Pageable pageable);
    Page<ActivityLogResponseDTO> getUserActivityLogsByType(Integer userId, String activityType, Pageable pageable);
    Page<ActivityLogResponseDTO> getUserActivityLogsByDateRange(Integer userId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    List<ActivityLogResponseDTO> getRecentUserActivityLogs(Integer userId, int limit);
    
    Page<ActivityLogResponseDTO> searchUserActivityLogs(Integer userId, String keyword, Pageable pageable);
    
    long getActivityCountByType(Integer userId, String activityType);
    List<ActivityLogResponseDTO> getRecentActivityLogs(int limit);
    
    Page<ActivityLogResponseDTO> getLogsByEntity(Integer entityId, Pageable pageable);
    
    Page<ActivityLogResponseDTO> getLogsByAction(String action, Pageable pageable);
}
