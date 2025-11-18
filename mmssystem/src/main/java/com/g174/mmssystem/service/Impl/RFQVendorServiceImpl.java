package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.RFQVendorRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO;
import com.g174.mmssystem.entity.RFQ;
import com.g174.mmssystem.entity.RFQVendor;
import com.g174.mmssystem.entity.Vendor;
import com.g174.mmssystem.enums.RFQVendorStatus;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.RFQVendorMapper;
import com.g174.mmssystem.repository.RFQRepository;
import com.g174.mmssystem.repository.RFQVendorRepository;
import com.g174.mmssystem.repository.VendorRepository;
import com.g174.mmssystem.service.IService.IRFQVendorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RFQVendorServiceImpl implements IRFQVendorService {

    private final RFQVendorRepository rfqVendorRepository;
    private final RFQVendorMapper rfqVendorMapper;
    private final RFQRepository rfqRepository;
    private final VendorRepository vendorRepository;

    @Override
    @Transactional
    public RFQVendorResponseDTO createRFQVendor(RFQVendorRequestDTO dto) {
        log.info("Creating RFQ Vendor relationship: RFQ ID: {}, Vendor ID: {}", dto.getRfqId(), dto.getVendorId());

        // Check if relationship already exists
        if (rfqVendorRepository.existsByRfqIdAndVendorId(dto.getRfqId(), dto.getVendorId())) {
            throw new DuplicateResourceException("RFQ Vendor relationship already exists");
        }

        // Validate RFQ exists
        RFQ rfq = rfqRepository.findById(dto.getRfqId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found with ID: " + dto.getRfqId()));

        // Validate Vendor exists
        Vendor vendor = vendorRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + dto.getVendorId()));

        RFQVendor rfqVendor = RFQVendor.builder()
                .rfqId(dto.getRfqId())
                .vendorId(dto.getVendorId())
                .status(dto.getStatus() != null ? dto.getStatus() : RFQVendorStatus.Invited)
                .rfq(rfq)
                .vendor(vendor)
                .build();

        RFQVendor saved = rfqVendorRepository.save(rfqVendor);
        log.info("RFQ Vendor relationship created successfully");
        return rfqVendorMapper.toResponseDTO(saved);
    }

    @Override
    public RFQVendorResponseDTO getRFQVendor(Integer rfqId, Integer vendorId) {
        log.info("Fetching RFQ Vendor: RFQ ID: {}, Vendor ID: {}", rfqId, vendorId);
        
        RFQVendor rfqVendor = rfqVendorRepository.findByRfqIdAndVendorId(rfqId, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ Vendor relationship not found"));
        
        return rfqVendorMapper.toResponseDTO(rfqVendor);
    }

    @Override
    public List<RFQVendorResponseDTO> getVendorsByRfqId(Integer rfqId) {
        log.info("Fetching vendors for RFQ ID: {}", rfqId);
        
        List<RFQVendor> rfqVendors = rfqVendorRepository.findByRfqIdWithVendor(rfqId);
        return rfqVendorMapper.toResponseDTOList(rfqVendors);
    }

    @Override
    public List<RFQVendorResponseDTO> getRfqsByVendorId(Integer vendorId) {
        log.info("Fetching RFQs for Vendor ID: {}", vendorId);
        
        List<RFQVendor> rfqVendors = rfqVendorRepository.findByVendorId(vendorId);
        return rfqVendorMapper.toResponseDTOList(rfqVendors);
    }

    @Override
    @Transactional
    public RFQVendorResponseDTO updateRFQVendorStatus(Integer rfqId, Integer vendorId, RFQVendorStatus status) {
        log.info("Updating RFQ Vendor status: RFQ ID: {}, Vendor ID: {}, Status: {}", rfqId, vendorId, status);
        
        RFQVendor rfqVendor = rfqVendorRepository.findByRfqIdAndVendorId(rfqId, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ Vendor relationship not found"));
        
        rfqVendor.setStatus(status);
        RFQVendor saved = rfqVendorRepository.save(rfqVendor);
        
        log.info("RFQ Vendor status updated successfully");
        return rfqVendorMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public void deleteRFQVendor(Integer rfqId, Integer vendorId) {
        log.info("Deleting RFQ Vendor: RFQ ID: {}, Vendor ID: {}", rfqId, vendorId);
        
        RFQVendor rfqVendor = rfqVendorRepository.findByRfqIdAndVendorId(rfqId, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ Vendor relationship not found"));
        
        rfqVendorRepository.delete(rfqVendor);
        log.info("RFQ Vendor deleted successfully");
    }

    @Override
    public boolean existsByRfqIdAndVendorId(Integer rfqId, Integer vendorId) {
        return rfqVendorRepository.existsByRfqIdAndVendorId(rfqId, vendorId);
    }
}

