package com.g174.mmssystem.dto.requestDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodIssueRequestDTO {
    
    private String issueNo;

    @NotNull(message = "Delivery ID là bắt buộc")
    private Integer deliveryId;

    // warehouseId không còn bắt buộc ở header, mỗi item có kho riêng
    // Giữ lại để backward compatibility, nhưng không validate
    private Integer warehouseId;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss[.SSS][XXX]", shape = JsonFormat.Shape.STRING)
    private OffsetDateTime issueDate;

    private Integer createdById;

    @Size(max = 5000, message = "Ghi chú không được vượt quá 5000 ký tự")
    private String notes;

    @Valid
    @NotEmpty(message = "Items không được để trống")
    private List<GoodIssueItemRequestDTO> items;
}
