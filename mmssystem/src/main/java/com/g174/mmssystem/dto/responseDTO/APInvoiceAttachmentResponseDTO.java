package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.APInvoiceAttachment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class APInvoiceAttachmentResponseDTO {
    private Integer attachmentId;
    private Integer apInvoiceId;
    private String fileName;
    private String fileUrl;
    private APInvoiceAttachment.FileType fileType;
    private Long fileSize;
    private String mimeType;
    private String description;
    private Integer uploadedBy;
    private String uploadedByName;
    private LocalDateTime uploadedAt;
}
