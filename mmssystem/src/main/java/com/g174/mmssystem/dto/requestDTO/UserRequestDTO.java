package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.entity.User.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDTO {
    private Integer userId;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 255, message = "Email tối đa 255 ký tự")
    //@Pattern(regexp = "^[A-Za-z0-9._%+-]+@mms\\.com$",
            //message = "Email phải có đuôi @mms.com")
    private String email;

    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=!*()_\\-])[A-Za-z\\d@#$%^&+=!*()_\\-]{8,}$",
            message = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!*()_-)"
    )
    private String password;

    @NotBlank(message = "Mã nhân viên không được để trống")
    @Size(max = 50, message = "Mã nhân viên tối đa 50 ký tự")
    private String employeeCode;

    @NotNull(message = "Phòng ban không được để trống")
    private Integer departmentId;

    private UserStatus status = UserStatus.Active;

    @Override
    public String toString() {
        return "UserRequestDTO{" +
                "userId=" + userId +
                ", email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                ", employeeCode='" + employeeCode + '\'' +
                ", departmentId=" + departmentId +
                ", status=" + status +
                '}';
    }
}
