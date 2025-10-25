package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.entity.PurchaseRequisition;
import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import com.g174.mmssystem.entity.Product;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.exception.UnauthorizedException;
import com.g174.mmssystem.repository.PurchaseRequisitionItemRepository;
import com.g174.mmssystem.repository.PurchaseRequisitionRepository;
import com.g174.mmssystem.repository.ProductRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IPurchaseRequisitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import com.g174.mmssystem.entity.PurchaseRequisitionStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PurchaseRequisitionServiceImpl implements IPurchaseRequisitionService {

    private final PurchaseRequisitionRepository purchaseRequisitionRepository;
    private final PurchaseRequisitionItemRepository purchaseRequisitionItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public String generateNextRequisitionNumber() {
        String currentYear = String.valueOf(LocalDateTime.now().getYear());
        log.info("Generating requisition number for year: {}", currentYear);

        try {
            Integer maxNumber = purchaseRequisitionRepository.getMaxRequisitionNumberForYear(currentYear);
            log.info("Max number found: {}", maxNumber);

            int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
            log.info("Next number: {}", nextNumber);

            String requisitionNo = String.format("PR-%s-%03d", currentYear, nextNumber);
            log.info("Generated requisition number: {}", requisitionNo);

            // Verify uniqueness
            int attempts = 0;
            while (purchaseRequisitionRepository.existsByRequisitionNoAndDeletedAtIsNull(requisitionNo) && attempts < 10) {
                nextNumber++;
                requisitionNo = String.format("PR-%s-%03d", currentYear, nextNumber);
                attempts++;
                log.info("Retry attempt {}: {}", attempts, requisitionNo);
            }

            if (attempts >= 10) {
                throw new RuntimeException("Unable to generate unique requisition number after 10 attempts");
            }

            return requisitionNo;
        } catch (Exception e) {
            log.error("Error in generateNextRequisitionNumber: ", e);
            throw e;
        }
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO createPurchaseRequisition(PurchaseRequisitionRequestDTO requestDTO) {
        log.info("Creating purchase requisition with number: {}", requestDTO.getRequisitionNo());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer requesterId = null;

        if (authentication != null && authentication.getPrincipal() instanceof String) {
            String email = (String) authentication.getPrincipal();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UnauthorizedException("Không tìm thấy người dùng với email: " + email));
            requesterId = currentUser.getId();
        }

        if (requesterId == null) {
            throw new UnauthorizedException("Không thể xác định người tạo yêu cầu");
        }

        // Tạo PurchaseRequisition entity
        PurchaseRequisition purchaseRequisition = new PurchaseRequisition();
        purchaseRequisition.setRequisitionNo(requestDTO.getRequisitionNo());
        purchaseRequisition.setRequesterId(requesterId); // Tự động set từ JWT
        purchaseRequisition.setPurpose(requestDTO.getPurpose());
        purchaseRequisition.setStatus(PurchaseRequisitionStatus.valueOf(requestDTO.getStatus()));
        purchaseRequisition.setApproverId(null);
        purchaseRequisition.setApprovedAt(null);

        // Save main requisition
        PurchaseRequisition savedRequisition = purchaseRequisitionRepository.save(purchaseRequisition);
        log.info("Saved purchase requisition with ID: {}", savedRequisition.getRequisitionId());

        // Save items
        if (requestDTO.getItems() != null && !requestDTO.getItems().isEmpty()) {
            for (PurchaseRequisitionItemRequestDTO itemDTO : requestDTO.getItems()) {
                createRequisitionItem(savedRequisition.getRequisitionId(), itemDTO);
            }
        }

        return convertToResponseDTO(savedRequisition);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO updatePurchaseRequisition(Integer id, PurchaseRequisitionRequestDTO requestDTO) {
        log.info("Updating purchase requisition with ID: {}", id);

        PurchaseRequisition requisition = purchaseRequisitionRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase requisition not found with ID: " + id));

        // Update basic fields
        requisition.setPurpose(requestDTO.getPurpose());
        requisition.setStatus(PurchaseRequisitionStatus.valueOf(requestDTO.getStatus()));

        // Không update requesterId vì đã được set khi tạo
        // Không update approverId vì sẽ được set khi approve
        // Không update approvedAt vì sẽ được set khi approve

        PurchaseRequisition savedRequisition = purchaseRequisitionRepository.save(requisition);

        // Update items - FIXED: Use proper deletion method
        if (requestDTO.getItems() != null) {
            // Delete existing items properly
            List<PurchaseRequisitionItem> existingItems = purchaseRequisitionItemRepository.findByRequisitionId(id);
            if (existingItems != null && !existingItems.isEmpty()) {
                purchaseRequisitionItemRepository.deleteAll(existingItems);
            }

            // Create new items
            List<PurchaseRequisitionItem> items = requestDTO.getItems().stream()
                    .map(itemDTO -> createRequisitionItem(id, itemDTO))
                    .collect(Collectors.toList());

            purchaseRequisitionItemRepository.saveAll(items);
        }

        log.info("Successfully updated purchase requisition with ID: {}", id);
        return convertToResponseDTO(savedRequisition);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseRequisitionResponseDTO getPurchaseRequisitionById(Integer id) {
        PurchaseRequisition requisition = purchaseRequisitionRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase requisition not found with ID: " + id));

        return convertToResponseDTO(requisition);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseRequisitionResponseDTO getPurchaseRequisitionByNumber(String requisitionNo) {
        PurchaseRequisition requisition = purchaseRequisitionRepository.findByRequisitionNo(requisitionNo)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase requisition not found with number: " + requisitionNo));

        if (requisition.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Purchase requisition not found with number: " + requisitionNo);
        }

        return convertToResponseDTO(requisition);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseRequisitionResponseDTO> getAllPurchaseRequisitions(Pageable pageable) {
        Page<PurchaseRequisition> requisitions = purchaseRequisitionRepository.findAllActive(pageable);
        return requisitions.map(this::convertToResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseRequisitionResponseDTO> searchPurchaseRequisitions(String keyword, Pageable pageable) {
        Page<PurchaseRequisition> requisitions = purchaseRequisitionRepository.searchActive(keyword, pageable);
        return requisitions.map(this::convertToResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseRequisitionResponseDTO> getPurchaseRequisitionsByStatus(String status, Pageable pageable) {
        PurchaseRequisitionStatus requisitionStatus = PurchaseRequisitionStatus.valueOf(status);
        Page<PurchaseRequisition> requisitions = purchaseRequisitionRepository.findByStatus(requisitionStatus, pageable);
        return requisitions.map(this::convertToResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseRequisitionResponseDTO> getPurchaseRequisitionsByRequester(Integer requesterId, Pageable pageable) {
        Page<PurchaseRequisition> requisitions = purchaseRequisitionRepository.findByRequesterId(requesterId, pageable);
        return requisitions.map(this::convertToResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseRequisitionResponseDTO> getPurchaseRequisitionsByApprover(Integer approverId, Pageable pageable) {
        Page<PurchaseRequisition> requisitions = purchaseRequisitionRepository.findByApproverId(approverId, pageable);
        return requisitions.map(this::convertToResponseDTO);
    }

    @Override
    public void deletePurchaseRequisition(Integer id) {
        log.info("Deleting purchase requisition with ID: {}", id);

        PurchaseRequisition requisition = purchaseRequisitionRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase requisition not found with ID: " + id));

        requisition.setDeletedAt(LocalDateTime.now());
        purchaseRequisitionRepository.save(requisition);

        log.info("Successfully deleted purchase requisition with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByRequisitionNumber(String requisitionNo) {
        return purchaseRequisitionRepository.existsByRequisitionNoAndDeletedAtIsNull(requisitionNo);
    }

    private PurchaseRequisitionItem createRequisitionItem(Integer requisitionId, PurchaseRequisitionItemRequestDTO itemDTO) {  // FIXED: Long -> Integer
        // Validate product exists
        Product product = productRepository.findById(itemDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDTO.getProductId()));

        PurchaseRequisitionItem item = new PurchaseRequisitionItem();
        item.setRequisitionId(requisitionId);
        item.setProductId(itemDTO.getProductId());
        item.setRequestedQty(itemDTO.getRequestedQty());
        item.setDeliveryDate(itemDTO.getDeliveryDate());
        item.setValuationPrice(itemDTO.getValuationPrice());
        item.setPriceUnit(itemDTO.getPriceUnit());
        item.setNote(itemDTO.getNote());

        return item;
    }

    private PurchaseRequisitionResponseDTO convertToResponseDTO(PurchaseRequisition requisition) {
        PurchaseRequisitionResponseDTO responseDTO = new PurchaseRequisitionResponseDTO();
        responseDTO.setRequisitionId(requisition.getRequisitionId());
        responseDTO.setRequisitionNo(requisition.getRequisitionNo());
        responseDTO.setRequesterId(requisition.getRequesterId());
        responseDTO.setPurpose(requisition.getPurpose());
        responseDTO.setStatus(requisition.getStatus());
        responseDTO.setApproverId(requisition.getApproverId());
        responseDTO.setApprovedAt(requisition.getApprovedAt());
        responseDTO.setCreatedAt(requisition.getCreatedAt());
        responseDTO.setUpdatedAt(requisition.getUpdatedAt());

        // Fetch requester name separately
        User requester = userRepository.findById(requisition.getRequesterId()).orElse(null);
        if (requester != null) {
            responseDTO.setRequesterName(requester.getUsername());
        }

        // Fetch approver name separately
        if (requisition.getApproverId() != null) {
            User approver = userRepository.findById(requisition.getApproverId()).orElse(null);
            if (approver != null) {
                responseDTO.setApproverName(approver.getUsername());
            }
        }

        // Fetch items separately
        List<PurchaseRequisitionItem> items = purchaseRequisitionItemRepository.findByRequisitionId(requisition.getRequisitionId());
        if (items != null && !items.isEmpty()) {
            List<PurchaseRequisitionItemResponseDTO> itemDTOs = items.stream()
                    .map(this::convertItemToResponseDTO)
                    .collect(Collectors.toList());
            responseDTO.setItems(itemDTOs);
        } else {
            responseDTO.setItems(new ArrayList<>());
        }

        return responseDTO;
    }

    private PurchaseRequisitionItemResponseDTO convertItemToResponseDTO(PurchaseRequisitionItem item) {
        PurchaseRequisitionItemResponseDTO itemDTO = new PurchaseRequisitionItemResponseDTO();
        itemDTO.setPriId(item.getPriId());
        itemDTO.setRequisitionId(item.getRequisitionId());
        itemDTO.setProductId(item.getProductId());
        itemDTO.setRequestedQty(item.getRequestedQty());
        itemDTO.setDeliveryDate(item.getDeliveryDate());
        itemDTO.setValuationPrice(item.getValuationPrice());
        itemDTO.setPriceUnit(item.getPriceUnit());
        itemDTO.setNote(item.getNote());

        // Fetch product details separately
        Product product = productRepository.findById(item.getProductId()).orElse(null);
        if (product != null) {
            itemDTO.setProductCode(product.getSku());
            itemDTO.setProductName(product.getName());
        }

        return itemDTO;
    }
}