package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponseDTO {
    
    private Long userId;
    private String username;
    private String email;
    private String employeeCode;
    private String status;
    private LocalDateTime lastLogin;
    
    private String firstName;
    private String lastName;
    private String fullName;
    private String gender;
    private LocalDate dob;
    private String phoneNumber;
    private String address;
    
    private Long departmentId;
    private String departmentName;
    private String departmentCode;
    
    private List<String> roles;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
