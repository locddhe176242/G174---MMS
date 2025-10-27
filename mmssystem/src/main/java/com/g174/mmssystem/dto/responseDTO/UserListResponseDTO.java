package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserListResponseDTO {
    private Integer userId;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String employeeCode;
    private String status;
    private Integer departmentId;
    private String departmentName;
    private List<String> roles;
    private Instant createdAt;
    private Instant lastLogin;
}
