package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.auth.*;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.exception.EmailSendingException;
import com.g174.mmssystem.exception.InvalidCredentialsException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.EmailService;
import com.g174.mmssystem.service.IService.IPasswordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordServiceImpl implements IPasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    @Override
    @Transactional
    public ChangePasswordResponseDTO changePassword(Integer userId, ChangePasswordRequestDTO request) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (user.getStatus() == User.UserStatus.Inactive) {
            throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            log.warn("Đổi mật khẩu thất bại cho người dùng ID: {} - Mật khẩu cũ không đúng", userId);
            throw new InvalidCredentialsException("Mật khẩu cũ không chính xác");
        }

        if (request.getOldPassword().equals(request.getNewPassword())) {
            throw new InvalidCredentialsException("Mật khẩu mới phải khác mật khẩu cũ");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Đổi mật khẩu thành công cho người dùng ID: {}", userId);

        return ChangePasswordResponseDTO.builder()
                .message("Đổi mật khẩu thành công")
                .build();
    }

    @Override
    @Transactional
    public ForgotPasswordResponseDTO requestPasswordReset(ForgotPasswordRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + request.getEmail()));

        if (user.getStatus() == User.UserStatus.Inactive) {
            throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa");
        }

        if (user.getLastOtpRequestTime() != null) {
            long secondsSinceLastRequest = Duration.between(
                user.getLastOtpRequestTime(), 
                Instant.now()
            ).getSeconds();
            
            if (secondsSinceLastRequest < 60) {
                long waitTime = 60 - secondsSinceLastRequest;
                log.warn("Yêu cầu OTP quá nhanh cho email: {} - Cần đợi {} giây", request.getEmail(), waitTime);
                throw new InvalidCredentialsException(
                    "Vui lòng đợi " + waitTime + " giây trước khi yêu cầu mã OTP mới"
                );
            }
        }

        String otp = emailService.generateOTP();
        Instant otpExpiry = Instant.now().plusSeconds(otpExpirationMinutes * 60L);

        user.setOtpCode(otp);
        user.setOtpExpiry(otpExpiry);
        user.setOtpUsed(false);
        user.setOtpAttempts(0);
        user.setLastOtpRequestTime(Instant.now());
        userRepository.save(user);

        emailService.sendOTPEmail(user.getEmail(), otp);
        log.info("Mã OTP đặt lại mật khẩu đã được gửi đến email: {}", request.getEmail());

        return ForgotPasswordResponseDTO.builder()
                .message("Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.")
                .build();
    }

    @Override
    @Transactional(noRollbackFor = InvalidCredentialsException.class)
    public VerifyOtpOnlyResponseDTO verifyOtpOnly(VerifyOtpOnlyRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + request.getEmail()));

        if (user.getOtpCode() == null) {
            log.warn("Không tìm thấy mã OTP cho email: {}", request.getEmail());
            throw new InvalidCredentialsException("Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.");
        }

        if (Boolean.TRUE.equals(user.getOtpUsed())) {
            log.warn("Mã OTP đã được sử dụng cho email: {}", request.getEmail());
            throw new InvalidCredentialsException("Mã OTP đã được sử dụng");
        }

        if (user.getOtpExpiry() == null || Instant.now().isAfter(user.getOtpExpiry())) {
            log.warn("Mã OTP đã hết hạn cho email: {}", request.getEmail());
            throw new InvalidCredentialsException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        int attempts = user.getOtpAttempts() != null ? user.getOtpAttempts() : 0;
        
        if (attempts >= 5) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            user.setOtpUsed(true);
            user.setOtpAttempts(0);
            userRepository.save(user);
            
            log.warn("Vượt quá số lần thử OTP cho email: {}", request.getEmail());
            throw new InvalidCredentialsException("Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới.");
        }

        if (!user.getOtpCode().equals(request.getOtp())) {
            user.setOtpAttempts(attempts + 1);
            userRepository.save(user);
            
            int remainingAttempts = 5 - (attempts + 1);
            log.warn("Mã OTP không đúng cho email: {} - Còn {} lần thử", request.getEmail(), remainingAttempts);
            throw new InvalidCredentialsException(
                "Mã OTP không chính xác. Còn " + remainingAttempts + " lần thử."
            );
        }

        log.info("Xác thực OTP thành công cho email: {}", request.getEmail());

        return VerifyOtpOnlyResponseDTO.builder()
                .message("Mã OTP chính xác. Vui lòng nhập mật khẩu mới.")
                .remainingAttempts(5 - attempts)
                .build();
    }

    @Override
    @Transactional(noRollbackFor = InvalidCredentialsException.class)
    public VerifyOtpResponseDTO verifyOtpAndResetPassword(VerifyOtpRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + request.getEmail()));

        if (user.getOtpCode() == null) {
            log.warn("Không tìm thấy mã OTP cho email: {}", request.getEmail());
            throw new InvalidCredentialsException("Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.");
        }

        if (Boolean.TRUE.equals(user.getOtpUsed())) {
            log.warn("Mã OTP đã được sử dụng cho email: {}", request.getEmail());
            throw new InvalidCredentialsException("Mã OTP đã được sử dụng");
        }

        if (user.getOtpExpiry() == null || Instant.now().isAfter(user.getOtpExpiry())) {
            log.warn("Mã OTP đã hết hạn cho email: {}", request.getEmail());
            throw new InvalidCredentialsException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        int attempts = user.getOtpAttempts() != null ? user.getOtpAttempts() : 0;
        
        if (attempts >= 5) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            user.setOtpUsed(true);
            user.setOtpAttempts(0);
            userRepository.save(user);
            
            log.warn("Vượt quá số lần thử OTP cho email: {}", request.getEmail());
            throw new InvalidCredentialsException("Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới.");
        }

        if (!user.getOtpCode().equals(request.getOtp())) {
            user.setOtpAttempts(attempts + 1);
            userRepository.save(user);
            
            int remainingAttempts = 5 - (attempts + 1);
            log.warn("Mã OTP không đúng cho email: {} - Còn {} lần thử", request.getEmail(), remainingAttempts);
            throw new InvalidCredentialsException(
                "Mã OTP không chính xác. Còn " + remainingAttempts + " lần thử."
            );
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setOtpUsed(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setOtpAttempts(0);

        userRepository.save(user);

        log.info("Đặt lại mật khẩu thành công cho email: {}", request.getEmail());

        return VerifyOtpResponseDTO.builder()
                .message("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.")
                .build();
    }
}