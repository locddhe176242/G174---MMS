package com.g174.mmssystem.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDTO {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 255, message = "Email tối đa 255 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@gmail\\.com$",
            message = "Email phải có đuôi @gmail.com")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 64, message = "Mật khẩu phải từ 8-64 ký tự")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=!*()_\\-])[A-Za-z\\d@#$%^&+=!*()_\\-]{8,64}$",
            message = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!*()_-)"
    )
    private String password;

    @NotBlank(message = "Mã nhân viên không được để trống")
    @Size(max = 50, message = "Mã nhân viên tối đa 50 ký tự")
    private String employeeCode;

    @NotNull(message = "Phòng ban không được để trống")
    private Integer departmentId;

    @NotNull(message = "Vai trò không được để trống")
    @Size(min = 1, message = "Phải có ít nhất 1 vai trò")
    private Set<Integer> roleIds;

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
    private String fullName;

    @Pattern(regexp = "^(0\\d{9,10})$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @Override
    public String toString() {
        return "RegisterRequestDTO{" +
                "email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                ", employeeCode='" + employeeCode + '\'' +
                ", departmentId=" + departmentId +
                ", roleIds=" + roleIds +
                ", fullName='" + fullName + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                '}';
    }
}

