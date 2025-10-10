package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.auth.*;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.exception.InvalidCredentialsException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.exception.TokenExpiredException;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IAuthenticationService;
import com.g174.mmssystem.until.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements IAuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    @Transactional
    public LoginResponseDTO login(LoginRequestDTO loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .filter(u -> u.getDeletedAt() == null)
                    .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

            if (user.getStatus() == User.UserStatus.Inactive) {
                throw new InvalidCredentialsException("User account is inactive");
            }

            user.setLastLogin(Instant.now());
            userRepository.save(user);

            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            AuthUserDTO authUser = buildAuthUserDTO(user);

            log.info("User {} logged in successfully", user.getEmail());

            return LoginResponseDTO.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .user(authUser)
                    .build();

        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for email: {}", loginRequest.getEmail());
            throw new InvalidCredentialsException("Invalid email or password");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public RefreshTokenResponseDTO refreshToken(RefreshTokenRequestDTO request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtService.validateToken(refreshToken)) {
            throw new TokenExpiredException("Refresh token is invalid or expired");
        }

        String tokenType = jwtService.extractTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new TokenExpiredException("Invalid token type. Expected refresh token");
        }

        String email = jwtService.extractEmail(refreshToken);

        User user = userRepository.findByEmail(email)
                .filter(u -> u.getDeletedAt() == null)
                .filter(u -> u.getStatus() == User.UserStatus.Active)
                .orElseThrow(() -> new ResourceNotFoundException("User not found or inactive"));

        String newAccessToken = jwtService.generateAccessToken(user);

        log.info("Access token refreshed for user: {}", email);

        return RefreshTokenResponseDTO.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .build();
    }

    private AuthUserDTO buildAuthUserDTO(User user) {
        var roles = user.getUserRoles().stream()
                .map(ur -> ur.getRole().getRoleName())
                .collect(Collectors.toSet());

        String departmentName = user.getDepartment() != null
                ? user.getDepartment().getDepartmentName()
                : null;

        Integer departmentId = user.getDepartment() != null
                ? user.getDepartment().getId()
                : null;

        return AuthUserDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .employeeCode(user.getEmployeeCode())
                .status(user.getStatus())
                .departmentId(departmentId)
                .departmentName(departmentName)
                .roles(roles)
                .build();
    }
}