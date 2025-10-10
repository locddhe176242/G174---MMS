package com.g174.mmssystem.config;

import com.g174.mmssystem.constants.ApplicationConstants;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
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
}