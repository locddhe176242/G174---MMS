package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.auth.*;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IPasswordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class PasswordController {

    private final IPasswordService passwordService;
    private final UserRepository userRepository;

    @PostMapping("/change-password")
    public ResponseEntity<ChangePasswordResponseDTO> changePassword(
            @Valid @RequestBody ChangePasswordRequestDTO request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        log.info("Yêu cầu đổi mật khẩu từ người dùng: {} (ID: {})", email, user.getId());

        ChangePasswordResponseDTO response = passwordService.changePassword(user.getId(), request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/request")
    public ResponseEntity<ForgotPasswordResponseDTO> requestPasswordReset(
            @Valid @RequestBody ForgotPasswordRequestDTO request) {

        log.info("Yêu cầu đặt lại mật khẩu cho email: {}", request.getEmail());

        ForgotPasswordResponseDTO response = passwordService.requestPasswordReset(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<VerifyOtpOnlyResponseDTO> verifyOtpOnly(
            @Valid @RequestBody VerifyOtpOnlyRequestDTO request) {

        log.info("Yêu cầu xác thực OTP (không reset password) cho email: {}", request.getEmail());

        VerifyOtpOnlyResponseDTO response = passwordService.verifyOtpOnly(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/verify")
    public ResponseEntity<VerifyOtpResponseDTO> verifyOtpAndResetPassword(
            @Valid @RequestBody VerifyOtpRequestDTO request) {

        log.info("Yêu cầu xác thực OTP cho email: {}", request.getEmail());

        VerifyOtpResponseDTO response = passwordService.verifyOtpAndResetPassword(request);

        return ResponseEntity.ok(response);
    }
}