package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.request.ReportRequest;
import com.g174.mmssystem.dto.response.ReportResponse;
import com.g174.mmssystem.enums.ReportStatus;
import com.g174.mmssystem.enums.ReportType;
import com.g174.mmssystem.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReportController {
    
    private final ReportService reportService;
    private final com.g174.mmssystem.repository.UserRepository userRepository;
    
    // Get all reports
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Page<ReportResponse>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "generatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Page<ReportResponse> reports = reportService.getAllReports(page, size, sortBy, sortDir);
        return ResponseEntity.ok(reports);
    }
    
    // Get report by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','SALE','ACCOUNTING')")
    public ResponseEntity<ReportResponse> getReportById(@PathVariable Integer id) {
        ReportResponse report = reportService.getReportById(id);
        return ResponseEntity.ok(report);
    }
    
    // Filter reports
    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','SALE','ACCOUNTING')")
    public ResponseEntity<Page<ReportResponse>> filterReports(
            @RequestParam(required = false) ReportType type,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<ReportResponse> reports = reportService.filterReports(type, status, keyword, page, size);
        return ResponseEntity.ok(reports);
    }
    
    // Generate Inventory Report
    @PostMapping("/generate/inventory")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    public ResponseEntity<ReportResponse> generateInventoryReport(
            @RequestBody ReportRequest request,
            Authentication authentication) {
        
        Integer userId = extractUserIdFromAuth(authentication);
        ReportResponse report = reportService.generateInventoryReport(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }
    
    // Generate Purchase Report
    @PostMapping("/generate/purchase")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<ReportResponse> generatePurchaseReport(
            @RequestBody ReportRequest request,
            Authentication authentication) {
        
        Integer userId = extractUserIdFromAuth(authentication);
        ReportResponse report = reportService.generatePurchaseReport(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }
    
    // Generate Sales Report
    @PostMapping("/generate/sales")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<ReportResponse> generateSalesReport(
            @RequestBody ReportRequest request,
            Authentication authentication) {
        
        Integer userId = extractUserIdFromAuth(authentication);
        ReportResponse report = reportService.generateSalesReport(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }
    
    // Generate Financial Report
    @PostMapping("/generate/financial")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    public ResponseEntity<ReportResponse> generateFinancialReport(
            @RequestBody ReportRequest request,
            Authentication authentication) {
        
        Integer userId = extractUserIdFromAuth(authentication);
        ReportResponse report = reportService.generateFinancialReport(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }
    
    // Delete report
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteReport(@PathVariable Integer id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
    
    // Helper method to extract user ID from authentication
    private Integer extractUserIdFromAuth(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            try {
                // Get user by email from authentication
                com.g174.mmssystem.entity.User user = userRepository.findByEmail(authentication.getName())
                        .orElseThrow(() -> new RuntimeException("User not found with email: " + authentication.getName()));
                return user.getId();
            } catch (Exception e) {
                log.error("Error extracting user ID from authentication", e);
                return 1; // Fallback to default user ID
            }
        }
        log.warn("Authentication is null or username is null, using default user ID");
        return 1; // Default user ID if authentication fails
    }
}
