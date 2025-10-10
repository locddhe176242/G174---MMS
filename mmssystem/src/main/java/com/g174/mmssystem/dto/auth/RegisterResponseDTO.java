package com.g174.mmssystem.dto.auth;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterResponseDTO {
    private String message;
    private Integer userId;
    private String email;
    private String employeeCode;
    private Instant createdAt;
}

