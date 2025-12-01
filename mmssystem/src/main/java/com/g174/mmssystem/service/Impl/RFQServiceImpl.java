package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.RFQRequestDTO;
import com.g174.mmssystem.dto.requestDTO.RFQVendorRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RFQResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.enums.RFQVendorStatus;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.RFQMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IRFQService;
import com.g174.mmssystem.service.IService.IRFQVendorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RFQServiceImpl implements IRFQService {

    private final RFQRepository rfqRepository;
    private final RFQMapper rfqMapper;
    private final PurchaseRequisitionRepository requisitionRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PurchaseRequisitionItemRepository requisitionItemRepository;
    private final IRFQVendorService rfqVendorService;

    @Override
    @Transactional
    public RFQResponseDTO createRFQ(RFQRequestDTO dto, Integer createdById) {
        log.info("Creating RFQ for Requisition ID: {}", dto.getRequisitionId());

        // Validate and load entities
        PurchaseRequisition requisition = null;
        if (dto.getRequisitionId() != null) {
            requisition = requisitionRepository.findById(dto.getRequisitionId())
                    .filter(r -> r.getDeletedAt() == null)
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + dto.getRequisitionId()));
            
            // Note: One PR can create MULTIPLE RFQs for different product groups or procurement batches
            // This is standard ERP behavior - validation removed
        }

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdById));

        Vendor selectedVendor = null;
        if (dto.getSelectedVendorId() != null) {
            selectedVendor = vendorRepository.findById(dto.getSelectedVendorId())
                    .orElse(null);
        }

        // Generate RFQ number if not provided
        String rfqNo = dto.getRfqNo();
        if (rfqNo == null || rfqNo.trim().isEmpty()) {
            rfqNo = generateRfqNo();
        } else if (rfqRepository.existsByRfqNo(rfqNo)) {
            throw new DuplicateResourceException("RFQ number already exists: " + rfqNo);
        }

        // Create RFQ entity
        RFQ rfq = RFQ.builder()
                .rfqNo(rfqNo)
                .requisition(requisition)
                .issueDate(dto.getIssueDate() != null ? dto.getIssueDate() : LocalDate.now())
                .dueDate(dto.getDueDate())
                .status(dto.getStatus() != null ? dto.getStatus() : RFQ.RFQStatus.Draft)
                .selectedVendor(selectedVendor)
                .createdBy(createdBy)
                .notes(dto.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<RFQItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        PurchaseRequisitionItem pri = null;
                        if (itemDto.getPriId() != null) {
                            pri = requisitionItemRepository.findById(itemDto.getPriId().intValue())
                                    .orElse(null);
                        }

                        Product product = null;
                        if (itemDto.getProductId() != null) {
                            product = productRepository.findById(itemDto.getProductId())
                                    .orElse(null);
                        }

                        return RFQItem.builder()
                                .rfq(rfq)
                                .purchaseRequisitionItem(pri)
                                .product(product)
                                .productCode(itemDto.getProductCode())
                                .productName(itemDto.getProductName())
                                .spec(itemDto.getSpec())
                                .uom(itemDto.getUom())
                                .quantity(itemDto.getQuantity())
                                .deliveryDate(itemDto.getDeliveryDate())
                                .targetPrice(itemDto.getTargetPrice() != null ? itemDto.getTargetPrice() : BigDecimal.ZERO)
                                .priceUnit(itemDto.getPriceUnit() != null ? itemDto.getPriceUnit() : BigDecimal.ONE)
                                .note(itemDto.getNote())
                                .build();
                    })
                    .collect(Collectors.toList());
            rfq.setItems(items);
        }

        RFQ saved = rfqRepository.save(rfq);

        // Create RFQ Vendors if selectedVendorIds provided
        if (dto.getSelectedVendorIds() != null && !dto.getSelectedVendorIds().isEmpty()) {
            for (Integer vendorId : dto.getSelectedVendorIds()) {
                try {
                    RFQVendorRequestDTO vendorDto = RFQVendorRequestDTO.builder()
                            .rfqId(saved.getRfqId())
                            .vendorId(vendorId)
                            .status(RFQVendorStatus.Invited)
                            .build();
                    rfqVendorService.createRFQVendor(vendorDto);
                } catch (Exception e) {
                    log.warn("Failed to add vendor {} to RFQ {}: {}", vendorId, saved.getRfqId(), e.getMessage());
                }
            }
        }

        RFQ savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                .orElse(saved);

        log.info("RFQ created successfully with ID: {} and number: {}", saved.getRfqId(), saved.getRfqNo());
        return rfqMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    public RFQResponseDTO getRFQById(Integer rfqId) {
        log.info("Fetching RFQ ID: {}", rfqId);

        RFQ rfq = rfqRepository.findByIdWithRelations(rfqId)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found with ID: " + rfqId));

        return rfqMapper.toResponseDTO(rfq);
    }

    @Override
    public List<RFQResponseDTO> getAllRFQs() {
        log.info("Fetching all RFQs");

        List<RFQ> rfqs = rfqRepository.findAllActive();
        return rfqMapper.toResponseDTOList(rfqs);
    }

    @Override
    public Page<RFQResponseDTO> getAllRFQs(Pageable pageable) {
        log.info("Fetching RFQs with pagination");

        Page<RFQ> rfqs = rfqRepository.findAllActive(pageable);
        return rfqs.map(rfqMapper::toResponseDTO);
    }

    @Override
    public List<RFQResponseDTO> searchRFQs(String keyword) {
        log.info("Searching RFQs with keyword: {}", keyword);

        List<RFQ> rfqs = rfqRepository.searchRFQs(keyword);
        return rfqMapper.toResponseDTOList(rfqs);
    }

    @Override
    public Page<RFQResponseDTO> searchRFQs(String keyword, Pageable pageable) {
        log.info("Searching RFQs with keyword: {} and pagination", keyword);

        Page<RFQ> rfqs = rfqRepository.searchRFQs(keyword, pageable);
        return rfqs.map(rfqMapper::toResponseDTO);
    }

    @Override
    public List<RFQResponseDTO> getRFQsByRequisitionId(Long requisitionId) {
        log.info("Fetching RFQs for Requisition ID: {}", requisitionId);

        List<RFQ> rfqs = rfqRepository.findByRequisitionId(requisitionId);
        return rfqMapper.toResponseDTOList(rfqs);
    }

    @Override
    @Transactional
    public RFQResponseDTO updateRFQ(Integer rfqId, RFQRequestDTO dto, Integer updatedById) {
        log.info("Updating RFQ ID: {}", rfqId);

        RFQ rfq = rfqRepository.findById(rfqId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found with ID: " + rfqId));

        if (rfq.getStatus() == RFQ.RFQStatus.Closed || rfq.getStatus() == RFQ.RFQStatus.Cancelled) {
            throw new IllegalStateException("Cannot update RFQ with status: " + rfq.getStatus());
        }

        // Update fields
        if (dto.getIssueDate() != null) {
            rfq.setIssueDate(dto.getIssueDate());
        }
        if (dto.getDueDate() != null) {
            rfq.setDueDate(dto.getDueDate());
        }
        if (dto.getStatus() != null) {
            rfq.setStatus(dto.getStatus());
        }
        if (dto.getSelectedVendorId() != null) {
            Vendor vendor = vendorRepository.findById(dto.getSelectedVendorId())
                    .orElse(null);
            rfq.setSelectedVendor(vendor);
        }
        if (dto.getNotes() != null) {
            rfq.setNotes(dto.getNotes());
        }

        // Update items if provided
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            rfq.getItems().clear();
            List<RFQItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        PurchaseRequisitionItem pri = null;
                        if (itemDto.getPriId() != null) {
                            pri = requisitionItemRepository.findById(itemDto.getPriId().intValue())
                                    .orElse(null);
                        }

                        Product product = null;
                        if (itemDto.getProductId() != null) {
                            product = productRepository.findById(itemDto.getProductId())
                                    .orElse(null);
                        }

                        return RFQItem.builder()
                                .rfq(rfq)
                                .purchaseRequisitionItem(pri)
                                .product(product)
                                .productCode(itemDto.getProductCode())
                                .productName(itemDto.getProductName())
                                .spec(itemDto.getSpec())
                                .uom(itemDto.getUom())
                                .quantity(itemDto.getQuantity())
                                .deliveryDate(itemDto.getDeliveryDate())
                                .targetPrice(itemDto.getTargetPrice() != null ? itemDto.getTargetPrice() : BigDecimal.ZERO)
                                .priceUnit(itemDto.getPriceUnit() != null ? itemDto.getPriceUnit() : BigDecimal.ONE)
                                .note(itemDto.getNote())
                                .build();
                    })
                    .collect(Collectors.toList());
            rfq.setItems(items);
        }

        // Update vendors if provided
        if (dto.getSelectedVendorIds() != null) {
            // Remove existing vendors
            List<com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO> existingVendors = rfqVendorService.getVendorsByRfqId(rfqId);
            for (com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO v : existingVendors) {
                try {
                    rfqVendorService.deleteRFQVendor(rfqId, v.getVendorId());
                } catch (Exception e) {
                    log.warn("Failed to remove vendor {}: {}", v.getVendorId(), e.getMessage());
                }
            }

            // Add new vendors
            for (Integer vendorId : dto.getSelectedVendorIds()) {
                try {
                    RFQVendorRequestDTO vendorDto = RFQVendorRequestDTO.builder()
                            .rfqId(rfqId)
                            .vendorId(vendorId)
                            .status(RFQVendorStatus.Invited)
                            .build();
                    rfqVendorService.createRFQVendor(vendorDto);
                } catch (Exception e) {
                    log.warn("Failed to add vendor {}: {}", vendorId, e.getMessage());
                }
            }
        }

        rfq.setUpdatedAt(LocalDateTime.now());
        RFQ saved = rfqRepository.save(rfq);
        RFQ savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                .orElse(saved);

        log.info("RFQ updated successfully");
        return rfqMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public RFQResponseDTO updateRFQStatus(Integer rfqId, RFQ.RFQStatus status) {
        log.info("Updating RFQ status ID: {} to {}", rfqId, status);

        RFQ rfq = rfqRepository.findById(rfqId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found with ID: " + rfqId));

        rfq.setStatus(status);
        rfq.setUpdatedAt(LocalDateTime.now());

        RFQ saved = rfqRepository.save(rfq);
        RFQ savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                .orElse(saved);

        log.info("RFQ status updated successfully");
        return rfqMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public RFQResponseDTO closeRFQ(Integer rfqId) {
        log.info("Closing RFQ ID: {}", rfqId);

        RFQ rfq = rfqRepository.findById(rfqId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found with ID: " + rfqId));

        rfq.setStatus(RFQ.RFQStatus.Closed);
        rfq.setUpdatedAt(LocalDateTime.now());

        RFQ saved = rfqRepository.save(rfq);
        RFQ savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                .orElse(saved);

        log.info("RFQ closed successfully");
        return rfqMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public RFQResponseDTO cancelRFQ(Integer rfqId) {
        log.info("Cancelling RFQ ID: {}", rfqId);

        RFQ rfq = rfqRepository.findById(rfqId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found with ID: " + rfqId));

        rfq.setStatus(RFQ.RFQStatus.Cancelled);
        rfq.setUpdatedAt(LocalDateTime.now());

        RFQ saved = rfqRepository.save(rfq);
        RFQ savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                .orElse(saved);

        log.info("RFQ cancelled successfully");
        return rfqMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public RFQResponseDTO deleteRFQ(Integer rfqId) {
        log.info("Deleting RFQ ID: {}", rfqId);

        RFQ rfq = rfqRepository.findById(rfqId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found with ID: " + rfqId));

        rfq.setDeletedAt(LocalDateTime.now());
        RFQ saved = rfqRepository.save(rfq);

        log.info("RFQ deleted successfully");
        return rfqMapper.toResponseDTO(saved);
    }

    @Override
    public boolean existsByRfqNo(String rfqNo) {
        return rfqRepository.existsByRfqNo(rfqNo);
    }

    @Override
    public String generateRfqNo() {
        String prefix = "RFQ" + java.time.Year.now().getValue();
        java.util.Optional<RFQ> lastRFQ = rfqRepository.findTopByRfqNoStartingWithOrderByRfqNoDesc(prefix);
        
        int nextNumber = 1;
        if (lastRFQ.isPresent()) {
            String lastNo = lastRFQ.get().getRfqNo();
            try {
                String numberPart = lastNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Could not parse number from RFQ number: {}", lastNo);
            }
        }
        
        return String.format("%s%04d", prefix, nextNumber);
    }
}

