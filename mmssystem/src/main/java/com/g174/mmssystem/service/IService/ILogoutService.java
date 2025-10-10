package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.auth.LogoutRequestDTO;
import com.g174.mmssystem.dto.auth.LogoutResponseDTO;

public interface ILogoutService {
    LogoutResponseDTO logout(String accessToken, LogoutRequestDTO request);
    boolean isTokenBlacklisted(String token);
    void cleanupExpiredTokens();
}

