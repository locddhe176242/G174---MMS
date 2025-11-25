package com.g174.mmssystem.service;

import com.g174.mmssystem.exception.EmailSendingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-name:MMS System}")
    private String fromName;

    @Value("${app.otp.length:6}")
    private int otpLength;

    private static final SecureRandom random = new SecureRandom();

    public String generateOTP() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    public void sendOTPEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromName + " <noreply@mmssystem.com>");
            helper.setTo(toEmail);
            helper.setSubject("Mã OTP Đặt Lại Mật Khẩu - MMS System");

            String htmlContent = buildOTPEmailTemplate(otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
            throw new EmailSendingException("Gửi email OTP thất bại. Vui lòng thử lại sau.", e);
        }
    }

    private String buildOTPEmailTemplate(String otp) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .otp-box { background-color: #fff; border: 2px solid #4CAF50; padding: 20px; 
                               text-align: center; font-size: 32px; font-weight: bold; 
                               letter-spacing: 5px; margin: 20px 0; border-radius: 5px; color: #4CAF50; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    .warning { color: #ff6b6b; font-weight: bold; background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
                    .info { background-color: #e3f2fd; padding: 10px; border-left: 4px solid #2196F3; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Hệ Thống MMS</h1>
                    </div>
                    <div class="content">
                        <h2>Yêu Cầu Đặt Lại Mật Khẩu</h2>
                        <p>Xin chào,</p>
                        <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP sau đây:</p>
                        
                        <div class="otp-box">%s</div>
                        
                        <div class="info">
                            <strong>⏱️ Mã này sẽ hết hạn sau 10 phút.</strong>
                        </div>
                        
                        <div class="warning">
                            ⚠️ Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email hoặc liên hệ bộ phận hỗ trợ ngay lập tức.
                        </div>
                        
                        <p>Trân trọng,<br><strong>Đội ngũ MMS System</strong></p>
                    </div>
                    <div class="footer">
                        <p>Đây là email tự động. Vui lòng không trả lời.</p>
                        <p>&copy; 2025 MMS System. Bảo lưu mọi quyền.</p>
                    </div>
                </div>
            </body>
            </html>
            """, otp);
    }

    public void sendSimpleEmail(String toEmail, String subject, String body) {
        try {
            // Check if body contains HTML tags - if yes, send as HTML email
            if (body.trim().startsWith("<!DOCTYPE") || body.trim().startsWith("<html")) {
                sendHtmlEmail(toEmail, subject, body);
            } else {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);

                mailSender.send(message);
                log.info("Simple email sent successfully to: {}", toEmail);
            }
        } catch (Exception e) {
            log.error("Failed to send email to: {}", toEmail, e);
            throw new EmailSendingException("Gửi email thất bại. Vui lòng thử lại sau.", e);
        }
    }

    public void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromName + " <noreply@mmssystem.com>");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            mailSender.send(message);
            log.info("HTML email sent successfully to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send HTML email to: {}", toEmail, e);
            throw new EmailSendingException("Gửi email HTML thất bại. Vui lòng thử lại sau.", e);
        }
    }
}