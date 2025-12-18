package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.GoodIssueRequestDTO;
import com.g174.mmssystem.dto.responseDTO.GoodIssueResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.GoodIssueMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IGoodIssueService;
import com.g174.mmssystem.service.IService.IWarehouseStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GoodIssueServiceImpl implements IGoodIssueService {

    private final GoodIssueRepository issueRepository;
    private final GoodIssueItemRepository goodIssueItemRepository;
    private final DeliveryRepository deliveryRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final GoodIssueMapper issueMapper;
    private final IWarehouseStockService warehouseStockService;

    @Override
    @Transactional
    public GoodIssueResponseDTO createIssue(GoodIssueRequestDTO dto, Integer createdById) {
        log.info("Creating good issue for Delivery ID: {}", dto.getDeliveryId());

        // Validate and load entities
        Delivery delivery = deliveryRepository.findById(dto.getDeliveryId())
                .filter(d -> d.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + dto.getDeliveryId()));

        // Validate delivery status - must be Picked (đã được Sales submit cho kho)
        if (delivery.getStatus() != Delivery.DeliveryStatus.Picked) {
            throw new IllegalStateException("Chỉ có thể tạo phiếu xuất kho khi phiếu giao hàng đã được submit cho kho (trạng thái: Đang chuẩn bị hàng)");
        }

        // Check if Delivery already has an approved Good Issue
        List<GoodIssue> existingIssues = issueRepository.findByDeliveryId(delivery.getDeliveryId());
        boolean hasApprovedIssue = existingIssues.stream()
                .anyMatch(issue -> issue.getStatus() == GoodIssue.GoodIssueStatus.Approved
                        && issue.getDeletedAt() == null);
        if (hasApprovedIssue) {
            throw new IllegalStateException("Delivery already has an approved Good Issue. Cannot create another one.");
        }

        // warehouseId ở header không còn bắt buộc, nhưng có thể dùng làm giá trị mặc định
        Warehouse warehouse = null;
        if (dto.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(dto.getWarehouseId())
                    .orElse(null); // Không throw exception, chỉ log warning
            if (warehouse == null) {
                log.warn("Warehouse ID {} not found, will use warehouse from items", dto.getWarehouseId());
            }
        }

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdById));

        // Generate issue number if not provided
        String issueNo = dto.getIssueNo();
        if (issueNo == null || issueNo.trim().isEmpty()) {
            issueNo = generateIssueNo();
        } else if (issueRepository.existsByIssueNo(issueNo)) {
            throw new DuplicateResourceException("Good Issue number already exists: " + issueNo);
        }

        // Create issue entity
        GoodIssue issue = GoodIssue.builder()
                .issueNo(issueNo)
                .delivery(delivery)
                .warehouse(warehouse)
                .issueDate(dto.getIssueDate() != null ? dto.getIssueDate().toLocalDateTime() : LocalDateTime.now())
                .status(GoodIssue.GoodIssueStatus.Draft)
                .createdBy(createdBy)
                .notes(dto.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .items(new ArrayList<>()) // Khởi tạo items để tránh null
                .build();

        // Validate and create items
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("Good Issue must have at least one item");
        }

        List<GoodIssueItem> items = dto.getItems().stream()
                .map(itemDto -> {
                    DeliveryItem di = deliveryItemRepository.findById(itemDto.getDiId())
                            .orElseThrow(() -> new ResourceNotFoundException("Delivery Item not found with ID: " + itemDto.getDiId()));

                    // Validate delivery item belongs to the delivery
                    if (!di.getDelivery().getDeliveryId().equals(delivery.getDeliveryId())) {
                        throw new IllegalArgumentException("Delivery Item does not belong to the specified Delivery");
                    }

                    Product product = productRepository.findById(itemDto.getProductId())
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                    // Validate warehouseId cho từng item
                    if (itemDto.getWarehouseId() == null) {
                        throw new IllegalArgumentException(
                                String.format("Warehouse ID is required for product %s", product.getName()));
                    }
                    Warehouse itemWarehouse = warehouseRepository.findById(itemDto.getWarehouseId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    String.format("Warehouse not found with ID: %d for product %s",
                                            itemDto.getWarehouseId(), product.getName())));

                    // Validate issued quantity does not exceed planned quantity
                    if (itemDto.getIssuedQty().compareTo(di.getPlannedQty()) > 0) {
                        throw new IllegalArgumentException(
                                String.format("Issued quantity (%s) cannot exceed planned quantity (%s) for product %s",
                                        itemDto.getIssuedQty(), di.getPlannedQty(), product.getName()));
                    }

                    // Validate stock availability - check theo kho của từng item
                    BigDecimal availableStock = warehouseStockService.getStockByWarehouseAndProduct(
                            itemWarehouse.getWarehouseId(), product.getProductId()).getQuantity();
                    if (availableStock == null || availableStock.compareTo(itemDto.getIssuedQty()) < 0) {
                        throw new IllegalStateException(
                                String.format("Insufficient stock in warehouse %s. Available: %s, Required: %s for product %s",
                                        itemWarehouse.getName(),
                                        availableStock != null ? availableStock : BigDecimal.ZERO,
                                        itemDto.getIssuedQty(), product.getName()));
                    }

                    return GoodIssueItem.builder()
                            .goodIssue(issue)
                            .deliveryItem(di)
                            .product(product)
                            .warehouse(itemWarehouse) // Kho riêng cho từng item
                            .issuedQty(itemDto.getIssuedQty())
                            .remark(itemDto.getRemark())
                            .build();
                })
                .collect(Collectors.toList());

        // Với orphanRemoval = true, dùng addAll() thay vì setItems() để giữ reference của collection
        // Đảm bảo items không null (có thể xảy ra khi entity được load từ DB)
        if (issue.getItems() == null) {
            issue.setItems(new ArrayList<>());
        }
        issue.getItems().clear();
        issue.getItems().addAll(items);

        GoodIssue saved = issueRepository.save(issue);
        GoodIssue savedWithRelations = issueRepository.findByIdWithRelations(saved.getIssueId())
                .orElse(saved);

        log.info("Good issue created successfully with ID: {} and number: {}", saved.getIssueId(), saved.getIssueNo());
        return issueMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public GoodIssueResponseDTO createIssueFromDelivery(Integer deliveryId, GoodIssueRequestDTO dto, Integer createdById) {
        dto.setDeliveryId(deliveryId);
        return createIssue(dto, createdById);
    }

    @Override
    public GoodIssueResponseDTO getIssueById(Integer issueId) {
        log.info("Fetching good issue ID: {}", issueId);

        GoodIssue issue = issueRepository.findByIdWithRelations(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Good Issue not found with ID: " + issueId));

        // Load items separately
        GoodIssue issueWithItems = issueRepository.findByIdWithItems(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Good Issue not found with ID: " + issueId));

        issue.setItems(issueWithItems.getItems());

        return issueMapper.toResponseDTO(issue);
    }

    @Override
    public List<GoodIssueResponseDTO> getAllIssues() {
        log.info("Fetching all good issues");

        List<GoodIssue> issues = issueRepository.findAllActive();
        return issueMapper.toResponseDTOList(issues);
    }

    @Override
    public Page<GoodIssueResponseDTO> getAllIssues(Pageable pageable) {
        log.info("Fetching good issues with pagination");

        Page<GoodIssue> issues = issueRepository.findAllActiveWithRelations(pageable);
        return issues.map(issueMapper::toResponseDTO);
    }

    @Override
    public List<GoodIssueResponseDTO> searchIssues(String keyword) {
        log.info("Searching good issues with keyword: {}", keyword);

        List<GoodIssue> issues = issueRepository.searchIssues(keyword);
        return issueMapper.toResponseDTOList(issues);
    }

    @Override
    public Page<GoodIssueResponseDTO> searchIssues(String keyword, Pageable pageable) {
        log.info("Searching good issues with keyword: {} and pagination", keyword);

        Page<GoodIssue> issues = issueRepository.searchIssues(keyword, pageable);
        return issues.map(issueMapper::toResponseDTO);
    }

    @Override
    public List<GoodIssueResponseDTO> getIssuesByDeliveryId(Integer deliveryId) {
        log.info("Fetching good issues for Delivery ID: {}", deliveryId);

        // Use query with JOIN FETCH to avoid N+1 problem
        List<GoodIssue> issues = issueRepository.findByDeliveryIdWithRelations(deliveryId);
        return issueMapper.toResponseDTOList(issues);
    }

    @Override
    public List<GoodIssueResponseDTO> getIssuesByWarehouseId(Integer warehouseId) {
        log.info("Fetching good issues for Warehouse ID: {}", warehouseId);

        List<GoodIssue> issues = issueRepository.findByWarehouseId(warehouseId);
        return issueMapper.toResponseDTOList(issues);
    }

    @Override
    @Transactional
    public GoodIssueResponseDTO updateIssue(Integer issueId, GoodIssueRequestDTO dto, Integer updatedById) {
        log.info("Updating good issue ID: {}", issueId);

        GoodIssue issue = issueRepository.findById(issueId)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Good Issue not found with ID: " + issueId));

        // Check: Chỉ cho phép sửa khi Draft, hoặc Manager có thể sửa khi Approved
        if (issue.getStatus() == GoodIssue.GoodIssueStatus.Approved) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isManager = authentication != null &&
                    authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

            if (!isManager) {
                throw new IllegalStateException("Không thể chỉnh sửa phiếu xuất kho đã được phê duyệt. Chỉ Manager mới có quyền sửa.");
            }

            User currentUser = userRepository.findById(updatedById)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + updatedById));
            log.warn("Manager {} đang chỉnh sửa phiếu xuất kho đã được phê duyệt: {}",
                    currentUser.getEmail(), issue.getIssueNo());
        } else if (issue.getStatus() != GoodIssue.GoodIssueStatus.Draft && issue.getStatus() != GoodIssue.GoodIssueStatus.Approved) {
            throw new IllegalStateException("Chỉ có thể chỉnh sửa phiếu xuất kho ở trạng thái Nháp hoặc Đã duyệt (Manager)");
        }

        // Update basic fields
        if (dto.getNotes() != null) {
            issue.setNotes(dto.getNotes());
        }
        if (dto.getIssueDate() != null) {
            issue.setIssueDate(dto.getIssueDate().toLocalDateTime());
        }

        // Update items if provided
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            // Với orphanRemoval = true, phải dùng clear() và addAll() thay vì setItems()
            // Đảm bảo items không null (có thể xảy ra khi entity được load từ DB)
            if (issue.getItems() == null) {
                issue.setItems(new ArrayList<>());
            }
            issue.getItems().clear();
            List<GoodIssueItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        DeliveryItem di = deliveryItemRepository.findById(itemDto.getDiId())
                                .orElseThrow(() -> new ResourceNotFoundException("Delivery Item not found with ID: " + itemDto.getDiId()));

                        Product product = productRepository.findById(itemDto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                        // Validate warehouseId cho từng item
                        if (itemDto.getWarehouseId() == null) {
                            throw new IllegalArgumentException(
                                    String.format("Warehouse ID is required for product %s", product.getName()));
                        }
                        Warehouse itemWarehouse = warehouseRepository.findById(itemDto.getWarehouseId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                        String.format("Warehouse not found with ID: %d for product %s",
                                                itemDto.getWarehouseId(), product.getName())));

                        // Validate issued quantity
                        if (itemDto.getIssuedQty().compareTo(di.getPlannedQty()) > 0) {
                            throw new IllegalArgumentException(
                                    String.format("Issued quantity (%s) cannot exceed planned quantity (%s) for product %s",
                                            itemDto.getIssuedQty(), di.getPlannedQty(), product.getName()));
                        }

                        // Validate stock availability - check theo kho của từng item
                        BigDecimal availableStock = warehouseStockService.getStockByWarehouseAndProduct(
                                itemWarehouse.getWarehouseId(), product.getProductId()).getQuantity();
                        if (availableStock == null || availableStock.compareTo(itemDto.getIssuedQty()) < 0) {
                            throw new IllegalStateException(
                                    String.format("Insufficient stock in warehouse %s. Available: %s, Required: %s for product %s",
                                            itemWarehouse.getName(),
                                            availableStock != null ? availableStock : BigDecimal.ZERO,
                                            itemDto.getIssuedQty(), product.getName()));
                        }

                        return GoodIssueItem.builder()
                                .goodIssue(issue)
                                .deliveryItem(di)
                                .product(product)
                                .warehouse(itemWarehouse) // Kho riêng cho từng item
                                .issuedQty(itemDto.getIssuedQty())
                                .remark(itemDto.getRemark())
                                .build();
                    })
                    .collect(Collectors.toList());
            // Dùng addAll() thay vì setItems() để giữ reference của collection gốc
            issue.getItems().addAll(items);
        }

        issue.setUpdatedAt(LocalDateTime.now());
        GoodIssue saved = issueRepository.save(issue);
        GoodIssue savedWithRelations = issueRepository.findByIdWithRelations(saved.getIssueId())
                .orElse(saved);

        log.info("Good issue updated successfully");
        return issueMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public GoodIssueResponseDTO submitForApproval(Integer issueId, Integer submittedById) {
        log.info("Submitting good issue ID: {} for approval by user ID: {}", issueId, submittedById);

        GoodIssue issue = issueRepository.findById(issueId)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Good Issue not found with ID: " + issueId));

        // Validate: Chỉ có thể submit khi ở trạng thái Draft
        if (issue.getStatus() != GoodIssue.GoodIssueStatus.Draft) {
            throw new IllegalStateException("Chỉ có thể gửi yêu cầu duyệt khi phiếu xuất kho ở trạng thái Nháp");
        }

        // Validate: Phải có items
        List<GoodIssueItem> items = goodIssueItemRepository.findByIssueId(issueId);
        if (items == null || items.isEmpty()) {
            throw new IllegalStateException("Không thể gửi yêu cầu duyệt: Phiếu xuất kho phải có ít nhất một sản phẩm");
        }

        // Hoàn tất phiếu xuất kho: chuyển sang Approved và trừ tồn kho ngay
        return approveIssueInternal(issueId, submittedById);
    }

    /**
     * Internal method để approve Good Issue và trừ tồn kho
     */
    private GoodIssueResponseDTO approveIssueInternal(Integer issueId, Integer approverId) {
        log.info("Approving good issue ID: {} by approver ID: {}", issueId, approverId);

        // Load issue with items
        GoodIssue issue = issueRepository.findByIdWithItems(issueId)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Good Issue not found with ID: " + issueId));

        // Chỉ có thể approve khi đang ở Draft
        if (issue.getStatus() != GoodIssue.GoodIssueStatus.Draft) {
            throw new IllegalStateException("Chỉ có thể hoàn tất phiếu xuất kho ở trạng thái Nháp");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverId));

        issue.setStatus(GoodIssue.GoodIssueStatus.Approved);
        issue.setApprovedBy(approver);
        issue.setApprovedAt(LocalDateTime.now());
        issue.setUpdatedAt(LocalDateTime.now());

        GoodIssue saved = issueRepository.save(issue);

        // Load items with relations before processing
        GoodIssue savedWithItems = issueRepository.findByIdWithItems(saved.getIssueId())
                .orElseThrow(() -> new IllegalStateException("Failed to load Good Issue items after save"));

        if (savedWithItems.getItems() == null || savedWithItems.getItems().isEmpty()) {
            throw new IllegalStateException("Good Issue has no items to process");
        }

        log.info("Processing {} items for Good Issue ID: {}", savedWithItems.getItems().size(), saved.getIssueId());

        // Update Warehouse Stock: Decrease inventory quantity theo kho của từng item
        for (GoodIssueItem issueItem : savedWithItems.getItems()) {
            Integer productId = issueItem.getProduct() != null ? issueItem.getProduct().getProductId() : null;
            Integer warehouseId = issueItem.getWarehouse() != null ? issueItem.getWarehouse().getWarehouseId() : null;
            BigDecimal issuedQty = issueItem.getIssuedQty();

            if (productId == null) {
                log.error("Good Issue Item {} has null product", issueItem.getGiiId());
                throw new IllegalStateException("Good Issue Item has null product");
            }

            if (warehouseId == null) {
                log.error("Good Issue Item {} has null warehouse", issueItem.getGiiId());
                throw new IllegalStateException("Good Issue Item has null warehouse");
            }

            if (issuedQty == null || issuedQty.compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("Good Issue Item {} has invalid issuedQty: {}", issueItem.getGiiId(), issuedQty);
                continue; // Skip items with zero or negative quantity
            }

            log.info("Processing stock decrease for product {} in warehouse {} with issuedQty {}", productId, warehouseId, issuedQty);

            // Decrease stock theo kho của từng item
            try {
                warehouseStockService.decreaseStock(warehouseId, productId, issuedQty);
                log.info("Decreased stock: warehouse {} product {} -{}", warehouseId, productId, issuedQty);
            } catch (Exception e) {
                log.error("Error decreasing stock for product {} in warehouse {}: {}", productId, warehouseId, e.getMessage());
                throw new IllegalStateException(
                        String.format("Failed to decrease stock for product %d in warehouse %d: %s",
                                productId, warehouseId, e.getMessage()));
            }
        }

        log.info("Good issue approved successfully, warehouse stock updated");

        // Tự động cập nhật Delivery status sang Shipped nếu đang ở Picked
        Delivery delivery = saved.getDelivery();
        if (delivery != null && delivery.getStatus() == Delivery.DeliveryStatus.Picked) {
            delivery.setStatus(Delivery.DeliveryStatus.Shipped);
            delivery.setUpdatedAt(Instant.now());
            deliveryRepository.save(delivery);
            log.info("Delivery ID: {} automatically updated to Shipped status after Good Issue approval",
                    delivery.getDeliveryId());
        }

        // Load full relations for response
        GoodIssue savedWithRelations = issueRepository.findByIdWithRelations(saved.getIssueId())
                .orElse(saved);
        savedWithRelations.setItems(savedWithItems.getItems());

        return issueMapper.toResponseDTO(savedWithRelations);
    }


    @Override
    @Transactional
    public GoodIssueResponseDTO deleteIssue(Integer issueId) {
        log.info("Deleting good issue ID: {}", issueId);

        GoodIssue issue = issueRepository.findById(issueId)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Good Issue not found with ID: " + issueId));

        // Validate: Chỉ cho phép xóa khi Draft, hoặc Manager có thể xóa khi Approved
        if (issue.getStatus() == GoodIssue.GoodIssueStatus.Approved) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isManager = authentication != null &&
                    authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

            if (!isManager) {
                throw new IllegalStateException("Không thể xóa phiếu xuất kho đã được phê duyệt. Chỉ Manager mới có quyền xóa.");
            }

            User currentUser = userRepository.findByEmail(
                            SecurityContextHolder.getContext().getAuthentication().getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            log.warn("Manager {} đang xóa phiếu xuất kho đã được phê duyệt: {}",
                    currentUser.getEmail(), issue.getIssueNo());
        } else if (issue.getStatus() != GoodIssue.GoodIssueStatus.Draft && issue.getStatus() != GoodIssue.GoodIssueStatus.Approved) {
            throw new IllegalStateException("Chỉ có thể xóa phiếu xuất kho ở trạng thái Nháp hoặc Đã duyệt (Manager)");
        }

        issue.setDeletedAt(LocalDateTime.now());
        GoodIssue saved = issueRepository.save(issue);

        log.info("Good issue deleted successfully");
        return issueMapper.toResponseDTO(saved);
    }

    @Override
    public boolean existsByIssueNo(String issueNo) {
        return issueRepository.existsByIssueNo(issueNo);
    }

    @Override
    public String generateIssueNo() {
        String prefix = "GI" + java.time.Year.now().getValue();
        java.util.Optional<GoodIssue> lastIssue = issueRepository.findTopByIssueNoStartingWithOrderByIssueNoDesc(prefix);

        int nextNumber = 1;
        if (lastIssue.isPresent()) {
            String lastNo = lastIssue.get().getIssueNo();
            try {
                String numberPart = lastNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Could not parse number from Issue number: {}", lastNo);
            }
        }

        // Kiểm tra và tìm số tiếp theo nếu bị trùng
        String issueNo;
        int maxAttempts = 100;
        int attempts = 0;

        do {
            issueNo = String.format("%s%04d", prefix, nextNumber);
            if (!issueRepository.existsByIssueNo(issueNo)) {
                break;
            }
            nextNumber++;
            attempts++;

            if (attempts >= maxAttempts) {
                log.error("Could not generate unique Issue number after {} attempts", maxAttempts);
                throw new RuntimeException("Không thể tạo mã phiếu xuất kho duy nhất. Vui lòng thử lại sau.");
            }
        } while (true);

        return issueNo;
    }
}