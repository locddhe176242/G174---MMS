package com.g174.mmssystem.dto.responseDTO;
import com.g174.mmssystem.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private Integer userId;
    private String username;
    private String email;
    private String employeeCode;
    private User.UserStatus status;
    private Instant lastLogin;
    private Instant createdAt;
    private Instant updatedAt;
    private DepartmentResponseDTO department;
    private UserProfileResponseDTO profile;
    private Set<RoleResponseDTO> roles = new HashSet<>();

    @Override
    public String toString() {
        return "UserResponseDTO{" +
                "userId=" + userId +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", employeeCode='" + employeeCode + '\'' +
                ", status=" + status +
                ", department=" + (department != null ? department.getDepartmentName() : null) +
                ", rolesCount=" + (roles != null ? roles.size() : 0) +
                '}';
    }
}
