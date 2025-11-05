package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.entity.PurchaseRequisition;
import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.Warehouse;
import com.g174.mmssystem.enums.ApprovalStatus;
import com.g174.mmssystem.enums.RequisitionStatus;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.PurchaseRequisitionMapper;
import com.g174.mmssystem.repository.PurchaseRequisitionRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.repository.WarehouseRepository;
import com.g174.mmssystem.service.IService.IPurchaseRequisitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final WarehouseRepository warehouseRepository;

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO createRequisition(PurchaseRequisitionRequestDTO dto, Integer requesterId) {
        log.info("Tạo purchase requisition mới cho requester ID: {}", requesterId);

        // Validate requester
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + requesterId));

        // Validate warehouse
        Warehouse destinationWarehouse = warehouseRepository.findById(dto.getDestinationWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy warehouse với ID: " + dto.getDestinationWarehouseId()));

        // Generate requisition number
        String requisitionNo = generateRequisitionNo();

        // Create requisition entity
        PurchaseRequisition requisition = PurchaseRequisition.builder()
                .requisitionNo(requisitionNo)
                .plantId(dto.getPlanId())
                .requester(requester)
                .department(dto.getDepartment())
                .costCenter(dto.getCostCenter())
                .neededBy(dto.getNeededBy())
                .destinationWarehouse(destinationWarehouse)
                .purpose(dto.getPurpose())
                .approvalStatus(dto.getApprovalStatus() != null ? dto.getApprovalStatus() : ApprovalStatus.Pending)
                .approver(dto.getApproverId() != null ? userRepository.findById(dto.getApproverId()).orElse(null) : null)
                .totalEstimated(BigDecimal.ZERO)
                .status(dto.getStatus() != null ? dto.getStatus() : RequisitionStatus.Open)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Calculate total estimated from items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            BigDecimal total = dto.getItems().stream()
                    .filter(item -> item.getRequestedQty() != null && item.getTargetUnitPrice() != null)
                    .map(item -> item.getRequestedQty().multiply(item.getTargetUnitPrice()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            requisition.setTotalEstimated(total);

            // Create and save items
            List<PurchaseRequisitionItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        PurchaseRequisitionItem item = PurchaseRequisitionItem.builder()
                                .purchaseRequisition(requisition)
                                .planItemId(itemDto.getPlanItemId())
                                .productId(itemDto.getProductId())
                                .productCode(itemDto.getProductCode())
                                .productName(itemDto.getProductName())
                                .spec(itemDto.getSpec())
                                .uom(itemDto.getUom())
                                .requestedQty(itemDto.getRequestedQty())
                                .targetUnitPrice(itemDto.getTargetUnitPrice())
                                .suggestedVendorId(itemDto.getSuggestedVendorId())
                                .note(itemDto.getNote())
                                .build();
                        return item;
                    })
                    .collect(Collectors.toList());
            requisition.setItems(items);
        }

        // Save requisition (cascade will save items)
        PurchaseRequisition saved = requisitionRepository.save(requisition);

        log.info("Tạo purchase requisition thành công với ID: {} và số: {}", saved.getRequisitionId(), saved.getRequisitionNo());
        return requisitionMapper.toResponseDTO(saved);
    }

    @Override
    public PurchaseRequisitionResponseDTO getRequisitionById(Long requisitionId) {
        log.info("Lấy purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        return requisitionMapper.toResponseDTO(requisition);
    }

    @Override
    public List<PurchaseRequisitionResponseDTO> getAllRequisitions() {
        log.info("Lấy tất cả purchase requisitions");

        List<PurchaseRequisition> requisitions = requisitionRepository.findAllActive();
        return requisitionMapper.toResponseDTOList(requisitions);
    }

    @Override
    public Page<PurchaseRequisitionResponseDTO> getAllRequisitions(Pageable pageable) {
        log.info("Lấy danh sách purchase requisitions với phân trang");

        Page<PurchaseRequisition> requisitions = requisitionRepository.findAllActive(pageable);
        List<PurchaseRequisitionResponseDTO> dtoList = requisitionMapper.toResponseDTOList(requisitions.getContent());

        return new PageImpl<>(dtoList, pageable, requisitions.getTotalElements());
    }

    @Override
    public List<PurchaseRequisitionResponseDTO> searchRequisitions(String keyword) {
        log.info("Tìm kiếm purchase requisitions với keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllRequisitions();
        }

        List<PurchaseRequisition> requisitions = requisitionRepository.searchRequisitions(keyword.trim());
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

        // Check if requisition can be updated (only if status is Open and not approved)
        if (requisition.getStatus() != RequisitionStatus.Open) {
            throw new IllegalStateException("Chỉ có thể cập nhật requisition khi status là Open");
        }
        if (requisition.getApprovalStatus() == ApprovalStatus.Approved) {
            throw new IllegalStateException("Không thể cập nhật requisition đã được approve");
        }

        // Validate warehouse if changed
        Warehouse destinationWarehouse = null;
        if (dto.getDestinationWarehouseId() != null) {
            destinationWarehouse = warehouseRepository.findById(dto.getDestinationWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy warehouse với ID: " + dto.getDestinationWarehouseId()));
        } else {
            destinationWarehouse = requisition.getDestinationWarehouse();
        }

        // Update basic fields
        if (dto.getPlanId() != null) {
            requisition.setPlantId(dto.getPlanId());
        }
        if (dto.getDepartment() != null) {
            requisition.setDepartment(dto.getDepartment());
        }
        if (dto.getCostCenter() != null) {
            requisition.setCostCenter(dto.getCostCenter());
        }
        if (dto.getNeededBy() != null) {
            requisition.setNeededBy(dto.getNeededBy());
        }
        if (destinationWarehouse != null) {
            requisition.setDestinationWarehouse(destinationWarehouse);
        }
        if (dto.getPurpose() != null) {
            requisition.setPurpose(dto.getPurpose());
        }
        if (dto.getApprovalStatus() != null) {
            requisition.setApprovalStatus(dto.getApprovalStatus());
        }
        if (dto.getStatus() != null) {
            requisition.setStatus(dto.getStatus());
        }

        // Update items - remove old items and add new ones
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            // Remove existing items
            requisition.getItems().clear();

            // Add new items
            List<PurchaseRequisitionItem> newItems = dto.getItems().stream()
                    .map(itemDto -> {
                        PurchaseRequisitionItem item = PurchaseRequisitionItem.builder()
                                .purchaseRequisition(requisition)
                                .planItemId(itemDto.getPlanItemId())
                                .productId(itemDto.getProductId())
                                .productCode(itemDto.getProductCode())
                                .productName(itemDto.getProductName())
                                .spec(itemDto.getSpec())
                                .uom(itemDto.getUom())
                                .requestedQty(itemDto.getRequestedQty())
                                .targetUnitPrice(itemDto.getTargetUnitPrice())
                                .suggestedVendorId(itemDto.getSuggestedVendorId())
                                .note(itemDto.getNote())
                                .build();
                        return item;
                    })
                    .collect(Collectors.toList());
            requisition.setItems(newItems);

            // Recalculate total
            BigDecimal total = newItems.stream()
                    .filter(item -> item.getRequestedQty() != null && item.getTargetUnitPrice() != null)
                    .map(item -> item.getRequestedQty().multiply(item.getTargetUnitPrice()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            requisition.setTotalEstimated(total);
        }

        requisition.setUpdatedAt(LocalDateTime.now());
        PurchaseRequisition saved = requisitionRepository.save(requisition);

        log.info("Cập nhật purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO approveRequisition(Long requisitionId, Integer approverId) {
        log.info("Approve purchase requisition ID: {} bởi approver ID: {}", requisitionId, approverId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        if (requisition.getApprovalStatus() == ApprovalStatus.Approved) {
            throw new IllegalStateException("Requisition đã được approve rồi");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy approver với ID: " + approverId));

        requisition.setApprovalStatus(ApprovalStatus.Approved);
        requisition.setApprover(approver);
        requisition.setApprovedAt(LocalDateTime.now());
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);

        log.info("Approve purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO rejectRequisition(Long requisitionId, Integer approverId, String reason) {
        log.info("Reject purchase requisition ID: {} bởi approver ID: {} với lý do: {}", requisitionId, approverId, reason);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        if (requisition.getApprovalStatus() == ApprovalStatus.Rejected) {
            throw new IllegalStateException("Requisition đã bị reject rồi");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy approver với ID: " + approverId));

        requisition.setApprovalStatus(ApprovalStatus.Rejected);
        requisition.setApprover(approver);
        requisition.setApprovedAt(LocalDateTime.now());
        requisition.setUpdatedAt(LocalDateTime.now());
        // Add reason to note or purpose if needed
        if (reason != null && !reason.trim().isEmpty()) {
            String currentPurpose = requisition.getPurpose() != null ? requisition.getPurpose() : "";
            requisition.setPurpose(currentPurpose + " [REJECTED: " + reason + "]");
        }

        PurchaseRequisition saved = requisitionRepository.save(requisition);

        log.info("Reject purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO closeRequisition(Long requisitionId) {
        log.info("Đóng purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        if (requisition.getStatus() == RequisitionStatus.Closed) {
            throw new IllegalStateException("Requisition đã được đóng rồi");
        }

        requisition.setStatus(RequisitionStatus.Closed);
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);

        log.info("Đóng purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(saved);
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

        log.info("Khôi phục purchase requisition thành công ID: {}", saved.getRequisitionId());
        return requisitionMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO deleteRequisition(Long requisitionId) {
        log.info("Xóa purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy purchase requisition với ID: " + requisitionId));

        // Soft delete
        requisition.setDeletedAt(LocalDateTime.now());
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);

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

