package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.SalesQuotationRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ISalesQuotationService {

    SalesQuotationResponseDTO createQuotation(SalesQuotationRequestDTO request);

    SalesQuotationResponseDTO updateQuotation(Integer id, SalesQuotationRequestDTO request);

    SalesQuotationResponseDTO getQuotation(Integer id);

    Page<SalesQuotationListResponseDTO> getQuotations(Integer customerId, String status, String keyword, Pageable pageable);

    void deleteQuotation(Integer id);

    SalesQuotationResponseDTO changeStatus(Integer id, String status);
}

