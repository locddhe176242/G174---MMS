package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.enums.ApprovalStatus;
import com.g174.mmssystem.enums.RequisitionStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionRequestDTO {

    private Long planId;

    @NotNull(message = "Requester ID không được để trống")
    private Long requesterId;

    @NotBlank(message = "Phòng ban không được để trống")
    @Size(max = 100)
    private String department;

    @Size(max = 50)
    private String costCenter;

    @FutureOrPresent(message = "Ngày cần phải lớn hơn hoặc bằng ngày hiện tại")
    private LocalDate neededBy;

    @NotNull(message = "Kho đích đến không được để trống")
    private Integer destinationWarehouseId;

    @NotBlank(message = "Mục đích không được để trống")
    private String purpose;

    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.Pending;

    private Integer approverId;

    @DecimalMin(value = "0.0", inclusive = true)
    @Builder.Default
    private BigDecimal totalEstimated = BigDecimal.ZERO;

    @Builder.Default
    private RequisitionStatus status = RequisitionStatus.Open;

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    private List<PurchaseRequisitionItemRequestDTO> items;
}
