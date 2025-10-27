package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.User.UserStatus;
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
public class UserSimpleResponseDTO {
    private Integer userId;
    private String email;
    private String employeeCode;
    private UserStatus status;
    private Instant lastLogin;

    private Integer departmentId;
    private String departmentName;

    private String firstName;
    private String lastName;
    private String fullName;
    private String phoneNumber;
}