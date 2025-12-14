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

import com.g174.mmssystem.entity.RFQ;
import com.g174.mmssystem.entity.Vendor;

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
                            Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email hoặc liên hệ bộ phận hỗ trợ ngay lập tức.
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

    /**
     * Send RFQ invitation email to vendor
     * Note: Vendor email is validated in RFQService before calling this method
     */
    public void sendRFQInvitation(RFQ rfq, Vendor vendor) {
        try {
            String toEmail = vendor.getContact().getEmail().trim();
            String subject = String.format("[RFQ %s] Request for Quotation - %s", 
                rfq.getRfqNo(), 
                rfq.getIssueDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            
            String htmlContent = buildRFQEmailTemplate(rfq, vendor);
            sendHtmlEmail(toEmail, subject, htmlContent);
            
            log.info("RFQ invitation email sent successfully to vendor {} at {}", vendor.getName(), toEmail);
            
        } catch (Exception e) {
            log.error("Failed to send RFQ email to vendor {}: {}", vendor.getName(), e.getMessage(), e);
            throw new RuntimeException("Failed to send email to vendor: " + vendor.getName(), e);
        }
    }

    /**
     * Send RFQ invitation emails to multiple vendors
     * Note: All vendors are validated to have email addresses before calling this method
     */
    public void sendRFQInvitationsToVendors(com.g174.mmssystem.entity.RFQ rfq, java.util.List<com.g174.mmssystem.entity.Vendor> vendors) {
        if (vendors == null || vendors.isEmpty()) {
            log.warn("No vendors provided for RFQ {} email invitations", rfq.getRfqNo());
            return;
        }

        int successCount = 0;
        int failedCount = 0;
        java.util.List<String> failedVendors = new java.util.ArrayList<>();
        
        for (com.g174.mmssystem.entity.Vendor vendor : vendors) {
            try {
                sendRFQInvitation(rfq, vendor);
                successCount++;
            } catch (Exception e) {
                failedCount++;
                failedVendors.add(vendor.getName());
                log.error("Error sending email to vendor {}: {}", vendor.getName(), e.getMessage());
                // Continue with remaining vendors even if one fails
            }
        }
        
        log.info("Sent {} out of {} RFQ invitation emails for RFQ {}", successCount, vendors.size(), rfq.getRfqNo());
        
        if (failedCount > 0) {
            log.warn("Failed to send emails to {} vendors: {}", failedCount, String.join(", ", failedVendors));
        }
    }

    private String buildRFQEmailTemplate(com.g174.mmssystem.entity.RFQ rfq, com.g174.mmssystem.entity.Vendor vendor) {
        StringBuilder html = new StringBuilder();
        java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        html.append("<!DOCTYPE html>");
        html.append("<html lang='vi'>");
        html.append("<head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        html.append("<style>");
        html.append("body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }");
        html.append(".container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }");
        html.append(".header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }");
        html.append(".header h1 { margin: 0; font-size: 24px; }");
        html.append(".header p { margin: 5px 0 0 0; opacity: 0.9; }");
        html.append(".info-section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px; }");
        html.append(".info-row { display: flex; margin: 8px 0; }");
        html.append(".info-label { font-weight: 600; min-width: 150px; color: #495057; }");
        html.append(".info-value { color: #212529; }");
        html.append(".table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }");
        html.append("table { width: 100%; border-collapse: collapse; margin: 20px 0; min-width: 600px; }");
        html.append("th { background-color: #667eea; color: white; padding: 12px; text-align: left; font-weight: 600; white-space: nowrap; }");
        html.append("td { padding: 10px 12px; border-bottom: 1px solid #dee2e6; }");
        html.append("tr:hover { background-color: #f8f9fa; }");
        html.append(".cta-button { display: inline-block; background-color: #667eea; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; box-shadow: 0 2px 4px rgba(102,126,234,0.3); }");
        html.append(".cta-button:hover { background-color: #5568d3; }");
        html.append(".company-info { background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196F3; }");
        html.append(".footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef; font-size: 14px; color: #6c757d; }");
        html.append(".highlight { background-color: #fff3cd; padding: 2px 6px; border-radius: 3px; }");
        html.append("@media only screen and (max-width: 600px) { ");
        html.append("  .info-row { flex-direction: column; }");
        html.append("  .info-label { min-width: auto; margin-bottom: 4px; }");
        html.append("  table { font-size: 12px; }");
        html.append("  th, td { padding: 8px 6px; }");
        html.append("}");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        html.append("<div class='container'>");
        
        // Header
        html.append("<div class='header'>");
        html.append("<h1>🔔 Request for Quotation</h1>");
        html.append("<p>Material Management System</p>");
        html.append("</div>");
        
        // Greeting
        html.append("<p>Kính gửi <strong>").append(vendor.getName()).append("</strong>,</p>");
        html.append("<p>Chúng tôi trân trọng gửi đến Quý công ty yêu cầu báo giá cho các sản phẩm/dịch vụ sau:</p>");
        
        // RFQ Info
        html.append("<div class='info-section'>");
        html.append("<h3 style='margin-top: 0; color: #667eea;'>📋 Thông tin RFQ</h3>");
        html.append("<div class='info-row'>");
        html.append("<div class='info-label'>Số RFQ:</div>");
        html.append("<div class='info-value'><strong>").append(rfq.getRfqNo()).append("</strong></div>");
        html.append("</div>");
        html.append("<div class='info-row'>");
        html.append("<div class='info-label'>Ngày phát hành:</div>");
        html.append("<div class='info-value'>").append(rfq.getIssueDate().format(dateFormatter)).append("</div>");
        html.append("</div>");
        if (rfq.getDueDate() != null) {
            html.append("<div class='info-row'>");
            html.append("<div class='info-label'>Hạn chót báo giá:</div>");
            html.append("<div class='info-value'><span class='highlight'>").append(rfq.getDueDate().format(dateFormatter)).append("</span></div>");
            html.append("</div>");
        }
        if (rfq.getCreatedBy() != null) {
            html.append("<div class='info-row'>");
            html.append("<div class='info-label'>Người tạo RFQ:</div>");
            html.append("<div class='info-value'><strong>").append(rfq.getCreatedBy().getEmployeeCode() != null ? rfq.getCreatedBy().getEmployeeCode() : rfq.getCreatedBy().getEmployeeCode()).append("</strong></div>");
            html.append("</div>");
        }
        html.append("</div>");
        
        // Items Table
        html.append("<h3 style='color: #667eea;'>📦 Danh sách sản phẩm yêu cầu báo giá</h3>");
        html.append("<div class='table-responsive'>");
        html.append("<table>");
        html.append("<thead>");
        html.append("<tr>");
        html.append("<th style='width: 40px;'>STT</th>");
        html.append("<th>Mã SP</th>");
        html.append("<th>Tên sản phẩm</th>");
        html.append("<th>Thông số kỹ thuật</th>");
        html.append("<th>ĐVT</th>");
        html.append("<th style='text-align: right;'>Số lượng</th>");
        html.append("<th style='text-align: center;'>Ngày cần hàng</th>");
        html.append("</tr>");
        html.append("</thead>");
        html.append("<tbody>");
        
        if (rfq.getItems() != null && !rfq.getItems().isEmpty()) {
            int index = 1;
            for (com.g174.mmssystem.entity.RFQItem item : rfq.getItems()) {
                html.append("<tr>");
                html.append("<td>").append(index++).append("</td>");
                html.append("<td>").append(item.getProductCode() != null ? item.getProductCode() : "-").append("</td>");
                html.append("<td><strong>").append(item.getProductName()).append("</strong></td>");
                html.append("<td>").append(item.getSpec() != null ? item.getSpec() : "-").append("</td>");
                html.append("<td>").append(item.getUom() != null ? item.getUom() : "-").append("</td>");
                html.append("<td style='text-align: right;'><strong>").append(item.getQuantity()).append("</strong></td>");
                html.append("<td style='text-align: center;'>");
                if (item.getDeliveryDate() != null) {
                    html.append(item.getDeliveryDate().format(dateFormatter));
                } else {
                    html.append("-");
                }
                html.append("</td>");
                html.append("</tr>");
            }
        }
        
        html.append("</tbody>");
        html.append("</table>");
        html.append("</div>");
        
        // Notes
        if (rfq.getNotes() != null && !rfq.getNotes().trim().isEmpty()) {
            html.append("<div class='info-section'>");
            html.append("<h3 style='margin-top: 0; color: #667eea;'>📝 Ghi chú</h3>");
            html.append("<p style='margin: 0;'>").append(rfq.getNotes().replace("\n", "<br>")).append("</p>");
            html.append("</div>");
        }
        
        // Company Info
        html.append("<div class='company-info'>");
        html.append("<h3 style='margin-top: 0; color: #2196F3;'>🏢 Thông tin bên yêu cầu báo giá</h3>");
        html.append("<p style='margin: 5px 0;'><strong>Công ty:</strong> Material Management System Co., Ltd</p>");
        html.append("<p style='margin: 5px 0;'><strong>Địa chỉ:</strong> Trường ĐH FPT, TP Hà Nội</p>");
        html.append("<p style='margin: 5px 0;'><strong>MST:</strong> 0123456789</p>");
        html.append("<p style='margin: 5px 0;'><strong>Email:</strong> purchasing@mmssystem.com</p>");
        html.append("<p style='margin: 5px 0;'><strong>Hotline:</strong> 1900-xxxx</p>");
        html.append("</div>");
        
        // CTA
        html.append("<div style='text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;'>");
        html.append("<p style='font-size: 16px; margin: 0; color: #333;'>Vui lòng gửi báo giá của Quý công ty trước ngày <strong style='color: #667eea;'>");
        if (rfq.getDueDate() != null) {
            html.append(rfq.getDueDate().format(dateFormatter));
        } else {
            html.append("sớm nhất có thể");
        }
        html.append("</strong></p>");
        html.append("<p style='font-size: 14px; color: #6c757d; margin: 15px 0 0 0;'>Liên hệ trực tiếp: <strong>purchasing@mmssystem.com</strong> | <strong>Hotline: 1900-xxxx</strong></p>");
        html.append("</div>");
        
        // Footer
        html.append("<div class='footer'>");
        html.append("<p><strong>Trân trọng,</strong></p>");
        html.append("<p style='margin: 5px 0;'><strong>Material Management System</strong></p>");
        html.append("<p style='margin: 5px 0;'>📧 Email: support@mmssystem.com</p>");
        html.append("<p style='margin: 5px 0;'>📞 Hotline: 1900-xxxx</p>");
        html.append("<hr style='margin: 15px 0; border: none; border-top: 1px solid #dee2e6;'>");
        html.append("<p style='font-size: 12px; color: #868e96; margin: 10px 0;'>");
        html.append("Email này được gửi tự động từ hệ thống MMS. Vui lòng không trả lời trực tiếp email này.");
        html.append("</p>");
        html.append("</div>");
        
        html.append("</div>");
        html.append("</body>");
        html.append("</html>");
        
        return html.toString();
    }

    /**
     * Send Purchase Order confirmation email to vendor
     */
    public void sendPurchaseOrderEmail(com.g174.mmssystem.entity.PurchaseOrder purchaseOrder) {
        try {
            if (purchaseOrder.getVendor() == null || purchaseOrder.getVendor().getContact() == null) {
                log.warn("Cannot send PO email for {} - vendor or contact is null", purchaseOrder.getPoNo());
                return;
            }

            String vendorEmail = purchaseOrder.getVendor().getContact().getEmail();
            if (vendorEmail == null || vendorEmail.trim().isEmpty()) {
                log.warn("Cannot send PO email for {} - vendor email is missing", purchaseOrder.getPoNo());
                return;
            }

            String toEmail = vendorEmail.trim();
            String subject = String.format("[Purchase Order %s] Order Confirmation - %s", 
                purchaseOrder.getPoNo(),
                purchaseOrder.getOrderDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            
            String htmlContent = buildPurchaseOrderEmailTemplate(purchaseOrder);
            sendHtmlEmail(toEmail, subject, htmlContent);
            
            log.info("Purchase Order email sent successfully to vendor {} at {}", 
                    purchaseOrder.getVendor().getName(), toEmail);
            
        } catch (Exception e) {
            log.error("Failed to send PO email for {}: {}", purchaseOrder.getPoNo(), e.getMessage(), e);
            // Don't throw exception - email failure shouldn't block PO approval
        }
    }

    private String buildPurchaseOrderEmailTemplate(com.g174.mmssystem.entity.PurchaseOrder po) {
        StringBuilder html = new StringBuilder();
        java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        html.append("<!DOCTYPE html>");
        html.append("<html lang='vi'>");
        html.append("<head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        html.append("<style>");
        html.append("body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }");
        html.append(".container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }");
        html.append(".header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }");
        html.append(".info-section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px; }");
        html.append(".info-row { display: flex; margin: 8px 0; }");
        html.append(".info-label { font-weight: 600; min-width: 200px; color: #495057; }");
        html.append(".info-value { color: #212529; }");
        html.append(".table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }");
        html.append("table { width: 100%; border-collapse: collapse; margin: 15px 0; min-width: 700px; }");
        html.append("th { background-color: #667eea; color: white; padding: 12px; text-align: left; font-weight: 600; white-space: nowrap; }");
        html.append("td { padding: 10px 12px; border-bottom: 1px solid #dee2e6; }");
        html.append("tr:hover { background-color: #f8f9fa; }");
        html.append(".text-right { text-align: right; }");
        html.append(".summary-box { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }");
        html.append(".summary-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; }");
        html.append(".summary-label { font-weight: 500; color: #495057; }");
        html.append(".summary-value { font-weight: 600; color: #212529; }");
        html.append(".total-row { border-top: 2px solid #667eea; padding-top: 12px !important; margin-top: 12px; }");
        html.append(".total-value { color: #667eea; font-size: 24px; }");
        html.append(".footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef; font-size: 14px; color: #6c757d; }");
        html.append(".highlight { background-color: #fff3cd; padding: 2px 6px; border-radius: 3px; font-weight: 600; }");
        html.append("@media only screen and (max-width: 600px) { ");
        html.append("  .info-row, .summary-row { flex-direction: column; }");
        html.append("  .info-label { min-width: auto; margin-bottom: 4px; }");
        html.append("  table { font-size: 12px; }");
        html.append("  th, td { padding: 8px 6px; }");
        html.append("}");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        html.append("<div class='container'>");
        
        // Header
        html.append("<div class='header'>");
        html.append("<h1 style='margin: 0; font-size: 28px;'>🛒 Đơn Đặt Hàng</h1>");
        html.append("<p style='margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;'>Purchase Order Confirmation</p>");
        html.append("</div>");
        
        // Greeting
        html.append("<p style='font-size: 16px;'>Kính gửi <strong style='color: #667eea;'>").append(po.getVendor().getName()).append("</strong>,</p>");
        html.append("<p>Chúng tôi trân trọng gửi đến Quý công ty <strong>Đơn đặt hàng chính thức</strong> với thông tin chi tiết như sau:</p>");
        
        // PO Info Section
        html.append("<div class='info-section'>");
        html.append("<h3 style='margin-top: 0; color: #667eea;'>📋 Thông tin đơn hàng</h3>");
        html.append("<div class='info-row'>");
        html.append("<div class='info-label'>Số đơn hàng:</div>");
        html.append("<div class='info-value'><strong style='color: #667eea; font-size: 18px;'>").append(po.getPoNo()).append("</strong></div>");
        html.append("</div>");
        html.append("<div class='info-row'>");
        html.append("<div class='info-label'>Ngày đặt hàng:</div>");
        html.append("<div class='info-value'>").append(po.getOrderDate().format(dateFormatter)).append("</div>");
        html.append("</div>");
        if (po.getDeliveryDate() != null) {
            html.append("<div class='info-row'>");
            html.append("<div class='info-label'>Ngày giao hàng dự kiến:</div>");
            html.append("<div class='info-value'><span class='highlight'>").append(po.getDeliveryDate().format(dateFormatter)).append("</span></div>");
            html.append("</div>");
        }
        if (po.getPaymentTerms() != null && !po.getPaymentTerms().isEmpty()) {
            html.append("<div class='info-row'>");
            html.append("<div class='info-label'>Điều khoản thanh toán:</div>");
            html.append("<div class='info-value'><strong>").append(po.getPaymentTerms()).append("</strong></div>");
            html.append("</div>");
        }
        if (po.getCreatedBy() != null) {
            html.append("<div class='info-row'>");
            html.append("<div class='info-label'>Người tạo đơn:</div>");
            String creatorName = po.getCreatedBy().getEmployeeCode();
            if (po.getCreatedBy().getProfile() != null) {
                String firstName = po.getCreatedBy().getProfile().getFirstName();
                String lastName = po.getCreatedBy().getProfile().getLastName();
                if (firstName != null && lastName != null) {
                    creatorName = lastName + " " + firstName;
                } else if (firstName != null) {
                    creatorName = firstName;
                } else if (lastName != null) {
                    creatorName = lastName;
                }
            }
            html.append("<div class='info-value'>").append(creatorName).append("</div>");
            html.append("</div>");
        }
        html.append("</div>");
        
        // Items table
        html.append("<h3 style='color: #667eea; margin: 25px 0 10px 0;'>📦 Chi tiết sản phẩm đặt hàng</h3>");
        html.append("<div class='table-responsive'>");
        html.append("<table>");
        html.append("<thead>");
        html.append("<tr>");
        html.append("<th style='width: 50px;'>STT</th>");
        html.append("<th>Mã SP</th>");
        html.append("<th>Tên sản phẩm</th>");
        html.append("<th>Thông số</th>");
        html.append("<th style='text-align: center;'>ĐVT</th>");
        html.append("<th style='text-align: right;'>Số lượng</th>");
        html.append("<th style='text-align: right;'>Đơn giá</th>");
        html.append("<th style='text-align: right;'>Chiết khấu</th>");
        html.append("<th style='text-align: right;'>Thành tiền</th>");
        html.append("</tr>");
        html.append("</thead>");
        html.append("<tbody>");
        
        int index = 1;
        for (com.g174.mmssystem.entity.PurchaseOrderItem item : po.getItems()) {
            html.append("<tr>");
            html.append("<td>").append(index++).append("</td>");
            html.append("<td><strong>").append(item.getProduct().getSku() != null ? item.getProduct().getSku() : "-").append("</strong></td>");
            html.append("<td><strong>").append(item.getProduct().getName()).append("</strong></td>");
            html.append("<td>").append(item.getProduct().getDescription() != null ? item.getProduct().getDescription() : "-").append("</td>");
            html.append("<td style='text-align: center;'>").append(item.getUom() != null ? item.getUom() : "-").append("</td>");
            html.append("<td class='text-right'><strong>").append(item.getQuantity()).append("</strong></td>");
            html.append("<td class='text-right'>").append(String.format("%,.0f", item.getUnitPrice())).append("</td>");
            html.append("<td class='text-right'>");
            if (item.getDiscountPercent() != null && item.getDiscountPercent().compareTo(java.math.BigDecimal.ZERO) > 0) {
                html.append(item.getDiscountPercent()).append("%");
            } else {
                html.append("-");
            }
            html.append("</td>");
            
            // Calculate subtotal (quantity * unit_price)
            java.math.BigDecimal subtotal = item.getUnitPrice().multiply(item.getQuantity());
            html.append("<td class='text-right'><strong>").append(String.format("%,.0f", subtotal)).append("</strong></td>");
            html.append("</tr>");
        }
        
        html.append("</tbody>");
        html.append("</table>");
        html.append("</div>");
        
        // Summary Box with detailed calculations
        html.append("<div class='summary-box'>");
        html.append("<h3 style='margin-top: 0; color: #667eea;'>💰 Tổng kết thanh toán</h3>");
        
        html.append("<div class='summary-row'>");
        html.append("<div class='summary-label'>Tạm tính (Tổng giá trị hàng):</div>");
        html.append("<div class='summary-value'>").append(String.format("%,.0f VNĐ", po.getTotalBeforeTax())).append("</div>");
        html.append("</div>");
        
        if (po.getHeaderDiscount() != null && po.getHeaderDiscount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            // Calculate discount amount
            java.math.BigDecimal totalAfterLineDiscount = po.getItems().stream()
                .map(item -> {
                    java.math.BigDecimal subtotal = item.getUnitPrice().multiply(item.getQuantity());
                    if (item.getDiscountPercent() != null && item.getDiscountPercent().compareTo(java.math.BigDecimal.ZERO) > 0) {
                        java.math.BigDecimal discount = subtotal.multiply(item.getDiscountPercent()).divide(new java.math.BigDecimal(100), 2, java.math.RoundingMode.HALF_UP);
                        return subtotal.subtract(discount);
                    }
                    return subtotal;
                })
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            
            java.math.BigDecimal headerDiscountAmount = totalAfterLineDiscount.multiply(po.getHeaderDiscount()).divide(new java.math.BigDecimal(100), 2, java.math.RoundingMode.HALF_UP);
            
            html.append("<div class='summary-row'>");
            html.append("<div class='summary-label'>Chiết khấu tổng đơn (").append(po.getHeaderDiscount()).append("%):</div>");
            html.append("<div class='summary-value' style='color: #dc2626;'>- ").append(String.format("%,.0f VNĐ", headerDiscountAmount)).append("</div>");
            html.append("</div>");
            
            java.math.BigDecimal totalAfterHeaderDiscount = totalAfterLineDiscount.subtract(headerDiscountAmount);
            html.append("<div class='summary-row'>");
            html.append("<div class='summary-label'>Tiền sau chiết khấu tổng đơn:</div>");
            html.append("<div class='summary-value'>").append(String.format("%,.0f VNĐ", totalAfterHeaderDiscount)).append("</div>");
            html.append("</div>");
        }
        
        if (po.getTaxAmount() != null && po.getTaxAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            html.append("<div class='summary-row'>");
            html.append("<div class='summary-label'>Thuế VAT (10%):</div>");
            html.append("<div class='summary-value' style='color: #ea580c;'>+ ").append(String.format("%,.0f VNĐ", po.getTaxAmount())).append("</div>");
            html.append("</div>");
        }
        
        html.append("<div class='summary-row total-row'>");
        html.append("<div class='summary-label' style='font-size: 20px; font-weight: 700;'>Tổng giá trị đơn hàng:</div>");
        html.append("<div class='summary-value total-value'>").append(String.format("%,.0f VNĐ", po.getTotalAfterTax())).append("</div>");
        html.append("</div>");
        html.append("</div>");
        
        // Instructions
        html.append("<div class='info-box' style='border-left-color: #fbbf24; background-color: #fffbeb;'>");
        html.append("<p style='margin: 5px 0;'><strong>📌 Yêu cầu:</strong></p>");
        html.append("<ul style='margin: 10px 0; padding-left: 20px;'>");
        html.append("<li>Vui lòng xác nhận đơn hàng trong vòng <strong>24 giờ</strong></li>");
        html.append("<li>Chuẩn bị và giao hàng đúng thời gian đã thỏa thuận</li>");
        html.append("<li>Đảm bảo chất lượng sản phẩm theo yêu cầu</li>");
        html.append("</ul>");
        html.append("</div>");
        
        if (po.getShippingAddress() != null && !po.getShippingAddress().isEmpty()) {
            html.append("<p style='margin: 15px 0;'><strong>📍 Địa chỉ giao hàng:</strong></p>");
            html.append("<p style='margin: 5px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px;'>")
                .append(po.getShippingAddress()).append("</p>");
        }
        
        html.append("<p style='margin: 20px 0;'>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận mua hàng của chúng tôi.</p>");
        
        // Footer
        html.append("<div class='footer'>");
        html.append("<p><strong>Trân trọng,</strong></p>");
        html.append("<p style='margin: 5px 0;'><strong>Material Management System</strong></p>");
        html.append("<p style='margin: 5px 0;'>📧 Email: purchasing@mmssystem.com</p>");
        html.append("<p style='margin: 5px 0;'>📞 Hotline: 1900-xxxx</p>");
        html.append("<hr style='margin: 15px 0; border: none; border-top: 1px solid #dee2e6;'>");
        html.append("<p style='font-size: 12px; color: #868e96; margin: 10px 0;'>");
        html.append("Email này được gửi tự động từ hệ thống MMS. Vui lòng không trả lời trực tiếp email này.");
        html.append("</p>");
        html.append("</div>");
        
        html.append("</div>");
        html.append("</body>");
        html.append("</html>");
        
        return html.toString();
    }
}