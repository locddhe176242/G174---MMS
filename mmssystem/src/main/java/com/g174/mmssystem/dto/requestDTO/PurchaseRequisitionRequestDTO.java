package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.enums.RequisitionStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionRequestDTO {
    private String requisitionNo;
    private LocalDate requisitionDate;
    private Integer requesterId;
    
    // Validation được xử lý ở service level dựa trên status
    // Nếu status = Draft: cho phép purpose và items rỗng
    // Nếu status != Draft: bắt buộc phải có purpose và items
    private String purpose;
    
    private RequisitionStatus status;
    private Integer approverId;
    private LocalDateTime approvedAt;
    private List<PurchaseRequisitionItemRequestDTO> items;
}

