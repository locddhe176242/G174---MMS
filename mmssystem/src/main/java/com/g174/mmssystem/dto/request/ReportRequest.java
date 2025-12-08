package com.g174.mmssystem.dto.request;

import com.g174.mmssystem.enums.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRequest {
    
    private String name;
    
    private ReportType type;
    
    private String description;
    
    // Filters for report generation
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private Integer warehouseId;
    
    private Integer vendorId;
    
    private Integer customerId;
    
    private String additionalFilters; // JSON string for flexible filters
}
