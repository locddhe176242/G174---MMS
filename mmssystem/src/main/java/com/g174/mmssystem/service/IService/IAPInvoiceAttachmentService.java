package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.APInvoiceAttachmentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.APInvoiceAttachmentResponseDTO;
import com.g174.mmssystem.entity.APInvoiceAttachment;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IAPInvoiceAttachmentService {
    
    /**
     * Upload file và tạo attachment record
     */
    APInvoiceAttachmentResponseDTO uploadAttachment(
            Integer invoiceId, 
            MultipartFile file, 
            APInvoiceAttachment.FileType fileType,
            String description
    );
    
    /**
     * Tạo attachment record (khi file đã upload sẵn)
     */
    APInvoiceAttachmentResponseDTO createAttachment(APInvoiceAttachmentRequestDTO request);
    
    /**
     * Lấy danh sách attachments của invoice
     */
    List<APInvoiceAttachmentResponseDTO> getAttachmentsByInvoiceId(Integer invoiceId);
    
    /**
     * Lấy chi tiết attachment
     */
    APInvoiceAttachmentResponseDTO getAttachmentById(Integer attachmentId);
    
    /**
     * Xóa attachment (soft delete)
     */
    void deleteAttachment(Integer attachmentId);
    
    /**
     * Download file URL
     */
    String getDownloadUrl(Integer attachmentId);
}
