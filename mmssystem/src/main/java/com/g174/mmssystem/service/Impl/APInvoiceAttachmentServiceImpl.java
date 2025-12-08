package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.APInvoiceAttachmentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.APInvoiceAttachmentResponseDTO;
import com.g174.mmssystem.entity.APInvoice;
import com.g174.mmssystem.entity.APInvoiceAttachment;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.APInvoiceAttachmentRepository;
import com.g174.mmssystem.repository.APInvoiceRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IAPInvoiceAttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class APInvoiceAttachmentServiceImpl implements IAPInvoiceAttachmentService {

    private final APInvoiceAttachmentRepository attachmentRepository;
    private final APInvoiceRepository apInvoiceRepository;
    private final UserRepository userRepository;

    @Value("${file.upload.invoice-dir:uploads/invoices}")
    private String uploadDir;

    @Value("${file.upload.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    @Transactional
    public APInvoiceAttachmentResponseDTO uploadAttachment(
            Integer invoiceId,
            MultipartFile file,
            APInvoiceAttachment.FileType fileType,
            String description
    ) {
        // Validate invoice exists
        APInvoice invoice = apInvoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("File không được để trống");
        }

        // Validate file type (PDF, Image)
        String contentType = file.getContentType();
        if (contentType == null || 
            (!contentType.equals("application/pdf") && 
             !contentType.startsWith("image/"))) {
            throw new RuntimeException("Chỉ chấp nhận file PDF hoặc hình ảnh");
        }

        try {
            // Create upload directory if not exists
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : "";
            String uniqueFilename = UUID.randomUUID().toString() + extension;
            
            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Create attachment record
            APInvoiceAttachment attachment = new APInvoiceAttachment();
            attachment.setApInvoice(invoice);
            attachment.setFileName(originalFilename);
            attachment.setFileUrl("/uploads/invoices/" + uniqueFilename);
            attachment.setFileType(fileType != null ? fileType : APInvoiceAttachment.FileType.VENDOR_INVOICE);
            attachment.setFileSize(file.getSize());
            attachment.setMimeType(contentType);
            attachment.setDescription(description);
            attachment.setUploadedBy(getCurrentUser());
            attachment.setUploadedAt(LocalDateTime.now());

            APInvoiceAttachment saved = attachmentRepository.save(attachment);
            
            log.info("Uploaded attachment {} for invoice {}", uniqueFilename, invoiceId);
            
            return mapToResponseDTO(saved);

        } catch (IOException e) {
            log.error("Error uploading file for invoice {}: {}", invoiceId, e.getMessage());
            throw new RuntimeException("Lỗi khi upload file: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public APInvoiceAttachmentResponseDTO createAttachment(APInvoiceAttachmentRequestDTO request) {
        APInvoice invoice = apInvoiceRepository.findById(request.getApInvoiceId())
                .filter(inv -> inv.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + request.getApInvoiceId()));

        APInvoiceAttachment attachment = new APInvoiceAttachment();
        attachment.setApInvoice(invoice);
        attachment.setFileName(request.getFileName());
        attachment.setFileUrl(request.getFileUrl());
        attachment.setFileType(request.getFileType() != null ? request.getFileType() : APInvoiceAttachment.FileType.VENDOR_INVOICE);
        attachment.setFileSize(request.getFileSize());
        attachment.setMimeType(request.getMimeType());
        attachment.setDescription(request.getDescription());
        attachment.setUploadedBy(getCurrentUser());
        attachment.setUploadedAt(LocalDateTime.now());

        APInvoiceAttachment saved = attachmentRepository.save(attachment);
        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<APInvoiceAttachmentResponseDTO> getAttachmentsByInvoiceId(Integer invoiceId) {
        List<APInvoiceAttachment> attachments = attachmentRepository.findByInvoiceId(invoiceId);
        return attachments.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public APInvoiceAttachmentResponseDTO getAttachmentById(Integer attachmentId) {
        APInvoiceAttachment attachment = attachmentRepository.findByIdActive(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        return mapToResponseDTO(attachment);
    }

    @Override
    @Transactional
    public void deleteAttachment(Integer attachmentId) {
        APInvoiceAttachment attachment = attachmentRepository.findByIdActive(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        
        attachment.setDeletedAt(LocalDateTime.now());
        attachmentRepository.save(attachment);
        
        log.info("Deleted attachment {} for invoice {}", attachmentId, attachment.getApInvoice().getApInvoiceId());
    }

    @Override
    @Transactional(readOnly = true)
    public String getDownloadUrl(Integer attachmentId) {
        APInvoiceAttachment attachment = attachmentRepository.findByIdActive(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        
        return baseUrl + attachment.getFileUrl();
    }

    // ========== Helper Methods ==========

    private APInvoiceAttachmentResponseDTO mapToResponseDTO(APInvoiceAttachment attachment) {
        APInvoiceAttachmentResponseDTO dto = new APInvoiceAttachmentResponseDTO();
        dto.setAttachmentId(attachment.getAttachmentId());
        dto.setApInvoiceId(attachment.getApInvoice().getApInvoiceId());
        dto.setFileName(attachment.getFileName());
        dto.setFileUrl(attachment.getFileUrl());
        dto.setFileType(attachment.getFileType());
        dto.setFileSize(attachment.getFileSize());
        dto.setMimeType(attachment.getMimeType());
        dto.setDescription(attachment.getDescription());
        
        if (attachment.getUploadedBy() != null) {
            dto.setUploadedBy(attachment.getUploadedBy().getId());
            
            String uploaderName;
            if (attachment.getUploadedBy().getProfile() != null) {
                String firstName = attachment.getUploadedBy().getProfile().getFirstName();
                String lastName = attachment.getUploadedBy().getProfile().getLastName();
                uploaderName = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
                uploaderName = uploaderName.trim();
                if (uploaderName.isEmpty()) {
                    uploaderName = attachment.getUploadedBy().getEmail();
                }
            } else {
                uploaderName = attachment.getUploadedBy().getEmail();
            }
            dto.setUploadedByName(uploaderName);
        }
        
        dto.setUploadedAt(attachment.getUploadedAt());
        return dto;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user hiện tại"));
    }
}
