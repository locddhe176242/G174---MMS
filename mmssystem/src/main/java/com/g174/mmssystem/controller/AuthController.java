package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.auth.*;
import com.g174.mmssystem.service.IService.IAuthenticationService;
import com.g174.mmssystem.service.IService.ILogoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final IAuthenticationService authenticationService;
    private final ILogoutService logoutService;

    @PostMapping("/login")
    @LogActivity(
        action = "LOGIN",
        activityType = "LOGIN",
        description = "User_dang_nhap_vao_he_thong",
        includeClientInfo = true
    )
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO loginRequest) {

        log.info("Yêu cầu đăng nhập từ email: {}", loginRequest.getEmail());
        LoginResponseDTO response = authenticationService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponseDTO> refreshToken(
            @Valid @RequestBody RefreshTokenRequestDTO request) {

        log.info("Yêu cầu làm mới token");
        RefreshTokenResponseDTO response = authenticationService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO registerRequest) {

        log.info("Yêu cầu đăng ký người dùng mới: {}", registerRequest.getEmail());
        RegisterResponseDTO response = authenticationService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/logout")
    @LogActivity(
        action = "LOGOUT",
        activityType = "LOGOUT",
        description = "User_dang_xuat_khoi_he_thong",
        includeClientInfo = true
    )
    public ResponseEntity<LogoutResponseDTO> logout(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody LogoutRequestDTO request) {

        String accessToken = authHeader.replace("Bearer ", "");
        
        log.info("Yêu cầu đăng xuất");
        LogoutResponseDTO response = logoutService.logout(accessToken, request);
        return ResponseEntity.ok(response);
    }
}