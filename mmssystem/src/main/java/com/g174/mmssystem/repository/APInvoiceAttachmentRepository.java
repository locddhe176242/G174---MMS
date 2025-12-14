package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.APInvoiceAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface APInvoiceAttachmentRepository extends JpaRepository<APInvoiceAttachment, Integer> {
    
    @Query("SELECT a FROM APInvoiceAttachment a WHERE a.apInvoice.apInvoiceId = :invoiceId AND a.deletedAt IS NULL")
    List<APInvoiceAttachment> findByInvoiceId(@Param("invoiceId") Integer invoiceId);
    
    @Query("SELECT a FROM APInvoiceAttachment a WHERE a.attachmentId = :id AND a.deletedAt IS NULL")
    Optional<APInvoiceAttachment> findByIdActive(@Param("id") Integer id);
    
    @Query("SELECT a FROM APInvoiceAttachment a WHERE a.apInvoice.apInvoiceId = :invoiceId AND a.fileType = :fileType AND a.deletedAt IS NULL")
    List<APInvoiceAttachment> findByInvoiceIdAndFileType(@Param("invoiceId") Integer invoiceId, 
                                                          @Param("fileType") APInvoiceAttachment.FileType fileType);
}
