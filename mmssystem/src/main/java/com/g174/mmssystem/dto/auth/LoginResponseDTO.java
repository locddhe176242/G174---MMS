package com.g174.mmssystem.dto.auth;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private AuthUserDTO user;
}
