package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.PurchaseQuotationRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseQuotationResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.enums.PurchaseQuotationStatus;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.PurchaseQuotationMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IPurchaseQuotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PurchaseQuotationServiceImpl implements IPurchaseQuotationService {

    private final PurchaseQuotationRepository quotationRepository;
    private final PurchaseQuotationMapper quotationMapper;
    private final RFQRepository rfqRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final RFQItemRepository rfqItemRepository;
    private final ProductRepository productRepository;
    private final PurchaseQuotationItemRepository quotationItemRepository;

    @Override
    @Transactional
    public PurchaseQuotationResponseDTO createQuotation(PurchaseQuotationRequestDTO dto, Integer createdById) {
        log.info("Creating purchase quotation for RFQ ID: {}, Vendor ID: {}", dto.getRfqId(), dto.getVendorId());

        // Validate and load entities
        RFQ rfq = rfqRepository.findById(dto.getRfqId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found with ID: " + dto.getRfqId()));

        Vendor vendor = vendorRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + dto.getVendorId()));

        // Validate: One vendor can only submit one PQ per RFQ
        List<PurchaseQuotation> existingQuotations = quotationRepository.findByRfqIdAndVendorId(dto.getRfqId(), dto.getVendorId());
        if (existingQuotations != null && !existingQuotations.isEmpty()) {
            // Filter out deleted quotations
            long activeQuotationCount = existingQuotations.stream()
                    .filter(pq -> pq.getDeletedAt() == null)
                    .count();
            if (activeQuotationCount > 0) {
                PurchaseQuotation existing = existingQuotations.stream()
                        .filter(pq -> pq.getDeletedAt() == null)
                        .findFirst()
                        .orElse(null);
                String existingPqNo = existing != null ? existing.getPqNo() : "unknown";
                throw new IllegalStateException("Vendor đã có báo giá cho RFQ này (PQ: " + existingPqNo + "). Mỗi vendor chỉ có thể submit 1 PQ cho 1 RFQ.");
            }
        }

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdById));

        // Generate PQ number if not provided
        String pqNo = dto.getPqNo();
        if (pqNo == null || pqNo.trim().isEmpty()) {
            pqNo = generatePqNo();
        } else if (quotationRepository.existsByPqNo(pqNo)) {
            throw new DuplicateResourceException("Purchase Quotation number already exists: " + pqNo);
        }

        // Create quotation entity
        PurchaseQuotation quotation = PurchaseQuotation.builder()
                .pqNo(pqNo)
                .rfq(rfq)
                .vendor(vendor)
                .pqDate(dto.getPqDate() != null ? dto.getPqDate() : LocalDateTime.now())
                .validUntil(dto.getValidUntil())
                .isTaxIncluded(dto.getIsTaxIncluded() != null ? dto.getIsTaxIncluded() : false)
                .deliveryTerms(dto.getDeliveryTerms())
                .paymentTerms(dto.getPaymentTerms())
                .leadTimeDays(dto.getLeadTimeDays())
                .warrantyMonths(dto.getWarrantyMonths())
                .headerDiscount(dto.getHeaderDiscount() != null ? dto.getHeaderDiscount() : BigDecimal.ZERO)
                .shippingCost(dto.getShippingCost() != null ? dto.getShippingCost() : BigDecimal.ZERO)
                .totalAmount(dto.getTotalAmount() != null ? dto.getTotalAmount() : BigDecimal.ZERO)
                .status(dto.getStatus() != null ? dto.getStatus() : PurchaseQuotationStatus.Pending)
                .createdBy(createdBy)
                .notes(dto.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<PurchaseQuotationItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        RFQItem rfqItem = rfqItemRepository.findById(itemDto.getRfqItemId())
                                .orElseThrow(() -> new ResourceNotFoundException("RFQ Item not found with ID: " + itemDto.getRfqItemId()));

                        Product product = null;
                        if (itemDto.getProductId() != null) {
                            product = productRepository.findById(itemDto.getProductId())
                                    .orElse(null);
                        }

                        return PurchaseQuotationItem.builder()
                                .purchaseQuotation(quotation)
                                .rfqItem(rfqItem)
                                .product(product)
                                .quantity(itemDto.getQuantity())
                                .unitPrice(itemDto.getUnitPrice())
                                .discountPercent(itemDto.getDiscountPercent())
                                .taxRate(itemDto.getTaxRate())
                                .taxAmount(itemDto.getTaxAmount())
                                .lineTotal(itemDto.getLineTotal())
                                .remark(itemDto.getRemark())
                                .build();
                    })
                    .collect(Collectors.toList());
            quotation.setItems(items);
        }

        PurchaseQuotation saved = quotationRepository.save(quotation);
        PurchaseQuotation savedWithRelations = quotationRepository.findByIdWithRelations(saved.getPqId())
                .orElse(saved);

        log.info("Purchase quotation created successfully with ID: {} and number: {}", saved.getPqId(), saved.getPqNo());
        return quotationMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    public PurchaseQuotationResponseDTO getQuotationById(Integer pqId) {
        log.info("Fetching purchase quotation ID: {}", pqId);

        PurchaseQuotation quotation = quotationRepository.findByIdWithRelations(pqId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Quotation not found with ID: " + pqId));

        return quotationMapper.toResponseDTO(quotation);
    }

    @Override
    public List<PurchaseQuotationResponseDTO> getAllQuotations() {
        log.info("Fetching all purchase quotations");

        List<PurchaseQuotation> quotations = quotationRepository.findAllActive();
        return quotationMapper.toResponseDTOList(quotations);
    }

    @Override
    public Page<PurchaseQuotationResponseDTO> getAllQuotations(Pageable pageable) {
        log.info("Fetching purchase quotations with pagination");

        Page<PurchaseQuotation> quotations = quotationRepository.findAllActive(pageable);
        return quotations.map(quotationMapper::toResponseDTO);
    }

    @Override
    public List<PurchaseQuotationResponseDTO> searchQuotations(String keyword) {
        log.info("Searching purchase quotations with keyword: {}", keyword);

        List<PurchaseQuotation> quotations = quotationRepository.searchQuotations(keyword);
        return quotationMapper.toResponseDTOList(quotations);
    }

    @Override
    public Page<PurchaseQuotationResponseDTO> searchQuotations(String keyword, Pageable pageable) {
        log.info("Searching purchase quotations with keyword: {} and pagination", keyword);

        Page<PurchaseQuotation> quotations = quotationRepository.searchQuotations(keyword, pageable);
        return quotations.map(quotationMapper::toResponseDTO);
    }

    @Override
    public List<PurchaseQuotationResponseDTO> getQuotationsByRfqId(Integer rfqId) {
        log.info("Fetching purchase quotations for RFQ ID: {}", rfqId);

        List<PurchaseQuotation> quotations = quotationRepository.findByRfqId(rfqId);
        return quotationMapper.toResponseDTOList(quotations);
    }

    @Override
    public List<PurchaseQuotationResponseDTO> getQuotationsByVendorId(Integer vendorId) {
        log.info("Fetching purchase quotations for Vendor ID: {}", vendorId);

        List<PurchaseQuotation> quotations = quotationRepository.findByVendorId(vendorId);
        return quotationMapper.toResponseDTOList(quotations);
    }

    @Override
    @Transactional
    public PurchaseQuotationResponseDTO updateQuotation(Integer pqId, PurchaseQuotationRequestDTO dto, Integer updatedById) {
        log.info("Updating purchase quotation ID: {}", pqId);

        PurchaseQuotation quotation = quotationRepository.findById(pqId)
                .filter(q -> q.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Quotation not found with ID: " + pqId));

        if (quotation.getStatus() == PurchaseQuotationStatus.Approved) {
            throw new IllegalStateException("Cannot update approved quotation");
        }

        // Update fields
        if (dto.getValidUntil() != null) {
            quotation.setValidUntil(dto.getValidUntil());
        }
        if (dto.getIsTaxIncluded() != null) {
            quotation.setIsTaxIncluded(dto.getIsTaxIncluded());
        }
        if (dto.getDeliveryTerms() != null) {
            quotation.setDeliveryTerms(dto.getDeliveryTerms());
        }
        if (dto.getPaymentTerms() != null) {
            quotation.setPaymentTerms(dto.getPaymentTerms());
        }
        if (dto.getLeadTimeDays() != null) {
            quotation.setLeadTimeDays(dto.getLeadTimeDays());
        }
        if (dto.getWarrantyMonths() != null) {
            quotation.setWarrantyMonths(dto.getWarrantyMonths());
        }
        if (dto.getHeaderDiscount() != null) {
            quotation.setHeaderDiscount(dto.getHeaderDiscount());
        }
        if (dto.getShippingCost() != null) {
            quotation.setShippingCost(dto.getShippingCost());
        }
        if (dto.getTotalAmount() != null) {
            quotation.setTotalAmount(dto.getTotalAmount());
        }
        if (dto.getStatus() != null) {
            quotation.setStatus(dto.getStatus());
        }
        if (dto.getNotes() != null) {
            quotation.setNotes(dto.getNotes());
        }

        // Update items if provided
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            quotation.getItems().clear();
            List<PurchaseQuotationItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        RFQItem rfqItem = rfqItemRepository.findById(itemDto.getRfqItemId())
                                .orElseThrow(() -> new ResourceNotFoundException("RFQ Item not found with ID: " + itemDto.getRfqItemId()));

                        Product product = null;
                        if (itemDto.getProductId() != null) {
                            product = productRepository.findById(itemDto.getProductId())
                                    .orElse(null);
                        }

                        return PurchaseQuotationItem.builder()
                                .purchaseQuotation(quotation)
                                .rfqItem(rfqItem)
                                .product(product)
                                .quantity(itemDto.getQuantity())
                                .unitPrice(itemDto.getUnitPrice())
                                .discountPercent(itemDto.getDiscountPercent())
                                .taxRate(itemDto.getTaxRate())
                                .taxAmount(itemDto.getTaxAmount())
                                .lineTotal(itemDto.getLineTotal())
                                .remark(itemDto.getRemark())
                                .build();
                    })
                    .collect(Collectors.toList());
            quotation.setItems(items);
        }

        quotation.setUpdatedAt(LocalDateTime.now());
        PurchaseQuotation saved = quotationRepository.save(quotation);
        PurchaseQuotation savedWithRelations = quotationRepository.findByIdWithRelations(saved.getPqId())
                .orElse(saved);

        log.info("Purchase quotation updated successfully");
        return quotationMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseQuotationResponseDTO approveQuotation(Integer pqId, Integer approverId) {
        log.info("Approving purchase quotation ID: {} by approver ID: {}", pqId, approverId);

        PurchaseQuotation quotation = quotationRepository.findById(pqId)
                .filter(q -> q.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Quotation not found with ID: " + pqId));

        if (quotation.getStatus() != PurchaseQuotationStatus.Pending) {
            throw new IllegalStateException("Only pending quotations can be approved");
        }

        quotation.setStatus(PurchaseQuotationStatus.Approved);
        quotation.setUpdatedAt(LocalDateTime.now());

        PurchaseQuotation saved = quotationRepository.save(quotation);
        PurchaseQuotation savedWithRelations = quotationRepository.findByIdWithRelations(saved.getPqId())
                .orElse(saved);

        log.info("Purchase quotation approved successfully");
        return quotationMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseQuotationResponseDTO rejectQuotation(Integer pqId, Integer approverId, String reason) {
        log.info("Rejecting purchase quotation ID: {} by approver ID: {}", pqId, approverId);

        PurchaseQuotation quotation = quotationRepository.findById(pqId)
                .filter(q -> q.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Quotation not found with ID: " + pqId));

        if (quotation.getStatus() != PurchaseQuotationStatus.Pending) {
            throw new IllegalStateException("Only pending quotations can be rejected");
        }

        quotation.setStatus(PurchaseQuotationStatus.Rejected);
        if (reason != null && !reason.trim().isEmpty()) {
            quotation.setNotes((quotation.getNotes() != null ? quotation.getNotes() + "\n" : "") + "Rejection reason: " + reason);
        }
        quotation.setUpdatedAt(LocalDateTime.now());

        PurchaseQuotation saved = quotationRepository.save(quotation);
        PurchaseQuotation savedWithRelations = quotationRepository.findByIdWithRelations(saved.getPqId())
                .orElse(saved);

        log.info("Purchase quotation rejected successfully");
        return quotationMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseQuotationResponseDTO deleteQuotation(Integer pqId) {
        log.info("Deleting purchase quotation ID: {}", pqId);

        PurchaseQuotation quotation = quotationRepository.findById(pqId)
                .filter(q -> q.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Quotation not found with ID: " + pqId));

        quotation.setDeletedAt(LocalDateTime.now());
        PurchaseQuotation saved = quotationRepository.save(quotation);

        log.info("Purchase quotation deleted successfully");
        return quotationMapper.toResponseDTO(saved);
    }

    @Override
    public boolean existsByPqNo(String pqNo) {
        return quotationRepository.existsByPqNo(pqNo);
    }

    @Override
    public String generatePqNo() {
        String prefix = "PQ" + java.time.Year.now().getValue();
        java.util.Optional<PurchaseQuotation> lastQuotation = quotationRepository.findTopByPqNoStartingWithOrderByPqNoDesc(prefix);
        
        int nextNumber = 1;
        if (lastQuotation.isPresent()) {
            String lastNo = lastQuotation.get().getPqNo();
            try {
                String numberPart = lastNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Could not parse number from PQ number: {}", lastNo);
            }
        }
        
        return String.format("%s%04d", prefix, nextNumber);
    }
}

