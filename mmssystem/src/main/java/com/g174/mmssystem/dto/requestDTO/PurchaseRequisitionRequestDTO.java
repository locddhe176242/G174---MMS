package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.enums.ApprovalStatus;
import com.g174.mmssystem.enums.Priority;
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

    private Long requesterId;

    @NotNull(message = "Phòng ban là bắt buộc")
    private Integer departmentId;

    private String purpose;

    private String justification;

    @NotNull(message = "Ngày cần hàng là bắt buộc")
    private LocalDate neededBy;

    @Builder.Default
    private Priority priority = Priority.Medium;

    @Builder.Default
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal totalEstimated = BigDecimal.ZERO;

    @Builder.Default
    @Size(max = 10)
    private String currencyCode = "VND";

    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.Draft;

    private Integer approverId;

    private String approvalRemarks;

    @Builder.Default
    private RequisitionStatus status = RequisitionStatus.Open;

    private Long convertedToPoId;

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    private List<PurchaseRequisitionItemRequestDTO> items;
}
