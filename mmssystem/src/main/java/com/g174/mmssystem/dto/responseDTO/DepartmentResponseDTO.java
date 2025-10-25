package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentResponseDTO {
    private Integer departmentId;
    private String departmentCode;
    private String departmentName;
    private String description;
}
