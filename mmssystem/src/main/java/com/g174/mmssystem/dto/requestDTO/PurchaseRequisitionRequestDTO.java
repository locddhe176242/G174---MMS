package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.entity.PurchaseRequisition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PurchaseRequisitionRequestDTO {

    @NotBlank(message = "Requisition number is required")
    @Size(max = 30, message = "Requisition number must not exceed 30 characters")
    private String requisitionNo;

    @NotBlank(message = "Purpose is required")
    private String purpose;

    @NotBlank(message = "Status is required")
    private String status;

    private List<PurchaseRequisitionItemRequestDTO> items;
}