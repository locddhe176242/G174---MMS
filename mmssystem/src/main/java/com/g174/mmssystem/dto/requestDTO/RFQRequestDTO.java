package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.entity.RFQ;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RFQRequestDTO {
    private String rfqNo;
    
    private Long requisitionId;
    
    private LocalDate issueDate;
    
    private LocalDate dueDate;
    
    private RFQ.RFQStatus status;
    
    private Integer selectedVendorId;
    
    private String notes;
    
    @NotEmpty(message = "Danh sách items không được để trống")
    private List<RFQItemRequestDTO> items;
    
    private List<Integer> selectedVendorIds;
}

