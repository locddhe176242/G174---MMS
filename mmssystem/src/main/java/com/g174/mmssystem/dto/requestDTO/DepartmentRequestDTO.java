package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentRequestDTO {
    private Integer departmentId;
    
    @NotBlank(message = "Tên phòng ban không được để trống")
    @Size(max = 255, message = "Tên phòng ban tối đa 255 ký tự")
    private String departmentName;
    
    @NotBlank(message = "Mã phòng ban không được để trống")
    @Size(max = 50, message = "Mã phòng ban tối đa 50 ký tự")
    private String departmentCode;
    
    private String description;
}
