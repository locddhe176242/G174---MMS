package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.RFQRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RFQResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IRFQService {
    RFQResponseDTO createRFQ(RFQRequestDTO dto, Integer createdById);
    
    RFQResponseDTO getRFQById(Integer rfqId);
    
    List<RFQResponseDTO> getAllRFQs();
    
    Page<RFQResponseDTO> getAllRFQs(Pageable pageable);
    
    List<RFQResponseDTO> searchRFQs(String keyword);
    
    Page<RFQResponseDTO> searchRFQs(String keyword, Pageable pageable);
    
    List<RFQResponseDTO> getRFQsByRequisitionId(Long requisitionId);
    
    RFQResponseDTO updateRFQ(Integer rfqId, RFQRequestDTO dto, Integer updatedById);
    
    RFQResponseDTO updateRFQStatus(Integer rfqId, com.g174.mmssystem.entity.RFQ.RFQStatus status);
    
    RFQResponseDTO closeRFQ(Integer rfqId);
    
    RFQResponseDTO cancelRFQ(Integer rfqId);
    
    RFQResponseDTO deleteRFQ(Integer rfqId);
    
    boolean existsByRfqNo(String rfqNo);
    
    String generateRfqNo();
}

