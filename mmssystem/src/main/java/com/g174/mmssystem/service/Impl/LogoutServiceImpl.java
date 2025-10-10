package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.auth.LogoutRequestDTO;
import com.g174.mmssystem.dto.auth.LogoutResponseDTO;
import com.g174.mmssystem.entity.TokenBlacklist;
import com.g174.mmssystem.exception.InvalidCredentialsException;
import com.g174.mmssystem.exception.TokenExpiredException;
import com.g174.mmssystem.repository.TokenBlacklistRepository;
import com.g174.mmssystem.service.IService.ILogoutService;
import com.g174.mmssystem.until.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogoutServiceImpl implements ILogoutService {

    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final JwtService jwtService;

    @Override
    @Transactional
    public LogoutResponseDTO logout(String accessToken, LogoutRequestDTO request) {
        
        if (!jwtService.validateToken(accessToken)) {
            throw new TokenExpiredException("Access token không hợp lệ");
        }

        if (!jwtService.validateToken(request.getRefreshToken())) {
            throw new TokenExpiredException("Refresh token không hợp lệ");
        }

        String accessTokenType = jwtService.extractTokenType(accessToken);
        String refreshTokenType = jwtService.extractTokenType(request.getRefreshToken());

        if (!"access".equals(accessTokenType)) {
            throw new InvalidCredentialsException("Token không hợp lệ");
        }

        if (!"refresh".equals(refreshTokenType)) {
            throw new InvalidCredentialsException("Refresh token không hợp lệ");
        }

        Integer userId = jwtService.extractUserId(accessToken);
        
        Date accessTokenExpiry = jwtService.extractExpiration(accessToken);
        Date refreshTokenExpiry = jwtService.extractExpiration(request.getRefreshToken());

        blacklistToken(accessToken, userId, accessTokenExpiry.toInstant());
        blacklistToken(request.getRefreshToken(), userId, refreshTokenExpiry.toInstant());

        log.info("Người dùng ID: {} đã đăng xuất thành công", userId);

        return LogoutResponseDTO.builder()
                .message("Đăng xuất thành công")
                .build();
    }

    @Override
    public boolean isTokenBlacklisted(String token) {
        return tokenBlacklistRepository.existsByToken(token);
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredTokens() {
        log.info("Bắt đầu dọn dẹp tokens đã hết hạn...");
        tokenBlacklistRepository.deleteExpiredTokens(Instant.now());
        log.info("Đã dọn dẹp xong tokens đã hết hạn");
    }

    private void blacklistToken(String token, Integer userId, Instant expiresAt) {
        if (tokenBlacklistRepository.existsByToken(token)) {
            log.warn("Token đã tồn tại trong blacklist: {}", token.substring(0, 20));
            return;
        }

        TokenBlacklist blacklistedToken = new TokenBlacklist();
        blacklistedToken.setToken(token);
        blacklistedToken.setUserId(userId);
        blacklistedToken.setExpiresAt(expiresAt);
        
        tokenBlacklistRepository.save(blacklistedToken);
        log.debug("Token đã được thêm vào blacklist");
    }
}

