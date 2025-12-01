package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.PurchaseQuotationRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseQuotationResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IPurchaseQuotationService {
    PurchaseQuotationResponseDTO createQuotation(PurchaseQuotationRequestDTO dto, Integer createdById);
    
    PurchaseQuotationResponseDTO getQuotationById(Integer pqId);
    
    List<PurchaseQuotationResponseDTO> getAllQuotations();
    
    Page<PurchaseQuotationResponseDTO> getAllQuotations(Pageable pageable);
    
    List<PurchaseQuotationResponseDTO> searchQuotations(String keyword);
    
    Page<PurchaseQuotationResponseDTO> searchQuotations(String keyword, Pageable pageable);
    
    List<PurchaseQuotationResponseDTO> getQuotationsByRfqId(Integer rfqId);
    
    List<PurchaseQuotationResponseDTO> getQuotationsByVendorId(Integer vendorId);
    
    PurchaseQuotationResponseDTO updateQuotation(Integer pqId, PurchaseQuotationRequestDTO dto, Integer updatedById);
    
    PurchaseQuotationResponseDTO approveQuotation(Integer pqId, Integer approverId);
    
    PurchaseQuotationResponseDTO rejectQuotation(Integer pqId, Integer approverId, String reason);
    
    PurchaseQuotationResponseDTO deleteQuotation(Integer pqId);
    
    boolean existsByPqNo(String pqNo);
    
    String generatePqNo();
}

