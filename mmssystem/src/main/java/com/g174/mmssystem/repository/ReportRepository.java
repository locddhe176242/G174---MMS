package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Report;
import com.g174.mmssystem.enums.ReportStatus;
import com.g174.mmssystem.enums.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {
    
    // Tìm theo type
    Page<Report> findByType(ReportType type, Pageable pageable);
    
    // Tìm theo status
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);
    
    // Tìm theo type và status
    Page<Report> findByTypeAndStatus(ReportType type, ReportStatus status, Pageable pageable);
    
    // Tìm theo user
    @Query("SELECT r FROM Report r WHERE r.generatedBy.id = :userId ORDER BY r.generatedAt DESC")
    Page<Report> findByGeneratedByUserId(@Param("userId") Integer userId, Pageable pageable);
    
    // Tìm theo khoảng thời gian
    @Query("SELECT r FROM Report r WHERE r.generatedAt BETWEEN :startDate AND :endDate ORDER BY r.generatedAt DESC")
    Page<Report> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                  @Param("endDate") LocalDateTime endDate, 
                                  Pageable pageable);
    
    // Tìm kiếm theo name hoặc description
    @Query("SELECT r FROM Report r WHERE LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY r.generatedAt DESC")
    Page<Report> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    // Đếm theo type
    long countByType(ReportType type);
    
    // Đếm theo status
    long countByStatus(ReportStatus status);
}
