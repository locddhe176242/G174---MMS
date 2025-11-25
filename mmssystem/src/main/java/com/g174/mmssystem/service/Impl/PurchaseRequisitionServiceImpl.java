package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.entity.PurchaseRequisition;
import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.enums.RequisitionStatus;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.PurchaseRequisitionMapper;
import com.g174.mmssystem.repository.PurchaseRequisitionRepository;
import com.g174.mmssystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PurchaseRequisitionServiceImpl implements IPurchaseRequisitionService {

    private final PurchaseRequisitionRepository requisitionRepository;
    private final PurchaseRequisitionMapper requisitionMapper;
    private final UserRepository userRepository;
    private final com.g174.mmssystem.repository.ProductRepository productRepository;

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO createRequisition(PurchaseRequisitionRequestDTO dto, Integer requesterId) {
        log.info("Tạo purchase requisition mới cho requester ID: {}", requesterId);

        // Validate requester
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + requesterId));

        // Generate requisition number if not provided
        String requisitionNo = dto.getRequisitionNo();
        if (requisitionNo == null || requisitionNo.trim().isEmpty()) {
            requisitionNo = generateRequisitionNo();
        }

        // Set requisition date if not provided
        LocalDate requisitionDate = dto.getRequisitionDate();
        if (requisitionDate == null) {
            requisitionDate = LocalDate.now();
        }

        // Create requisition entity
        PurchaseRequisition requisition = PurchaseRequisition.builder()
                .requisitionNo(requisitionNo)
                .requisitionDate(requisitionDate)
                .requester(requester)
                .purpose(dto.getPurpose())
                .status(dto.getStatus() != null ? dto.getStatus() : RequisitionStatus.Draft)
                .approver(dto.getApproverId() != null ? userRepository.findById(dto.getApproverId()).orElse(null) : null)
                .approvedAt(dto.getApprovedAt())
                .createdBy(requester)
                .updatedBy(requester)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create and save items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<PurchaseRequisitionItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        // Load Product entity if productId is provided
                        com.g174.mmssystem.entity.Product product = null;
                        if (itemDto.getProductId() != null) {
                            product = productRepository.findById(itemDto.getProductId().intValue())
                                    .orElse(null); // Allow null product
                        }

                        // Set product name from product if not provided
                        String productName = itemDto.getProductName();
                        if (productName == null || productName.trim().isEmpty()) {
                            productName = product != null ? product.getName() : null;
                        }

                        // Set unit from product if not provided
                        String unit = itemDto.getUnit();
                        if (unit == null || unit.trim().isEmpty()) {
                            unit = product != null ? product.getUom() : null;
                        }

                        // Ensure deliveryDate is not null
                        LocalDate deliveryDate = itemDto.getDeliveryDate();
                        if (deliveryDate == null) {
                            deliveryDate = LocalDate.now().plusDays(30); // Default to 30 days from now
                        }

                        PurchaseRequisitionItem item = PurchaseRequisitionItem.builder()
                                .purchaseRequisition(requisition)
                                .product(product)
                                .productName(productName)
                                .requestedQty(itemDto.getRequestedQty())
                                .unit(unit)
                                .deliveryDate(deliveryDate)
                                .note(itemDto.getNote())
                                .createdBy(requester)
                                .updatedBy(requester)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();
                        return item;
                    })
                    .collect(Collectors.toList());
            requisition.setItems(items);
        }

        // Save requisition (cascade will save items)
        PurchaseRequisition saved = requisitionRepository.save(requisition);

        // Fetch lại với relations để có đầy đủ dữ liệu
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Tạo purchase requisition thành công với ID: {} và số: {}", saved.getRequisitionId(), saved.getRequisitionNo());
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    public PurchaseRequisitionResponseDTO getRequisitionById(Long requisitionId) {
        log.info("Lấy purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findByIdWithRelations(requisitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        return requisitionMapper.toResponseDTO(requisition);
    }

    @Override
    public List<PurchaseRequisitionResponseDTO> getAllRequisitions() {
        log.info("Lấy tất cả purchase requisitions");

        List<PurchaseRequisition> requisitions = requisitionRepository.findAllActiveWithRelations();
        return requisitionMapper.toResponseDTOList(requisitions);
    }

    @Override
    public Page<PurchaseRequisitionResponseDTO> getAllRequisitions(Pageable pageable) {
        log.info("Lấy danh sách purchase requisitions với phân trang");

        Page<PurchaseRequisition> requisitions = requisitionRepository.findAllActiveWithRelations(pageable);
        List<PurchaseRequisitionResponseDTO> dtoList = requisitionMapper.toResponseDTOList(requisitions.getContent());

        return new PageImpl<>(dtoList, pageable, requisitions.getTotalElements());
    }

    @Override
    public List<PurchaseRequisitionResponseDTO> searchRequisitions(String keyword) {
        log.info("Tìm kiếm purchase requisitions với keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllRequisitions();
        }

        List<PurchaseRequisition> requisitions = requisitionRepository.searchRequisitionsWithRelations(keyword.trim());
        return requisitionMapper.toResponseDTOList(requisitions);
    }

    @Override
    public Page<PurchaseRequisitionResponseDTO> searchRequisitions(String keyword, Pageable pageable) {
        log.info("Tìm kiếm purchase requisitions với keyword: {} và phân trang", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllRequisitions(pageable);
        }

        Page<PurchaseRequisition> requisitions = requisitionRepository.searchRequisitions(keyword.trim(), pageable);
        List<PurchaseRequisitionResponseDTO> dtoList = requisitionMapper.toResponseDTOList(requisitions.getContent());

        return new PageImpl<>(dtoList, pageable, requisitions.getTotalElements());
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO updateRequisition(Long requisitionId, PurchaseRequisitionRequestDTO dto, Integer updatedById) {
        log.info("Cập nhật purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        // Check if requisition can be updated (only if status is Draft or Pending)
        if (requisition.getStatus() == RequisitionStatus.Approved || 
            requisition.getStatus() == RequisitionStatus.Rejected ||
            requisition.getStatus() == RequisitionStatus.Cancelled) {
            throw new IllegalStateException("Không thể cập nhật requisition khi status là " + requisition.getStatus());
        }

        // Load updatedBy user
        User updatedBy = userRepository.findById(updatedById)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + updatedById));

        // Update basic fields
        if (dto.getRequisitionNo() != null) {
            requisition.setRequisitionNo(dto.getRequisitionNo());
        }
        if (dto.getRequisitionDate() != null) {
            requisition.setRequisitionDate(dto.getRequisitionDate());
        }
        if (dto.getPurpose() != null) {
            requisition.setPurpose(dto.getPurpose());
        }
        if (dto.getStatus() != null) {
            requisition.setStatus(dto.getStatus());
        }
        if (dto.getApproverId() != null) {
            User approver = userRepository.findById(dto.getApproverId()).orElse(null);
            requisition.setApprover(approver);
        }
        if (dto.getApprovedAt() != null) {
            requisition.setApprovedAt(dto.getApprovedAt());
        }

        // Update items - remove old items and add new ones
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            // Remove existing items
            requisition.getItems().clear();

            // Add new items
            List<PurchaseRequisitionItem> newItems = dto.getItems().stream()
                    .map(itemDto -> {
                        // Load Product entity if productId is provided
                        com.g174.mmssystem.entity.Product product = null;
                        if (itemDto.getProductId() != null) {
                            product = productRepository.findById(itemDto.getProductId().intValue())
                                    .orElse(null); // Allow null product
                        }

                        // Set product name from product if not provided
                        String productName = itemDto.getProductName();
                        if (productName == null || productName.trim().isEmpty()) {
                            productName = product != null ? product.getName() : null;
                        }

                        // Set unit from product if not provided
                        String unit = itemDto.getUnit();
                        if (unit == null || unit.trim().isEmpty()) {
                            unit = product != null ? product.getUom() : null;
                        }

                        // Ensure deliveryDate is not null
                        LocalDate deliveryDate = itemDto.getDeliveryDate();
                        if (deliveryDate == null) {
                            deliveryDate = LocalDate.now().plusDays(30); // Default to 30 days from now
                        }

                        PurchaseRequisitionItem item = PurchaseRequisitionItem.builder()
                                .purchaseRequisition(requisition)
                                .product(product)
                                .productName(productName)
                                .requestedQty(itemDto.getRequestedQty())
                                .unit(unit)
                                .deliveryDate(deliveryDate)
                                .note(itemDto.getNote())
                                .createdBy(requisition.getCreatedBy())
                                .updatedBy(updatedBy)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();
                        return item;
                    })
                    .collect(Collectors.toList());
            requisition.setItems(newItems);
        }
        requisition.setUpdatedBy(updatedBy);
        requisition.setUpdatedAt(LocalDateTime.now());
        PurchaseRequisition saved = requisitionRepository.save(requisition);

        // Fetch lại với relations để có đầy đủ dữ liệu
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Cập nhật purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO approveRequisition(Long requisitionId, Integer approverId) {
        log.info("Approve purchase requisition ID: {} bởi approver ID: {}", requisitionId, approverId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        if (requisition.getStatus() == RequisitionStatus.Approved) {
            throw new IllegalStateException("Requisition đã được approve rồi");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy approver với ID: " + approverId));

        requisition.setStatus(RequisitionStatus.Approved);
        requisition.setApprover(approver);
        requisition.setApprovedAt(LocalDateTime.now());
        requisition.setUpdatedBy(approver);
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);

        // Fetch lại với relations để có đầy đủ dữ liệu
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Approve purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO rejectRequisition(Long requisitionId, Integer approverId, String reason) {
        log.info("Reject purchase requisition ID: {} bởi approver ID: {} với lý do: {}", requisitionId, approverId, reason);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        if (requisition.getStatus() == RequisitionStatus.Rejected) {
            throw new IllegalStateException("Requisition đã bị reject rồi");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy approver với ID: " + approverId));

        requisition.setStatus(RequisitionStatus.Rejected);
        requisition.setApprover(approver);
        requisition.setApprovedAt(LocalDateTime.now());
        requisition.setUpdatedBy(approver);
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);

        // Fetch lại với relations để có đầy đủ dữ liệu
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Reject purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO closeRequisition(Long requisitionId) {
        log.info("Đóng purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        // For simplified schema, we can use Cancelled status instead of Closed
        if (requisition.getStatus() == RequisitionStatus.Cancelled) {
            throw new IllegalStateException("Requisition đã được đóng rồi");
        }

        requisition.setStatus(RequisitionStatus.Cancelled);
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);

        // Fetch lại với relations để có đầy đủ dữ liệu
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Đóng purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO restoreRequisition(Long requisitionId) {
        log.info("Khôi phục purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        if (requisition.getDeletedAt() == null) {
            throw new IllegalStateException("Requisition chưa bị xóa");
        }

        requisition.setDeletedAt(null);
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);

        // Fetch lại với relations để có đầy đủ dữ liệu
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Khôi phục purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO deleteRequisition(Long requisitionId) {
        log.info("Xóa purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        // Fetch với relations trước khi soft delete để có đầy đủ dữ liệu
        PurchaseRequisition requisitionWithRelations = requisitionRepository.findByIdWithRelations(requisitionId)
                .orElse(requisition);

        // Soft delete
        requisitionWithRelations.setDeletedAt(LocalDateTime.now());
        requisitionWithRelations.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisitionWithRelations);

        log.info("Xóa purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(saved);
    }

    @Override
    public boolean existsByRequisitionNo(String requisitionNo) {
        return requisitionRepository.existsByRequisitionNo(requisitionNo);
    }

    @Override
    public String generateRequisitionNo() {
        String year = String.valueOf(LocalDate.now().getYear());
        String prefix = "PR-" + year + "-";

        // Find the latest requisition number for this year
        Optional<PurchaseRequisition> latest = requisitionRepository
                .findTopByRequisitionNoStartingWithOrderByRequisitionNoDesc(prefix);

        int sequence = 1;
        if (latest.isPresent()) {
            String latestNo = latest.get().getRequisitionNo();
            // Extract sequence number from format PR-YYYY-XXX
            try {
                String sequencePart = latestNo.substring(prefix.length());
                sequence = Integer.parseInt(sequencePart) + 1;
            } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
                log.warn("Không thể parse sequence từ requisition number: {}, sử dụng sequence = 1", latestNo);
                sequence = 1;
            }
        }

        // Format with leading zeros (e.g., 001, 002, ... 999)
        String sequenceStr = String.format("%03d", sequence);
        String requisitionNo = prefix + sequenceStr;

        // Ensure uniqueness
        int maxAttempts = 100;
        int attempts = 0;
        while (existsByRequisitionNo(requisitionNo) && attempts < maxAttempts) {
            sequence++;
            sequenceStr = String.format("%03d", sequence);
            requisitionNo = prefix + sequenceStr;
            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new IllegalStateException("Không thể tạo requisition number duy nhất sau " + maxAttempts + " lần thử");
        }

        return requisitionNo;
    }
}

