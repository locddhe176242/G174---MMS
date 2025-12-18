package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.APInvoiceAttachmentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.APInvoiceAttachmentResponseDTO;
import com.g174.mmssystem.entity.APInvoiceAttachment;
import com.g174.mmssystem.service.IService.IAPInvoiceAttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ap-invoice-attachments")
@RequiredArgsConstructor
@Slf4j
public class APInvoiceAttachmentController {

    private final IAPInvoiceAttachmentService attachmentService;

    /**
     * Upload file đính kèm cho hóa đơn
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    @LogActivity(
            action = "UPLOAD_AP_INVOICE_ATTACHMENT",
            activityType = "AP_INVOICE_MANAGEMENT",
            description = "Upload file đính kèm cho hóa đơn AP ID: #{#invoiceId}"
    )
    public ResponseEntity<Map<String, Object>> uploadAttachment(
            @RequestParam("invoiceId") Integer invoiceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "fileType", required = false) APInvoiceAttachment.FileType fileType,
            @RequestParam(value = "description", required = false) String description
    ) {
        try {
            APInvoiceAttachmentResponseDTO attachment = attachmentService.uploadAttachment(
                    invoiceId, file, fileType, description
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Upload file thành công");
            response.put("attachment", attachment);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error uploading attachment for invoice {}: {}", invoiceId, e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Error uploading attachment for invoice {}: {}", invoiceId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi server khi upload file");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Tạo attachment record (file đã upload trước)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    @LogActivity(
            action = "CREATE_AP_INVOICE_ATTACHMENT",
            activityType = "AP_INVOICE_MANAGEMENT",
            description = "Tạo attachment record cho hóa đơn AP"
    )
    public ResponseEntity<?> createAttachment(@RequestBody APInvoiceAttachmentRequestDTO request) {
        try {
            APInvoiceAttachmentResponseDTO attachment = attachmentService.createAttachment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
        } catch (RuntimeException e) {
            log.error("Error creating attachment: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Error creating attachment: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi server khi tạo attachment");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Lấy danh sách attachments của hóa đơn
     */
    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    public ResponseEntity<?> getAttachmentsByInvoice(@PathVariable Integer invoiceId) {
        try {
            List<APInvoiceAttachmentResponseDTO> attachments = attachmentService.getAttachmentsByInvoiceId(invoiceId);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            log.error("Error fetching attachments for invoice {}: {}", invoiceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lấy chi tiết attachment
     */
    @GetMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    public ResponseEntity<?> getAttachment(@PathVariable Integer attachmentId) {
        try {
            APInvoiceAttachmentResponseDTO attachment = attachmentService.getAttachmentById(attachmentId);
            return ResponseEntity.ok(attachment);
        } catch (RuntimeException e) {
            log.error("Error fetching attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lấy download URL
     */
    @GetMapping("/{attachmentId}/download-url")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    public ResponseEntity<?> getDownloadUrl(@PathVariable Integer attachmentId) {
        try {
            String downloadUrl = attachmentService.getDownloadUrl(attachmentId);
            Map<String, String> response = new HashMap<>();
            response.put("downloadUrl", downloadUrl);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting download URL for attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting download URL for attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Stream file để xem trực tiếp (không bắt download)
     */
    @GetMapping("/{attachmentId}/view")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    public ResponseEntity<Resource> viewFile(@PathVariable Integer attachmentId) {
        try {
            APInvoiceAttachmentResponseDTO attachment = attachmentService.getAttachmentById(attachmentId);
            
            // Get file path from fileUrl (remove base URL part)
            String fileUrl = attachment.getFileUrl();
            String filePath = fileUrl.replace("/uploads/", "");
            
            Path path = Paths.get("uploads", filePath);
            Resource resource = new UrlResource(path.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                log.error("File not found or not readable: {}", path);
                return ResponseEntity.notFound().build();
            }
            
            // Determine content type
            String contentType = attachment.getMimeType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            // Set headers for inline display (not download)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getFileName() + "\"");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
                    
        } catch (MalformedURLException e) {
            log.error("Malformed URL for attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            log.error("Error viewing file for attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error viewing file for attachment {}: {}", attachmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lấy view URL (để xem file inline trong browser)
     */
    @GetMapping("/{attachmentId}/view-url")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    public ResponseEntity<?> getViewUrl(@PathVariable Integer attachmentId) {
        try {
            // Return API endpoint instead of static URL
            String viewUrl = "/api/ap-invoice-attachments/" + attachmentId + "/view";
            Map<String, String> response = new HashMap<>();
            response.put("viewUrl", viewUrl);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting view URL for attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting view URL for attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Xóa attachment
     */
    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTING')")
    @LogActivity(
            action = "DELETE_AP_INVOICE_ATTACHMENT",
            activityType = "AP_INVOICE_MANAGEMENT",
            description = "Xóa attachment ID: #{#attachmentId}"
    )
    public ResponseEntity<Void> deleteAttachment(@PathVariable Integer attachmentId) {
        try {
            attachmentService.deleteAttachment(attachmentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
