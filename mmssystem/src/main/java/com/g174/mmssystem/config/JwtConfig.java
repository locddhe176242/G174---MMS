package com.g174.mmssystem.config;

import com.g174.mmssystem.constants.ApplicationConstants;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
@Slf4j
public class JwtConfig {

    @Value("${jwt.secret:" + ApplicationConstants.JWT_SECRET_DEFAULT_VALUE + "}")
    private String secret;

    @Value("${jwt.access-token.expiration:" + ApplicationConstants.JWT_ACCESS_TOKEN_VALIDITY + "}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token.expiration:" + ApplicationConstants.JWT_REFRESH_TOKEN_VALIDITY + "}")
    private long refreshTokenExpiration;

    @Value("${jwt.header:" + ApplicationConstants.JWT_HEADER + "}")
    private String header;

    @Value("${jwt.token-prefix:" + ApplicationConstants.JWT_TOKEN_PREFIX + "}")
    private String tokenPrefix;

    @PostConstruct
    public void validateConfig() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret không được để trống. Vui lòng cấu hình 'jwt.secret' trong application.properties");
        }

        if (secret.length() < 64) {
            log.warn("CẢNH BÁO BẢO MẬT: JWT secret quá ngắn ({} ký tự). Khuyến nghị ít nhất 64 ký tự để đảm bảo an toàn.", secret.length());
            throw new IllegalStateException(
                String.format("JWT secret quá ngắn (%d ký tự). Yêu cầu tối thiểu 64 ký tự. Hiện tại: %d ký tự", 
                    secret.length(), secret.length())
            );
        }

        if (accessTokenExpiration <= 0) {
            throw new IllegalStateException("Access token expiration phải lớn hơn 0");
        }

        if (refreshTokenExpiration <= 0) {
            throw new IllegalStateException("Refresh token expiration phải lớn hơn 0");
        }

        if (refreshTokenExpiration <= accessTokenExpiration) {
            log.warn("CẢNH BÁO: Refresh token expiration ({} ms) nên dài hơn access token expiration ({} ms)", 
                refreshTokenExpiration, accessTokenExpiration);
        }

        log.info("JWT Config đã được validate thành công");
        log.info("Secret length: {} ký tự", secret.length());
        log.info("Access token expiration: {} ms ({} phút)", accessTokenExpiration, accessTokenExpiration / 60000);
        log.info("Refresh token expiration: {} ms ({} ngày)", refreshTokenExpiration, refreshTokenExpiration / 86400000);
    }
}