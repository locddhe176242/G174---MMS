package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategoryRequestDTO {
    
    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục không được quá 100 ký tự")
    @Pattern(
        regexp = "^[a-zA-Z0-9\\s\\-_À-ỹ]+$", 
        message = "Tên danh mục chỉ được chứa chữ cái, số, khoảng trắng, dấu gạch ngang"
    )
    private String name;
    
    @Size(max = 500, message = "Mô tả không được quá 500 ký tự")
    private String description;
}
