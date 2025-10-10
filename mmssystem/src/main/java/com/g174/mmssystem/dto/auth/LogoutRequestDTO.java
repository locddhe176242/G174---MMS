package com.g174.mmssystem.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LogoutRequestDTO {
    
    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
}

