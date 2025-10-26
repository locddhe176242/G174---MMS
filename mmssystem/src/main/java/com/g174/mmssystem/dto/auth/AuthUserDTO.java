package com.g174.mmssystem.dto.auth;

import com.g174.mmssystem.entity.User.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthUserDTO {
    private Integer userId;
    private String email;
    private String employeeCode;
    private UserStatus status;
    private Integer departmentId;
    private String departmentName;
    private String avatarUrl;
    private Set<String> roles;
}