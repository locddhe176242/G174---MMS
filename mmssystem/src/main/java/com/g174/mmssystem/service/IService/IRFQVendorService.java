package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.RFQVendorRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO;

import java.util.List;

public interface IRFQVendorService {
    RFQVendorResponseDTO createRFQVendor(RFQVendorRequestDTO dto);
    
    RFQVendorResponseDTO getRFQVendor(Integer rfqId, Integer vendorId);
    
    List<RFQVendorResponseDTO> getVendorsByRfqId(Integer rfqId);
    
    List<RFQVendorResponseDTO> getRfqsByVendorId(Integer vendorId);
    
    RFQVendorResponseDTO updateRFQVendorStatus(Integer rfqId, Integer vendorId, com.g174.mmssystem.enums.RFQVendorStatus status);
    
    void deleteRFQVendor(Integer rfqId, Integer vendorId);
    
    boolean existsByRfqIdAndVendorId(Integer rfqId, Integer vendorId);
}

