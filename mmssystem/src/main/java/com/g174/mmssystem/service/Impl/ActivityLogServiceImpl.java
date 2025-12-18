package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.responseDTO.ActivityLogResponseDTO;
import com.g174.mmssystem.entity.ActivityLog;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.mapper.ActivityLogMapper;
import com.g174.mmssystem.repository.ActivityLogRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ActivityLogServiceImpl implements IActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final ActivityLogMapper activityLogMapper;

    @Override
    @Transactional
    public void logUserActivity(Integer userId, String action, String activityType, String description, String ipAddress, String deviceInfo) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.warn("User not found for activity logging: {}", userId);
                return;
            }

            ActivityLog activityLog = new ActivityLog();
            activityLog.setUser(user);
            activityLog.setAction(action);
            activityLog.setActivityType(activityType);
            activityLog.setDescription(description);
            activityLog.setIpAddress(ipAddress);
            activityLog.setDeviceInfo(deviceInfo);
            activityLog.setLogDate(LocalDateTime.now());

            activityLogRepository.save(activityLog);
            log.info("Activity logged: User {} - {} - {}", userId, action, activityType);
        } catch (Exception e) {
            log.error("Error logging activity for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void logUserActivity(Integer userId, String action, String activityType, String description, String ipAddress) {
        logUserActivity(userId, action, activityType, description, ipAddress, null);
    }

    @Override
    @Transactional
    public void logUserActivity(Integer userId, String action, String activityType, String description) {
        logUserActivity(userId, action, activityType, description, null, null);
    }

    @Override
    @Transactional
    public void logEntityActivity(Integer userId, String action, String activityType, Integer entityId, String description, String ipAddress) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.warn("User not found for entity activity logging: {}", userId);
                return;
            }

            ActivityLog activityLog = new ActivityLog();
            activityLog.setUser(user);
            activityLog.setAction(action);
            activityLog.setActivityType(activityType);
            activityLog.setEntityId(entityId);
            activityLog.setDescription(description);
            activityLog.setIpAddress(ipAddress);
            activityLog.setLogDate(LocalDateTime.now());

            activityLogRepository.save(activityLog);
            log.info("Entity activity logged: User {} - {} - {} - Entity {}", userId, action, activityType, entityId);
        } catch (Exception e) {
            log.error("Error logging entity activity for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void logEntityActivity(Integer userId, String action, String activityType, Integer entityId, String description) {
        logEntityActivity(userId, action, activityType, entityId, description, null);
    }

    @Override
    public Page<ActivityLogResponseDTO> getUserActivityLogs(Integer userId, Pageable pageable) {
        log.info("Getting activity logs for user: {}", userId);
        Page<ActivityLog> activityLogs = activityLogRepository.findByUserIdOrderByLogDateDesc(userId, pageable);
        return activityLogs.map(activityLogMapper::toResponseDTO);
    }

    @Override
    public Page<ActivityLogResponseDTO> getUserActivityLogsByType(Integer userId, String activityType, Pageable pageable) {
        log.info("Getting activity logs for user {} by type: {}", userId, activityType);
        Page<ActivityLog> activityLogs = activityLogRepository.findByUserIdAndActivityTypeOrderByLogDateDesc(userId, activityType, pageable);
        return activityLogs.map(activityLogMapper::toResponseDTO);
    }

    @Override
    public Page<ActivityLogResponseDTO> getUserActivityLogsByDateRange(Integer userId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        log.info("Getting activity logs for user {} from {} to {}", userId, startDate, endDate);
        Page<ActivityLog> activityLogs = activityLogRepository.findByUserIdAndDateRange(userId, startDate, endDate, pageable);
        return activityLogs.map(activityLogMapper::toResponseDTO);
    }

    @Override
    public List<ActivityLogResponseDTO> getRecentUserActivityLogs(Integer userId, int limit) {
        log.info("Getting recent {} activity logs for user: {}", limit, userId);
        List<ActivityLog> activityLogs = activityLogRepository.findTop10ByUserIdOrderByLogDateDesc(userId);
        return activityLogMapper.toResponseDTOList(activityLogs);
    }

    @Override
    public Page<ActivityLogResponseDTO> searchUserActivityLogs(Integer userId, String keyword, Pageable pageable) {
        log.info("Searching activity logs for user {} with keyword: {}", userId, keyword);
        Page<ActivityLog> activityLogs = activityLogRepository.findByUserIdAndDescriptionContaining(userId, keyword, pageable);
        return activityLogs.map(activityLogMapper::toResponseDTO);
    }

    @Override
    public long getActivityCountByType(Integer userId, String activityType) {
        return activityLogRepository.countByUserIdAndActivityType(userId, activityType);
    }

    @Override
    public List<ActivityLogResponseDTO> getRecentActivityLogs(int limit) {
        log.info("Getting recent {} activity logs from all users", limit);
        Pageable pageable = Pageable.ofSize(limit);
        List<ActivityLog> activityLogs = activityLogRepository.findRecentActivityLogs(pageable);
        return activityLogMapper.toResponseDTOList(activityLogs);
    }

    @Override
    public Page<ActivityLogResponseDTO> getLogsByEntity(Integer entityId, Pageable pageable) {
        log.info("Getting activity logs for entity: {}", entityId);
        Page<ActivityLog> activityLogs = activityLogRepository.findByEntityIdOrderByLogDateDesc(entityId, pageable);
        return activityLogs.map(activityLogMapper::toResponseDTO);
    }

    @Override
    public Page<ActivityLogResponseDTO> getLogsByAction(String action, Pageable pageable) {
        log.info("Getting activity logs for action: {}", action);
        Page<ActivityLog> activityLogs = activityLogRepository.findByActionOrderByLogDateDesc(action, pageable);
        return activityLogs.map(activityLogMapper::toResponseDTO);
    }
}