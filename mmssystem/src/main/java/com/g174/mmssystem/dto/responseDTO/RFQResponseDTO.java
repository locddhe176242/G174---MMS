package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.RFQ;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RFQResponseDTO {
    private Integer rfqId;
    private String rfqNo;
    private Long requisitionId;
    private String requisitionNo;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private RFQ.RFQStatus status;
    private Integer selectedVendorId;
    private String selectedVendorName;
    private String selectedVendorCode;
    private Integer createdById;
    private String createdByName;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RFQItemResponseDTO> items;
    private List<RFQVendorResponseDTO> selectedVendors;
}

