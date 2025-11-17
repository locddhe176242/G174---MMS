package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.enums.RequisitionStatus;
import jakarta.validation.constraints.*;
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

    private Long requesterId;

    @NotBlank(message = "Mục đích sử dụng là bắt buộc")
    private String purpose;

    @Builder.Default
    private RequisitionStatus status = RequisitionStatus.Draft;

    private Integer approverId;

    private LocalDateTime approvedAt;

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    private List<PurchaseRequisitionItemRequestDTO> items;
}
