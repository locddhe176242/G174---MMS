package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.RFQRequestDTO;
import com.g174.mmssystem.dto.requestDTO.RFQVendorRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RFQResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.entity.RFQ.RFQStatus;
import com.g174.mmssystem.enums.RFQVendorStatus;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.RFQMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.EmailService;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
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
    private final EmailService emailService;

    @Override
    @Transactional
    public RFQResponseDTO createRFQ(RFQRequestDTO dto, Integer createdById, boolean sendEmail) {
        log.info("Creating RFQ for Requisition ID: {}, sendEmail: {}", dto.getRequisitionId(), sendEmail);

        // Validate and load entities
        PurchaseRequisition requisition = null;
        if (dto.getRequisitionId() != null) {
            requisition = requisitionRepository.findById(dto.getRequisitionId())
                    .filter(r -> r.getDeletedAt() == null)
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found  " + dto.getRequisitionId()));
            
            // Note: One PR can create MULTIPLE RFQs for different product groups or procurement batches
            // This is standard ERP behavior - validation removed
        }

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found  " + createdById));

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

        // VALIDATE: All selected vendors must have email addresses BEFORE creating RFQ
        if (dto.getSelectedVendorIds() != null && !dto.getSelectedVendorIds().isEmpty()) {
            List<String> vendorsWithoutEmail = new ArrayList<>();
            
            for (Integer vendorId : dto.getSelectedVendorIds()) {
                Vendor vendor = vendorRepository.findById(vendorId).orElse(null);
                if (vendor == null) {
                    throw new ResourceNotFoundException("Vendor not found  " + vendorId);
                }
                
                // Check if vendor has email (same validation as PO)
                if (vendor.getContact() == null || 
                    vendor.getContact().getEmail() == null || 
                    vendor.getContact().getEmail().trim().isEmpty()) {
                    vendorsWithoutEmail.add(vendor.getName());
                }
            }
            
            // If any vendor doesn't have email, throw exception and stop RFQ creation
            if (!vendorsWithoutEmail.isEmpty()) {
                throw new IllegalStateException(
                    "Cannot create RFQ: The following vendors do not have email addresses: " + 
                    String.join(", ", vendorsWithoutEmail) + 
                    ". Please update vendor contact information before creating RFQ.");
            }
        }

        RFQ saved = rfqRepository.save(rfq);

        // Create RFQ Vendors and collect vendors for email sending
        List<Vendor> vendorsToNotify = new ArrayList<>();
        if (dto.getSelectedVendorIds() != null && !dto.getSelectedVendorIds().isEmpty()) {
            for (Integer vendorId : dto.getSelectedVendorIds()) {
                try {
                    RFQVendorRequestDTO vendorDto = RFQVendorRequestDTO.builder()
                            .rfqId(saved.getRfqId())
                            .vendorId(vendorId)
                            .status(RFQVendorStatus.Invited)
                            .build();
                    rfqVendorService.createRFQVendor(vendorDto);
                    
                    // Add vendor to notification list (now guaranteed to have email)
                    vendorRepository.findById(vendorId).ifPresent(vendorsToNotify::add);
                } catch (Exception e) {
                    log.warn("Failed to add vendor {} to RFQ {}: {}", vendorId, saved.getRfqId(), e.getMessage());
                }
            }
        }

        RFQ savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                .orElse(saved);

        // Send email notifications to vendors only if sendEmail is true
        if (sendEmail && !vendorsToNotify.isEmpty()) {
            try {
                emailService.sendRFQInvitationsToVendors(savedWithRelations, vendorsToNotify);
                log.info("Email notifications sent to {} vendors for RFQ {}", vendorsToNotify.size(), saved.getRfqNo());
                
                // Update RFQ status to "Sent" after successfully sending emails
                saved.setStatus(RFQStatus.Sent);
                saved = rfqRepository.save(saved);
                // Reload with relations after status update
                savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                        .orElse(saved);
                log.info("RFQ status updated to Sent after email delivery");
            } catch (Exception e) {
                log.error("Error sending email notifications for RFQ {}: {}", saved.getRfqNo(), e.getMessage(), e);
                // Don't fail the RFQ creation if email sending fails
                // RFQ will remain in Draft status if email fails
            }
        } else {
            log.info("Email sending skipped for RFQ {} (sendEmail={})", saved.getRfqNo(), sendEmail);
        }

        log.info("RFQ created successfully with ID: {} and number: {}", saved.getRfqId(), saved.getRfqNo());
        return rfqMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    public RFQResponseDTO getRFQById(Integer rfqId) {
        log.info("Fetching RFQ ID: {}", rfqId);

        RFQ rfq = rfqRepository.findByIdWithRelations(rfqId)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found  " + rfqId));

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
    public RFQResponseDTO updateRFQ(Integer rfqId, RFQRequestDTO dto, Integer updatedById, boolean sendEmail) {
        log.info("Updating RFQ ID: {}, sendEmail: {}", rfqId, sendEmail);

        RFQ rfq = rfqRepository.findById(rfqId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found  " + rfqId));

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
            // Remove all existing items properly for orphan removal
            rfq.getItems().clear();
            rfq.getItems().addAll(
                    dto.getItems().stream()
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
                            .collect(Collectors.toList())
            );
        }

        // Update vendors if provided
        List<Vendor> newVendorsToNotify = new ArrayList<>();
        if (dto.getSelectedVendorIds() != null) {
            // Get existing vendor IDs before update
            List<com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO> existingVendors = rfqVendorService.getVendorsByRfqId(rfqId);
            Set<Integer> existingVendorIds = existingVendors.stream()
                    .map(com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO::getVendorId)
                    .collect(Collectors.toSet());

            // Remove existing vendors
            for (com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO v : existingVendors) {
                try {
                    rfqVendorService.deleteRFQVendor(rfqId, v.getVendorId());
                } catch (Exception e) {
                    log.warn("Failed to remove vendor {}: {}", v.getVendorId(), e.getMessage());
                }
            }

            // Add new vendors and identify newly added ones
            for (Integer vendorId : dto.getSelectedVendorIds()) {
                try {
                    RFQVendorRequestDTO vendorDto = RFQVendorRequestDTO.builder()
                            .rfqId(rfqId)
                            .vendorId(vendorId)
                            .status(RFQVendorStatus.Invited)
                            .build();
                    rfqVendorService.createRFQVendor(vendorDto);

                    // If this vendor was not in the existing list, add to notification list
                    if (!existingVendorIds.contains(vendorId)) {
                        vendorRepository.findById(vendorId).ifPresent(newVendorsToNotify::add);
                    }
                } catch (Exception e) {
                    log.warn("Failed to add vendor {}: {}", vendorId, e.getMessage());
                }
            }
        }

        rfq.setUpdatedAt(LocalDateTime.now());
        RFQ saved = rfqRepository.save(rfq);
        RFQ savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                .orElse(saved);

        // Send email notifications to newly added vendors only if sendEmail is true
        if (sendEmail && !newVendorsToNotify.isEmpty()) {
            try {
                emailService.sendRFQInvitationsToVendors(savedWithRelations, newVendorsToNotify);
                log.info("Email notifications sent to {} new vendors for updated RFQ {}", 
                        newVendorsToNotify.size(), saved.getRfqNo());
                
                // Update RFQ status to "Sent" if it was in Draft status
                if (saved.getStatus() == RFQStatus.Draft) {
                    saved.setStatus(RFQStatus.Sent);
                    saved = rfqRepository.save(saved);
                    // Reload with relations after status update
                    savedWithRelations = rfqRepository.findByIdWithRelations(saved.getRfqId())
                            .orElse(saved);
                    log.info("RFQ status updated to Sent after sending emails to new vendors");
                }
            } catch (Exception e) {
                log.error("Failed to send email notifications for updated RFQ {}: {}", 
                        saved.getRfqNo(), e.getMessage(), e);
            }
        } else {
            log.info("Email sending skipped for RFQ {} (sendEmail={}, newVendors={})", 
                    saved.getRfqNo(), sendEmail, newVendorsToNotify.size());
        }

        log.info("RFQ updated successfully");
        return rfqMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public RFQResponseDTO updateRFQStatus(Integer rfqId, RFQ.RFQStatus status) {
        log.info("Updating RFQ status ID: {} to {}", rfqId, status);

        RFQ rfq = rfqRepository.findById(rfqId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found  " + rfqId));

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
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found  " + rfqId));

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
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found  " + rfqId));

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
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found  " + rfqId));

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
        
        // Kiểm tra và tìm số tiếp theo nếu bị trùng
        String rfqNo;
        int maxAttempts = 100; // Giới hạn số lần thử để tránh vòng lặp vô hạn
        int attempts = 0;
        
        do {
            rfqNo = String.format("%s%04d", prefix, nextNumber);
            if (!rfqRepository.existsByRfqNo(rfqNo)) {
                break;
            }
            nextNumber++;
            attempts++;
            
            if (attempts >= maxAttempts) {
                log.error("Could not generate unique RFQ number after {} attempts", maxAttempts);
                throw new RuntimeException("Không thể tạo mã RFQ duy nhất. Vui lòng thử lại sau.");
            }
        } while (true);
        
        return rfqNo;
    }
}

