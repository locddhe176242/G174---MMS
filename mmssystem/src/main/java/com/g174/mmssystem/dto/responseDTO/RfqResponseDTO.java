package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfqResponseDTO {
    private Integer rfqId;
    private String rfqNo;
    private Integer requisitionId;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private String status;
    private Integer selectedVendorId;
    private List<Integer> selectedVendorIds;
    private String notes;
    private LocalDateTime createdAt;
    private List<RfqItemResponseDTO> items;
}


