package com.g174.mmssystem.dto.auth;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenResponseDTO {
    private String accessToken;
    private String tokenType = "Bearer";
}
