package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequestDTO {
    
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Pattern(regexp = ".*@mms\\.com$", message = "Email phải có đuôi @mms.com")
    private String email;
    
    @NotBlank(message = "Mã nhân viên không được để trống")
    @Size(max = 50, message = "Mã nhân viên không được quá 50 ký tự")
    private String employeeCode;
    
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 255, message = "Họ và tên không được quá 255 ký tự")
    private String fullName;
    
    @Pattern(regexp = "^(0\\d{9,10})?$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;
    
    @NotNull(message = "Phòng ban không được để trống")
    private Integer departmentId;
    
    @NotEmpty(message = "Vai trò không được để trống")
    private List<Integer> roleIds;
}
