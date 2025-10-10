package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.auth.LoginRequestDTO;
import com.g174.mmssystem.dto.auth.LoginResponseDTO;
import com.g174.mmssystem.dto.auth.RefreshTokenRequestDTO;
import com.g174.mmssystem.dto.auth.RefreshTokenResponseDTO;
import com.g174.mmssystem.dto.auth.RegisterRequestDTO;
import com.g174.mmssystem.dto.auth.RegisterResponseDTO;

public interface IAuthenticationService {
    LoginResponseDTO login(LoginRequestDTO loginRequest);
    RefreshTokenResponseDTO refreshToken(RefreshTokenRequestDTO request);
    RegisterResponseDTO register(RegisterRequestDTO registerRequest);
}
