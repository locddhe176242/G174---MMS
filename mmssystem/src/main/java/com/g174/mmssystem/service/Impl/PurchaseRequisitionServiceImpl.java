package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import com.g174.mmssystem.enums.RequisitionStatus;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.PurchaseRequisitionMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IPermissionService;
import com.g174.mmssystem.service.IService.IPurchaseRequisitionService;
import com.g174.mmssystem.service.IService.IUserContextService;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PurchaseRequisitionServiceImpl implements IPurchaseRequisitionService {

    private final PurchaseRequisitionRepository requisitionRepository;
    // private final PurchaseRequisitionItemRepository requisitionItemRepository;
    private final PurchaseRequisitionMapper requisitionMapper;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final RFQRepository rfqRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseQuotationRepository purchaseQuotationRepository;
    private final IPermissionService permissionService;
    private final IUserContextService userContextService;

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO createRequisition(PurchaseRequisitionRequestDTO dto, Integer requesterId) {
        log.info("Creating purchase requisition for Requester ID: {}", requesterId);

        // Load requester
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + requesterId));

        // Validate based on status: if not DRAFT, must validate items and purpose
        RequisitionStatus status = dto.getStatus() != null ? dto.getStatus() : RequisitionStatus.Draft;
        if (status != RequisitionStatus.Draft) {
            // Validate purpose
            if (dto.getPurpose() == null || dto.getPurpose().trim().isEmpty()) {
                throw new IllegalArgumentException("Mục đích sử dụng là bắt buộc khi status không phải Draft");
            }
            // Validate items
            if (dto.getItems() == null || dto.getItems().isEmpty()) {
                throw new IllegalArgumentException("Danh sách sản phẩm không được để trống khi status không phải Draft");
            }
            // Validate each item
            for (var item : dto.getItems()) {
                if (item.getRequestedQty() == null || item.getRequestedQty().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Số lượng yêu cầu phải lớn hơn 0");
                }
                if (item.getDeliveryDate() == null) {
                    throw new IllegalArgumentException("Ngày giao hàng là bắt buộc");
                }
            }
        }

        // Generate requisition number if not provided
        String requisitionNo = dto.getRequisitionNo();
        if (requisitionNo == null || requisitionNo.trim().isEmpty()) {
            requisitionNo = generateRequisitionNo();
        } else if (requisitionRepository.existsByRequisitionNo(requisitionNo)) {
            throw new DuplicateResourceException("Purchase Requisition number already exists: " + requisitionNo);
        }

        // Set default purpose if null for Draft
        String purpose = dto.getPurpose();
        if (purpose == null && status == RequisitionStatus.Draft) {
            purpose = "";
        }

        // Load approver if provided
        User approver = null;
        if (dto.getApproverId() != null) {
            approver = userRepository.findById(dto.getApproverId()).orElse(null);
        }

        // Create requisition entity
        PurchaseRequisition requisition = PurchaseRequisition.builder()
                .requisitionNo(requisitionNo)
                .requisitionDate(dto.getRequisitionDate() != null ? dto.getRequisitionDate() : LocalDate.now())
                .requester(requester)
                .purpose(purpose)
                .status(status)
                .approver(approver)
                .approvedAt(dto.getApprovedAt())
                .createdBy(requester)
                .updatedBy(requester)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create items (có thể empty nếu status = Draft)
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<PurchaseRequisitionItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        // Load Product entity if productId is provided
                        Product product = null;
                        if (itemDto.getProductId() != null) {
                            product = productRepository.findById(itemDto.getProductId().intValue())
                                    .orElse(null);
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

                        // Ensure requestedQty is not null (default nếu null)
                        BigDecimal requestedQty = itemDto.getRequestedQty();
                        if (requestedQty == null) {
                            requestedQty = BigDecimal.ONE; // Default to 1
                        }

                        // Ensure deliveryDate is not null (default nếu null)
                        LocalDate deliveryDate = itemDto.getDeliveryDate();
                        if (deliveryDate == null) {
                            deliveryDate = LocalDate.now().plusDays(30); // Default to 30 days from now
                        }

                        PurchaseRequisitionItem item = PurchaseRequisitionItem.builder()
                                .purchaseRequisition(requisition)
                                .product(product)
                                .productName(productName)
                                .requestedQty(requestedQty)
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

        PurchaseRequisition saved = requisitionRepository.save(requisition);
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Purchase requisition created successfully with ID: {} and number: {}", saved.getRequisitionId(), saved.getRequisitionNo());
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    public PurchaseRequisitionResponseDTO getRequisitionById(Long requisitionId) {
        log.info("Fetching purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findByIdWithRelations(requisitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + requisitionId));

        return requisitionMapper.toResponseDTO(requisition);
    }

    @Override
    public List<PurchaseRequisitionResponseDTO> getAllRequisitions() {
        throw new UnsupportedOperationException("getAllRequisitions() without pagination is not supported. Please use getAllRequisitions(Pageable) instead.");
    }

    @Override
    public Page<PurchaseRequisitionResponseDTO> getAllRequisitions(Pageable pageable) {
        log.info("Fetching purchase requisitions with pagination");

        // Fetch page without relations first
        Page<PurchaseRequisition> requisitions = requisitionRepository.findAllActive(pageable);

        // Fetch each requisition with relations to avoid N+1
        List<PurchaseRequisition> requisitionsWithRelations = requisitions.getContent().stream()
                .map(r -> requisitionRepository.findByIdWithRelations(r.getRequisitionId()).orElse(r))
                .collect(Collectors.toList());

        List<PurchaseRequisitionResponseDTO> dtoList = requisitionMapper.toResponseDTOList(requisitionsWithRelations);

        return new PageImpl<>(dtoList, pageable, requisitions.getTotalElements());
    }

    @Override
    public Page<PurchaseRequisitionResponseDTO> getAllRequisitionsByStatus(RequisitionStatus status, Pageable pageable) {
        log.info("Fetching purchase requisitions with status: {} and pagination", status);

        // Fetch page without relations first
        Page<PurchaseRequisition> requisitions = requisitionRepository.findAllActiveByStatus(status, pageable);

        // Fetch each requisition with relations to avoid N+1
        List<PurchaseRequisition> requisitionsWithRelations = requisitions.getContent().stream()
                .map(r -> requisitionRepository.findByIdWithRelations(r.getRequisitionId()).orElse(r))
                .collect(Collectors.toList());

        List<PurchaseRequisitionResponseDTO> dtoList = requisitionMapper.toResponseDTOList(requisitionsWithRelations);

        return new PageImpl<>(dtoList, pageable, requisitions.getTotalElements());
    }

    @Override
    public List<PurchaseRequisitionResponseDTO> searchRequisitions(String keyword) {
        throw new UnsupportedOperationException("searchRequisitions() without pagination is not supported. Please use searchRequisitions(String, Pageable) instead.");
    }

    @Override
    public Page<PurchaseRequisitionResponseDTO> searchRequisitions(String keyword, Pageable pageable) {
        log.info("Searching purchase requisitions with keyword: {} and pagination", keyword);

        // Fetch page without relations first
        Page<PurchaseRequisition> requisitions = requisitionRepository.searchRequisitions(keyword, pageable);

        // Fetch each requisition with relations to avoid N+1
        List<PurchaseRequisition> requisitionsWithRelations = requisitions.getContent().stream()
                .map(r -> requisitionRepository.findByIdWithRelations(r.getRequisitionId()).orElse(r))
                .collect(Collectors.toList());

        List<PurchaseRequisitionResponseDTO> dtoList = requisitionMapper.toResponseDTOList(requisitionsWithRelations);

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
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + updatedById));

        // Check if user is requester or admin when status is Pending
        if (requisition.getStatus() == RequisitionStatus.Pending) {
            if (!requisition.getRequester().getId().equals(updatedById)) {
                // Cho phép tạm thời, nhưng log warning
                log.warn("User {} đang chỉnh sửa PR {} không phải do họ tạo khi status là Pending", updatedById, requisitionId);
            }
        }

        // Validate based on status: if not DRAFT, must validate items and purpose
        RequisitionStatus newStatus = dto.getStatus() != null ? dto.getStatus() : requisition.getStatus();
        if (newStatus != RequisitionStatus.Draft) {
            // Validate purpose
            String purpose = dto.getPurpose() != null ? dto.getPurpose() : requisition.getPurpose();
            if (purpose == null || purpose.trim().isEmpty()) {
                throw new IllegalArgumentException("Mục đích sử dụng là bắt buộc khi status không phải Draft");
            }
            // Validate items
            List<PurchaseRequisitionItemRequestDTO> items = dto.getItems();
            if (items == null || items.isEmpty()) {
                throw new IllegalArgumentException("Danh sách sản phẩm không được để trống khi status không phải Draft");
            }
            // Validate each item
            for (var item : items) {
                if (item.getRequestedQty() == null || item.getRequestedQty().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Số lượng yêu cầu phải lớn hơn 0");
                }
                if (item.getDeliveryDate() == null) {
                    throw new IllegalArgumentException("Ngày giao hàng là bắt buộc");
                }
            }
        }

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

        // Update items
        // Nếu status = Draft, cho phép items null hoặc empty (giữ nguyên items cũ nếu không có items mới)
        if (dto.getItems() != null) {
            // Với orphanRemoval, cần xóa items cũ trước khi thêm mới
            // Sử dụng removeAll để tránh lỗi orphan deletion
            List<PurchaseRequisitionItem> existingItems = new java.util.ArrayList<>(requisition.getItems());
            for (PurchaseRequisitionItem item : existingItems) {
                requisition.getItems().remove(item);
            }

            // Add new items (có thể empty nếu status = Draft)
            if (!dto.getItems().isEmpty()) {
            List<PurchaseRequisitionItem> newItems = dto.getItems().stream()
                    .map(itemDto -> {
                        // Load Product entity if productId is provided
                            Product product = null;
                        if (itemDto.getProductId() != null) {
                            product = productRepository.findById(itemDto.getProductId().intValue())
                                        .orElse(null);
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

                            // Ensure deliveryDate is not null (default nếu null)
                        LocalDate deliveryDate = itemDto.getDeliveryDate();
                        if (deliveryDate == null) {
                            deliveryDate = LocalDate.now().plusDays(30); // Default to 30 days from now
                        }

                            // Ensure requestedQty is not null (default nếu null)
                            BigDecimal requestedQty = itemDto.getRequestedQty();
                            if (requestedQty == null) {
                                requestedQty = BigDecimal.ONE; // Default to 1
                        }

                        PurchaseRequisitionItem item = PurchaseRequisitionItem.builder()
                                .purchaseRequisition(requisition)
                                .product(product)
                                .productName(productName)
                                    .requestedQty(requestedQty)
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
                // Thêm items mới vào collection hiện tại (không setItems mới)
                requisition.getItems().addAll(newItems);
            }
            // Nếu items empty, collection đã được clear ở trên, không cần làm gì thêm
        }
        // Nếu dto.getItems() == null, giữ nguyên items cũ (không update)

        requisition.setUpdatedBy(updatedBy);
        requisition.setUpdatedAt(LocalDateTime.now());
        PurchaseRequisition saved = requisitionRepository.save(requisition);

        // Fetch lại với relations để có đầy đủ dữ liệu
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Purchase requisition updated successfully");
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO approveRequisition(Long requisitionId, Integer approverId) {
        log.info("Approving purchase requisition ID: {} by approver ID: {}", requisitionId, approverId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + requisitionId));

        if (requisition.getStatus() != RequisitionStatus.Pending) {
            throw new IllegalStateException("Only pending requisitions can be approved");
        }

        // Check permission
        String userEmail = userContextService.getCurrentUserEmail();
        if (userEmail == null) {
            throw new IllegalStateException("Cannot determine current user");
        }
        if (!permissionService.hasPermission(userEmail, "purchase.approve")) {
            throw new IllegalStateException("User does not have permission to approve purchase requisitions");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverId));

        // Check if user has APPROVER role
        boolean hasApproverRole = approver.getUserRoles().stream()
                .anyMatch(ur -> "APPROVER".equalsIgnoreCase(ur.getRole().getRoleName()));
        
        if (!hasApproverRole) {
            log.warn("User {} does not have APPROVER role", approverId);
            // Có thể throw exception hoặc chỉ log warning tùy business logic
            // throw new IllegalStateException("User does not have APPROVER role");
        }

        // Check if user belongs to the correct department for approval
        // Note: Logic này có thể cần điều chỉnh dựa trên business rules cụ thể
        // Ví dụ: chỉ department "Purchase" hoặc "Management" mới được approve
        if (approver.getDepartment() == null) {
            log.warn("User {} does not belong to any department", approverId);
        } else {
            log.info("Approver belongs to department: {}", approver.getDepartment().getDepartmentName());
            // Có thể thêm logic check department cụ thể nếu cần
            // String deptName = approver.getDepartment().getDepartmentName();
            // if (!"Purchase".equalsIgnoreCase(deptName) && !"Management".equalsIgnoreCase(deptName)) {
            //     throw new IllegalStateException("User's department is not authorized to approve purchase requisitions");
            // }
        }

        requisition.setStatus(RequisitionStatus.Approved);
        requisition.setApprover(approver);
        requisition.setApprovedAt(LocalDateTime.now());
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Purchase requisition approved successfully");
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO rejectRequisition(Long requisitionId, Integer approverId, String reason) {
        log.info("Rejecting purchase requisition ID: {} by approver ID: {}", requisitionId, approverId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + requisitionId));

        if (requisition.getStatus() != RequisitionStatus.Pending) {
            throw new IllegalStateException("Only pending requisitions can be rejected");
        }

        // Check permission
        String userEmail = userContextService.getCurrentUserEmail();
        if (userEmail == null) {
            throw new IllegalStateException("Cannot determine current user");
        }
        if (!permissionService.hasPermission(userEmail, "purchase.approve")) {
            throw new IllegalStateException("User does not have permission to reject purchase requisitions");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverId));

        // Check if user has APPROVER role
        boolean hasApproverRole = approver.getUserRoles().stream()
                .anyMatch(ur -> "APPROVER".equalsIgnoreCase(ur.getRole().getRoleName()));
        
        if (!hasApproverRole) {
            log.warn("User {} does not have APPROVER role", approverId);
        }

        // Check if user belongs to the correct department for approval
        if (approver.getDepartment() == null) {
            log.warn("User {} does not belong to any department", approverId);
        } else {
            log.info("Approver belongs to department: {}", approver.getDepartment().getDepartmentName());
        }

        requisition.setStatus(RequisitionStatus.Rejected);
        requisition.setApprover(approver);
        requisition.setApprovedAt(LocalDateTime.now());
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Purchase requisition rejected successfully");
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO submitRequisition(Long requisitionId, Integer requesterId) {
        log.info("Submitting purchase requisition ID: {} by requester ID: {}", requisitionId, requesterId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + requisitionId));

        if (requisition.getStatus() != RequisitionStatus.Draft) {
            throw new IllegalStateException("Only draft requisitions can be submitted");
        }

        // Validate purpose and items before submitting
        if (requisition.getPurpose() == null || requisition.getPurpose().trim().isEmpty()) {
            throw new IllegalArgumentException("Mục đích sử dụng là bắt buộc khi submit");
        }
        if (requisition.getItems() == null || requisition.getItems().isEmpty()) {
            throw new IllegalArgumentException("Danh sách sản phẩm không được để trống khi submit");
        }

        requisition.setStatus(RequisitionStatus.Pending);
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Purchase requisition submitted successfully");
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO closeRequisition(Long requisitionId) {
        log.info("Closing purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + requisitionId));

        // Check if RFQ has been created
        List<RFQ> rfqs = rfqRepository.findByRequisitionId(requisitionId);
        boolean hasRFQ = rfqs != null && !rfqs.isEmpty();

        // Check if PO has been processed (check through RFQ -> PQ -> PO)
        boolean hasPO = false;
        if (hasRFQ && rfqs != null) {
            for (RFQ rfq : rfqs) {
                // Check if RFQ has related Purchase Quotations
                List<PurchaseQuotation> pqs = purchaseQuotationRepository.findByRfqId(rfq.getRfqId());
                if (pqs != null && !pqs.isEmpty()) {
                    // Check if any PQ has related Purchase Orders
                    for (PurchaseQuotation pq : pqs) {
                        List<PurchaseOrder> pos = purchaseOrderRepository.findByPqId(pq.getPqId());
                        if (pos != null && !pos.isEmpty()) {
                            // Check if any PO has been processed (status is Completed or Sent)
                            boolean hasProcessedPO = pos.stream()
                                    .anyMatch(po -> po.getStatus() != null && 
                                            (po.getStatus() == PurchaseOrderStatus.Completed || 
                                             po.getStatus() == PurchaseOrderStatus.Sent));
                            if (hasProcessedPO) {
                                hasPO = true;
                                break;
                            }
                        }
                    }
                }
                if (hasPO) break;
            }
        }

        if (!hasRFQ && !hasPO) {
            throw new IllegalStateException("Không thể đóng purchase requisition: Chưa tạo RFQ hoặc chưa xử lý xong PO");
        }

        requisition.setStatus(RequisitionStatus.Cancelled); // Or create a "Closed" status if needed
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Purchase requisition closed successfully");
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO convertRequisition(Long requisitionId) {
        log.info("Converting purchase requisition ID: {} to RFQ", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + requisitionId));

        // Check current status - must be Approved
        if (requisition.getStatus() != RequisitionStatus.Approved) {
            throw new IllegalStateException("Chỉ có thể chuyển đổi PR với trạng thái Approved");
        }

        requisition.setStatus(RequisitionStatus.Converted);
        requisition.setUpdatedAt(LocalDateTime.now());

        PurchaseRequisition saved = requisitionRepository.save(requisition);
        PurchaseRequisition savedWithRelations = requisitionRepository.findByIdWithRelations(saved.getRequisitionId())
                .orElse(saved);

        log.info("Purchase requisition converted successfully");
        return requisitionMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO restoreRequisition(Long requisitionId) {
        log.info("Restoring purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + requisitionId + " or not deleted"));

        requisition.setDeletedAt(null);
        PurchaseRequisition saved = requisitionRepository.save(requisition);

        log.info("Purchase requisition restored successfully");
        return requisitionMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponseDTO deleteRequisition(Long requisitionId) {
        log.info("Deleting purchase requisition ID: {}", requisitionId);

        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found with ID: " + requisitionId));

        // ERP rule: only Draft PRs can be deleted
        if (requisition.getStatus() != RequisitionStatus.Draft) {
            throw new IllegalStateException("Chỉ có thể xóa purchase requisition khi status là Draft");
        }

        requisition.setDeletedAt(LocalDateTime.now());
        PurchaseRequisition saved = requisitionRepository.save(requisition);

        log.info("Purchase requisition deleted successfully");
        return requisitionMapper.toResponseDTO(saved);
    }

    @Override
    public boolean existsByRequisitionNo(String requisitionNo) {
        return requisitionRepository.existsByRequisitionNo(requisitionNo);
    }

    @Override
    public String generateRequisitionNo() {
        String prefix = "PR" + java.time.Year.now().getValue();
        java.util.Optional<PurchaseRequisition> lastRequisition = requisitionRepository.findTopByRequisitionNoStartingWithOrderByRequisitionNoDesc(prefix);

        int nextNumber = 1;
        if (lastRequisition.isPresent()) {
            String lastNo = lastRequisition.get().getRequisitionNo();
            try {
                String numberPart = lastNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Could not parse number from Requisition number: {}", lastNo);
            }
        }

        // Kiểm tra và tìm số tiếp theo nếu bị trùng
        String requisitionNo;
        int maxAttempts = 100;
        int attempts = 0;
        
        do {
            requisitionNo = String.format("%s%04d", prefix, nextNumber);
            if (!requisitionRepository.existsByRequisitionNo(requisitionNo)) {
                break;
            }
            nextNumber++;
            attempts++;

        if (attempts >= maxAttempts) {
                log.error("Could not generate unique Requisition number after {} attempts", maxAttempts);
                throw new RuntimeException("Không thể tạo mã phiếu yêu cầu duy nhất. Vui lòng thử lại sau.");
        }
        } while (true);

        return requisitionNo;
    }
}

