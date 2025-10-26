package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.responseDTO.ActivityLogResponseDTO;
import com.g174.mmssystem.service.IService.IActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
@Slf4j
public class ActivityLogController {
    
    private final IActivityLogService activityLogService;
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getUserActivityLogs(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "logDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        log.info("API: Lấy activity logs cho user ID: {}", userId);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ActivityLogResponseDTO> activityLogs = activityLogService.getUserActivityLogs(userId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", activityLogs.getContent());
        response.put("currentPage", activityLogs.getNumber());
        response.put("totalPages", activityLogs.getTotalPages());
        response.put("totalElements", activityLogs.getTotalElements());
        response.put("size", activityLogs.getSize());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/user/{userId}/recent")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getRecentUserActivityLogs(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        log.info("API: Lấy recent activity logs cho user ID: {}", userId);
        
        List<ActivityLogResponseDTO> activityLogs = activityLogService.getRecentUserActivityLogs(userId, limit);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", activityLogs);
        response.put("count", activityLogs.size());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/user/{userId}/type/{activityType}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getUserActivityLogsByType(
            @PathVariable Integer userId,
            @PathVariable String activityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        log.info("API: Lấy activity logs cho user ID: {} theo type: {}", userId, activityType);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("logDate").descending());
        Page<ActivityLogResponseDTO> activityLogs = activityLogService.getUserActivityLogsByType(userId, activityType, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", activityLogs.getContent());
        response.put("currentPage", activityLogs.getNumber());
        response.put("totalPages", activityLogs.getTotalPages());
        response.put("totalElements", activityLogs.getTotalElements());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/user/{userId}/search")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> searchUserActivityLogs(
            @PathVariable Integer userId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        log.info("API: Tìm kiếm activity logs cho user ID: {} với keyword: {}", userId, keyword);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("logDate").descending());
        Page<ActivityLogResponseDTO> activityLogs = activityLogService.searchUserActivityLogs(userId, keyword, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", activityLogs.getContent());
        response.put("currentPage", activityLogs.getNumber());
        response.put("totalPages", activityLogs.getTotalPages());
        response.put("totalElements", activityLogs.getTotalElements());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/entity/{entityId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getLogsByEntity(
            @PathVariable Integer entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        log.info("API: Lấy activity logs cho entity ID: {}", entityId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("logDate").descending());
        Page<ActivityLogResponseDTO> activityLogs = activityLogService.getLogsByEntity(entityId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", activityLogs.getContent());
        response.put("currentPage", activityLogs.getNumber());
        response.put("totalPages", activityLogs.getTotalPages());
        response.put("totalElements", activityLogs.getTotalElements());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/stats/user/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getUserActivityStats(@PathVariable Integer userId) {
        log.info("API: Lấy thống kê activity cho user ID: {}", userId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("LOGIN", activityLogService.getActivityCountByType(userId, "LOGIN"));
        stats.put("LOGOUT", activityLogService.getActivityCountByType(userId, "LOGOUT"));
        stats.put("PROFILE_UPDATE", activityLogService.getActivityCountByType(userId, "PROFILE_UPDATE"));
        stats.put("PASSWORD_CHANGE", activityLogService.getActivityCountByType(userId, "PASSWORD_CHANGE"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        
        return ResponseEntity.ok(response);
    }
}
