package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.auth.*;

public interface IPasswordService {
    ChangePasswordResponseDTO changePassword(Integer userId, ChangePasswordRequestDTO request);
    ForgotPasswordResponseDTO requestPasswordReset(ForgotPasswordRequestDTO request);
    VerifyOtpResponseDTO verifyOtpAndResetPassword(VerifyOtpRequestDTO request);
}
