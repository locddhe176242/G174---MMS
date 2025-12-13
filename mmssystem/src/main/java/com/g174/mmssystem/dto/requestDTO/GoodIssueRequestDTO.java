package com.g174.mmssystem.dto.requestDTO;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.g174.mmssystem.entity.GoodIssue;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "Warehouse ID là bắt buộc")
    private Integer warehouseId;

    @JsonDeserialize(using = FlexibleOffsetDateTimeDeserializer.class)
    private OffsetDateTime issueDate;

    private Integer createdById;

    private String notes;

    @Valid
    @NotNull(message = "Items không được để trống")
    private List<GoodIssueItemRequestDTO> items;
}

