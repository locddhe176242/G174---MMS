package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.entity.APInvoiceAttachment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class APInvoiceAttachmentRequestDTO {
    private Integer apInvoiceId;
    private String fileName;
    private String fileUrl;
    private APInvoiceAttachment.FileType fileType;
    private Long fileSize;
    private String mimeType;
    private String description;
}
