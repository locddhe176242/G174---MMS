package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentResponseDTO {
    private Integer departmentId;
    private String departmentName;
    private String departmentCode;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
}