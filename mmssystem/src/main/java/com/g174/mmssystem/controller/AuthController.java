package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.auth.LoginRequestDTO;
import com.g174.mmssystem.dto.auth.LoginResponseDTO;
import com.g174.mmssystem.dto.auth.RefreshTokenRequestDTO;
import com.g174.mmssystem.dto.auth.RefreshTokenResponseDTO;
import com.g174.mmssystem.service.IService.IAuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final IAuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO loginRequest) {

        log.info("Login attempt for email: {}", loginRequest.getEmail());
        LoginResponseDTO response = authenticationService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponseDTO> refreshToken(
            @Valid @RequestBody RefreshTokenRequestDTO request) {

        log.info("Refresh token request");
        RefreshTokenResponseDTO response = authenticationService.refreshToken(request);
        return ResponseEntity.ok(response);
    }
}