package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Integer> {

    Page<ActivityLog> findByUserIdOrderByLogDateDesc(Integer userId, Pageable pageable);

    Page<ActivityLog> findByUserIdAndActivityTypeOrderByLogDateDesc(Integer userId, String activityType, Pageable pageable);

    @Query("SELECT al FROM ActivityLog al WHERE al.user.id = :userId " +
            "AND al.logDate BETWEEN :startDate AND :endDate " +
            "ORDER BY al.logDate DESC")
    Page<ActivityLog> findByUserIdAndDateRange(
            @Param("userId") Integer userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    List<ActivityLog> findTop10ByUserIdOrderByLogDateDesc(Integer userId);
    
    // Get recent activity logs from all users (system-wide)
    @Query("SELECT al FROM ActivityLog al " +
           "LEFT JOIN FETCH al.user u " +
           "LEFT JOIN FETCH u.profile " +
           "ORDER BY al.logDate DESC")
    List<ActivityLog> findRecentActivityLogs(Pageable pageable);

    long countByUserIdAndActivityType(Integer userId, String activityType);

    Page<ActivityLog> findByActivityTypeOrderByLogDateDesc(String activityType, Pageable pageable);

    @Query("SELECT al FROM ActivityLog al WHERE al.user.id = :userId " +
            "AND LOWER(al.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY al.logDate DESC")
    Page<ActivityLog> findByUserIdAndDescriptionContaining(
            @Param("userId") Integer userId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    Page<ActivityLog> findByEntityIdOrderByLogDateDesc(Integer entityId, Pageable pageable);

    Page<ActivityLog> findByActionOrderByLogDateDesc(String action, Pageable pageable);
}