package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfqRequestDTO {

    @Size(max = 30, message = "Số RFQ không được quá 30 ký tự")
    private String rfqNo;

    private Integer requisitionId;

    @NotNull(message = "Ngày phát hành không được để trống")
    private LocalDate issueDate;

    @NotNull(message = "Hạn phản hồi không được để trống")
    private LocalDate dueDate;

    private String status;

    private List<Integer> selectedVendorIds;

    @Size(max = 5000, message = "Ghi chú không được quá 5000 ký tự")
    private String notes;

    @Valid
    @NotNull(message = "Danh sách sản phẩm không được để trống")
    private List<RfqItemRequestDTO> items;
}


