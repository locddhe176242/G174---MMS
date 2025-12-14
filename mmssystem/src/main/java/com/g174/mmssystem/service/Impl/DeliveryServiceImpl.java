package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.DeliveryItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.DeliveryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.DeliveryMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IDeliveryService;
import com.g174.mmssystem.specification.DeliverySpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DeliveryServiceImpl implements IDeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final DeliveryMapper deliveryMapper;
    private final GoodIssueRepository goodIssueRepository;
    private final GoodIssueItemRepository goodIssueItemRepository;

    @Override
    public DeliveryResponseDTO createDelivery(DeliveryRequestDTO request) {
        log.info("[CREATE DELIVERY] Bắt đầu tạo Delivery mới cho Sales Order ID: {}", request.getSalesOrderId());

        SalesOrder salesOrder = getSalesOrder(request.getSalesOrderId());
        validateSalesOrderForDelivery(salesOrder);

        Warehouse warehouse = getWarehouse(request.getWarehouseId());
        User currentUser = getCurrentUser();

        validateDates(request.getPlannedDate(), request.getActualDate());

        // ===== BƯỚC 1: VALIDATE TRƯỚC - KHÔNG TẠO ENTITY =====
        // Chỉ validate logic, không tạo bất kỳ entity nào để tránh Hibernate auto-flush
        log.info("[CREATE DELIVERY] Bắt đầu validate request...");
        validateDeliveryRequest(request.getItems(), salesOrder, warehouse);
        log.info("[CREATE DELIVERY] Validation thành công, bắt đầu tạo entity...");

        // ===== BƯỚC 2: SAU KHI VALIDATE OK, TẠO ENTITY =====
        Delivery delivery = deliveryMapper.toEntity(request, salesOrder, warehouse, currentUser);
        String deliveryNo = generateDeliveryNo();
        delivery.setDeliveryNo(deliveryNo);
        delivery.setStatus(Delivery.DeliveryStatus.Draft);
        log.info("[CREATE DELIVERY] Đã tạo Delivery entity với deliveryNo: {}", deliveryNo);

        // ===== BƯỚC 3: BUILD ITEMS (KHÔNG VALIDATION) =====
        List<DeliveryItem> items = buildItemsWithoutValidation(delivery, request.getItems(), salesOrder);
        delivery.getItems().clear();
        delivery.getItems().addAll(items);
        log.info("[CREATE DELIVERY] Đã build {} items, bắt đầu save...", items.size());

        Delivery saved = deliveryRepository.save(delivery);
        log.info("[CREATE DELIVERY] Đã save Delivery thành công với ID: {}, deliveryNo: {}", saved.getDeliveryId(), saved.getDeliveryNo());
        return deliveryMapper.toResponse(saved, items);
    }

    @Override
    public DeliveryResponseDTO updateDelivery(Integer id, DeliveryRequestDTO request) {
        Delivery delivery = getDeliveryEntity(id);

        // Lock rules theo status:
        // - Draft: sửa được tất cả
        // - Picked: chỉ sửa được notes, không sửa items
        // - Shipped: chỉ sửa được tracking info
        // - Delivered: không sửa được (trừ Manager)
        // - Cancelled: không sửa được
        
        if (delivery.getStatus() == Delivery.DeliveryStatus.Delivered) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isManager = authentication != null && 
                    authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));
            
            if (!isManager) {
                throw new IllegalStateException("Không thể chỉnh sửa phiếu giao hàng đã giao. Chỉ Manager mới có quyền sửa.");
            }
            
            log.warn("Manager {} đang chỉnh sửa phiếu giao hàng đã giao: {}", 
                    getCurrentUser().getEmail(), delivery.getDeliveryNo());
        } else if (delivery.getStatus() == Delivery.DeliveryStatus.Cancelled) {
            throw new IllegalStateException("Không thể chỉnh sửa phiếu giao hàng đã hủy");
        } else if (delivery.getStatus() == Delivery.DeliveryStatus.Shipped) {
            // Shipped: chỉ cho phép sửa tracking info (trackingCode, carrierName, driverName, driverPhone)
            // Không cho sửa items, địa chỉ, warehouse
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                throw new IllegalStateException("Không thể sửa sản phẩm khi phiếu giao hàng đã xuất kho. Chỉ có thể cập nhật thông tin vận chuyển.");
            }
            if (request.getShippingAddress() != null) {
                throw new IllegalStateException("Không thể sửa địa chỉ giao hàng khi phiếu giao hàng đã xuất kho.");
            }
            if (request.getWarehouseId() != null) {
                throw new IllegalStateException("Không thể sửa kho khi phiếu giao hàng đã xuất kho.");
            }
        } else if (delivery.getStatus() == Delivery.DeliveryStatus.Picked) {
            // Picked: chỉ cho phép sửa notes, không sửa items
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                throw new IllegalStateException("Không thể sửa sản phẩm khi phiếu giao hàng đã được submit cho kho. Chỉ có thể cập nhật ghi chú.");
            }
        }

        Warehouse warehouse = getWarehouse(request.getWarehouseId());
        User currentUser = getCurrentUser();
        SalesOrder salesOrder = delivery.getSalesOrder();

        validateDates(request.getPlannedDate(), request.getActualDate());

        // ===== VALIDATE TRƯỚC KHI UPDATE =====
        validateDeliveryUpdate(id, request.getItems(), salesOrder, warehouse);

        deliveryMapper.updateEntity(delivery, request, warehouse, currentUser);

        deliveryItemRepository.deleteByDelivery_DeliveryId(id);
        delivery.getItems().clear();

        // ===== LOAD GOOD ISSUE APPROVED để lấy deliveredQty =====
        List<GoodIssue> approvedIssues = goodIssueRepository.findByDeliveryId(id).stream()
                .filter(issue -> issue.getStatus() == GoodIssue.GoodIssueStatus.Approved 
                        && issue.getDeletedAt() == null)
                .toList();

        // ===== BUILD ITEMS với deliveredQty từ Good Issue =====
        List<DeliveryItem> items = buildItemsWithGoodIssueQty(delivery, request.getItems(), salesOrder, approvedIssues);
        delivery.getItems().addAll(items);

        Delivery saved = deliveryRepository.save(delivery);
        return deliveryMapper.toResponse(saved, items);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryResponseDTO getDelivery(Integer id) {
        Delivery delivery = getDeliveryEntity(id);
        List<DeliveryItem> items = deliveryItemRepository.findByDelivery_DeliveryId(id);
        return deliveryMapper.toResponse(delivery, items);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryListResponseDTO> getDeliveries(Integer salesOrderId, Integer customerId,
                                                       String status, String keyword, Pageable pageable) {
        Specification<Delivery> spec = Specification.where(DeliverySpecifications.notDeleted())
                .and(DeliverySpecifications.hasOrder(salesOrderId))
                .and(DeliverySpecifications.hasCustomer(customerId))
                .and(DeliverySpecifications.hasStatus(parseStatus(status)))
                .and(DeliverySpecifications.keywordLike(keyword));

        return deliveryRepository.findAll(spec, pageable)
                .map(deliveryMapper::toListResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeliveryListResponseDTO> getAllDeliveries(Integer salesOrderId, Integer customerId,
                                                          String status, String keyword) {
        Specification<Delivery> spec = Specification.where(DeliverySpecifications.notDeleted())
                .and(DeliverySpecifications.hasOrder(salesOrderId))
                .and(DeliverySpecifications.hasCustomer(customerId))
                .and(DeliverySpecifications.hasStatus(parseStatus(status)))
                .and(DeliverySpecifications.keywordLike(keyword));

        return deliveryRepository.findAll(spec).stream()
                .map(deliveryMapper::toListResponse)
                .toList();
    }

    @Override
    public void deleteDelivery(Integer id) {
        Delivery delivery = getDeliveryEntity(id);
        
        // Check: Không cho xóa khi Delivered, hoặc Manager có thể xóa khi Shipped/Delivered
        if (delivery.getStatus() == Delivery.DeliveryStatus.Delivered) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isManager = authentication != null && 
                    authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));
            
            if (!isManager) {
                throw new IllegalStateException("Không thể xóa phiếu giao hàng đã giao. Chỉ Manager mới có quyền xóa.");
            }
            
            log.warn("Manager {} đang xóa phiếu giao hàng đã giao: {}", 
                    getCurrentUser().getEmail(), delivery.getDeliveryNo());
        } else if (delivery.getStatus() == Delivery.DeliveryStatus.Shipped) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isManager = authentication != null && 
                    authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));
            
            if (!isManager) {
                throw new IllegalStateException("Không thể xóa phiếu giao hàng đã xuất kho. Chỉ Manager mới có quyền xóa.");
            }
            
            log.warn("Manager {} đang xóa phiếu giao hàng đã xuất kho: {}", 
                    getCurrentUser().getEmail(), delivery.getDeliveryNo());
        }

        delivery.setDeletedAt(Instant.now());
        deliveryRepository.save(delivery);
    }

    @Override
    public DeliveryResponseDTO changeStatus(Integer id, String status) {
        Delivery delivery = getDeliveryEntity(id);
        Delivery.DeliveryStatus oldStatus = delivery.getStatus();
        Delivery.DeliveryStatus newStatus = parseStatus(status);

        if (newStatus == null) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }

        // Kiểm tra chuyển đổi trạng thái hợp lệ
        validateStatusTransition(oldStatus, newStatus);

        // Validate: Khi chuyển sang Shipped, phải có Good Issue Approved
        if (newStatus == Delivery.DeliveryStatus.Shipped) {
            List<GoodIssue> approvedIssues = goodIssueRepository.findByDeliveryId(id).stream()
                    .filter(issue -> issue.getStatus() == GoodIssue.GoodIssueStatus.Approved 
                            && issue.getDeletedAt() == null)
                    .collect(Collectors.toList());
            if (approvedIssues.isEmpty()) {
                throw new IllegalStateException("Không thể chuyển sang trạng thái 'Đã xuất kho'. Phải có phiếu xuất kho đã được phê duyệt trước.");
            }
        }

        if (newStatus == Delivery.DeliveryStatus.Delivered) {
            List<GoodIssue> approvedIssues = goodIssueRepository.findByDeliveryId(id).stream()
                    .filter(issue -> issue.getStatus() == GoodIssue.GoodIssueStatus.Approved 
                            && issue.getDeletedAt() == null)
                    .collect(Collectors.toList());
            if (approvedIssues.isEmpty()) {
                throw new IllegalStateException("Không thể chuyển sang trạng thái 'Đã giao hàng'. Phải có phiếu xuất kho đã được phê duyệt trước.");
            }
            
            // Tự động cập nhật deliveredQty từ Good Issue approved
            List<DeliveryItem> items = deliveryItemRepository.findByDelivery_DeliveryId(id);
            
            // Tạo map: productId -> tổng issuedQty từ Good Issue approved
            Map<Integer, BigDecimal> goodIssueQtyByProduct = new HashMap<>();
            for (GoodIssue issue : approvedIssues) {
                List<GoodIssueItem> issueItems = goodIssueItemRepository.findByIssueId(issue.getIssueId());
                for (GoodIssueItem issueItem : issueItems) {
                    Integer productId = issueItem.getProduct().getProductId();
                    BigDecimal issuedQty = issueItem.getIssuedQty();
                    goodIssueQtyByProduct.merge(productId, issuedQty, BigDecimal::add);
                }
            }
            
            // Cập nhật deliveredQty cho từng DeliveryItem
            for (DeliveryItem item : items) {
                BigDecimal deliveredQtyFromGoodIssue = goodIssueQtyByProduct.getOrDefault(
                        item.getProduct().getProductId(), BigDecimal.ZERO);
                item.setDeliveredQty(deliveredQtyFromGoodIssue);
                log.info("Auto-updated deliveredQty for product {}: {} (from Good Issue when changing to Delivered)", 
                        item.getProduct().getName(), deliveredQtyFromGoodIssue);
            }
            
            deliveryItemRepository.saveAll(items);
        }

        delivery.setStatus(newStatus);

        // Đặt ngày giao thực tế khi đã giao hàng
        if (newStatus == Delivery.DeliveryStatus.Delivered && delivery.getActualDate() == null) {
            delivery.setActualDate(Instant.now());
        }

        Delivery saved = deliveryRepository.save(delivery);
        List<DeliveryItem> items = deliveryItemRepository.findByDelivery_DeliveryId(id);
        return deliveryMapper.toResponse(saved, items);
    }

    @Override
    @Transactional
    public DeliveryResponseDTO submitToWarehouse(Integer id) {
        log.info("Submitting delivery ID: {} to warehouse", id);
        
        Delivery delivery = getDeliveryEntity(id);
        
        // Validate: Chỉ có thể submit khi ở trạng thái Draft
        if (delivery.getStatus() != Delivery.DeliveryStatus.Draft) {
            throw new IllegalStateException("Chỉ có thể submit phiếu giao hàng khi ở trạng thái Nháp");
        }
        
        // Validate: Phải có items
        List<DeliveryItem> items = deliveryItemRepository.findByDelivery_DeliveryId(id);
        if (items == null || items.isEmpty()) {
            throw new IllegalStateException("Không thể submit: Phiếu giao hàng phải có ít nhất một sản phẩm");
        }
        
        // Validate: Phải có địa chỉ giao hàng
        if (delivery.getShippingAddress() == null || delivery.getShippingAddress().trim().isEmpty()) {
            throw new IllegalStateException("Không thể submit: Vui lòng điền địa chỉ giao hàng");
        }
        
        // Chuyển status sang Picked
        delivery.setStatus(Delivery.DeliveryStatus.Picked);
        delivery.setUpdatedAt(Instant.now());
        
        Delivery saved = deliveryRepository.save(delivery);
        List<DeliveryItem> savedItems = deliveryItemRepository.findByDelivery_DeliveryId(id);
        
        log.info("Delivery {} submitted to warehouse successfully", delivery.getDeliveryNo());
        return deliveryMapper.toResponse(saved, savedItems);
    }

    @Override
    public DeliveryResponseDTO createFromSalesOrder(Integer salesOrderId) {
        SalesOrder salesOrder = getSalesOrder(salesOrderId);
        validateSalesOrderForDelivery(salesOrder);

        User currentUser = getCurrentUser();
        Warehouse defaultWarehouse = getDefaultWarehouse();

        // ===== VALIDATE TRƯỚC: Kiểm tra xem có thể tạo Delivery từ Sales Order này không =====
        List<SalesOrderItem> orderItems = salesOrderItemRepository.findBySalesOrder_SoId(salesOrderId);
        for (SalesOrderItem orderItem : orderItems) {
            BigDecimal deliveredQty = deliveryItemRepository.sumDeliveredQtyBySalesOrderItem(orderItem.getSoiId());
            BigDecimal plannedQty = deliveryItemRepository.sumPlannedQtyBySalesOrderItemExcludingDelivered(orderItem.getSoiId());
            BigDecimal remainingQty = orderItem.getQuantity().subtract(deliveredQty).subtract(plannedQty);

            if (remainingQty.compareTo(BigDecimal.ZERO) <= 0) {
                List<DeliveryItem> plannedItemsForOrder = deliveryItemRepository.findPlannedItemsBySalesOrderItem(orderItem.getSoiId());
                StringBuilder deliveryInfo = new StringBuilder();
                if (!plannedItemsForOrder.isEmpty()) {
                    deliveryInfo.append(" Các phiếu giao hàng đã lên kế hoạch: ");
                    for (DeliveryItem item : plannedItemsForOrder) {
                        deliveryInfo.append(String.format("[%s (ID: %d) - %s: %s], ",
                                item.getDelivery().getDeliveryNo(),
                                item.getDelivery().getDeliveryId(),
                                item.getDelivery().getStatus(),
                                item.getPlannedQty()));
                    }
                }

                throw new IllegalStateException(String.format(
                        "Không thể tạo phiếu giao hàng từ Sales Order: Tất cả số lượng của sản phẩm %s đã được giao hoặc đã lên kế hoạch. " +
                                "Số lượng đặt hàng: %s, Đã giao: %s, Đã lên kế hoạch: %s.%s " +
                                "Vui lòng xóa hoặc chỉnh sửa các phiếu giao hàng đã lên kế hoạch trước.",
                        orderItem.getProduct().getName(), orderItem.getQuantity(), deliveredQty, plannedQty, deliveryInfo));
            }
        }

        // ===== SAU KHI VALIDATE OK, TẠO ENTITY =====
        Delivery delivery = new Delivery();
        delivery.setSalesOrder(salesOrder);
        delivery.setWarehouse(defaultWarehouse);
        delivery.setPlannedDate(Instant.now());
        delivery.setShippingAddress(salesOrder.getShippingAddress());
        delivery.setDeliveryNo(generateDeliveryNo());
        delivery.setStatus(Delivery.DeliveryStatus.Draft);
        delivery.setCreatedBy(currentUser);
        delivery.setUpdatedBy(currentUser);

        List<DeliveryItem> items = buildItemsFromSalesOrder(delivery, salesOrderId, defaultWarehouse);

        if (items.isEmpty()) {
            throw new IllegalStateException("Tất cả sản phẩm trong đơn hàng đã được giao");
        }

        delivery.getItems().addAll(items);
        Delivery saved = deliveryRepository.save(delivery);
        return deliveryMapper.toResponse(saved, items);
    }

    /**
     * Validate request TRƯỚC KHI tạo entity.
     * Method này KHÔNG tạo entity, chỉ validate pure logic để tránh Hibernate auto-flush.
     */
    private void validateDeliveryRequest(
            List<DeliveryItemRequestDTO> requestItems,
            SalesOrder salesOrder,
            Warehouse defaultWarehouse) {

        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một dòng giao hàng");
        }

        for (DeliveryItemRequestDTO dto : requestItems) {
            // Fetch data cần thiết
            SalesOrderItem salesOrderItem = salesOrderItemRepository.findById(dto.getSalesOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Sales Order Item ID " + dto.getSalesOrderItemId()));

            if (!salesOrderItem.getSalesOrder().getSoId().equals(salesOrder.getSoId())) {
                throw new IllegalArgumentException("Sales Order Item không thuộc về Sales Order này");
            }

            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID " + dto.getProductId()));

            if (!product.getProductId().equals(salesOrderItem.getProduct().getProductId())) {
                throw new IllegalArgumentException("Sản phẩm không khớp với Sales Order Item");
            }

            Warehouse warehouse = dto.getWarehouseId() != null
                    ? getWarehouse(dto.getWarehouseId())
                    : defaultWarehouse;

            BigDecimal plannedQty = defaultBigDecimal(dto.getPlannedQty(), BigDecimal.ZERO);
            BigDecimal deliveredQty = defaultBigDecimal(dto.getDeliveredQty(), BigDecimal.ZERO);

            // Validate delivered <= planned
            if (deliveredQty.compareTo(plannedQty) > 0) {
                throw new IllegalArgumentException(
                        String.format("Số lượng đã giao (%s) không được vượt quá số lượng dự kiến (%s) cho sản phẩm %s",
                                deliveredQty, plannedQty, product.getName()));
            }

            // ========== VALIDATE: Không được giao vượt quá số lượng đơn hàng ==========
            BigDecimal orderedQty = salesOrderItem.getQuantity();
            BigDecimal alreadyDeliveredQty = deliveryItemRepository.sumDeliveredQtyBySalesOrderItem(salesOrderItem.getSoiId());
            BigDecimal alreadyPlannedQty = deliveryItemRepository.sumPlannedQtyBySalesOrderItemExcludingDelivered(salesOrderItem.getSoiId());
            BigDecimal maxPlannedQtyFromOrder = orderedQty.subtract(alreadyDeliveredQty).subtract(alreadyPlannedQty);

            log.info("[VALIDATE CREATE] Kiểm tra số lượng từ đơn hàng cho sản phẩm {} (SOI ID: {}): Ordered={}, AlreadyDelivered={}, AlreadyPlanned={}, MaxPlannedFromOrder={}",
                    product.getName(), salesOrderItem.getSoiId(), orderedQty, alreadyDeliveredQty, alreadyPlannedQty, maxPlannedQtyFromOrder);

            if (plannedQty.compareTo(maxPlannedQtyFromOrder) > 0) {
                List<DeliveryItem> plannedItemsForOrder = deliveryItemRepository.findPlannedItemsBySalesOrderItem(salesOrderItem.getSoiId());
                StringBuilder deliveryInfo = new StringBuilder();
                if (!plannedItemsForOrder.isEmpty()) {
                    deliveryInfo.append(" Các phiếu giao hàng đã lên kế hoạch: ");
                    for (DeliveryItem item : plannedItemsForOrder) {
                        deliveryInfo.append(String.format("[%s (ID: %d) - %s: %s], ",
                                item.getDelivery().getDeliveryNo(),
                                item.getDelivery().getDeliveryId(),
                                item.getDelivery().getStatus(),
                                item.getPlannedQty()));
                    }
                }

                log.error("[VALIDATE CREATE] ❌ Validation FAILED - Sẽ throw exception và rollback transaction. Delivery sẽ KHÔNG được tạo.");
                throw new IllegalArgumentException(String.format(
                        "Không thể tạo phiếu giao hàng: Số lượng giao dự kiến (%s) vượt quá số lượng còn lại từ đơn hàng (%s) cho sản phẩm %s. " +
                                "Số lượng đặt hàng: %s, Đã giao: %s, Đã lên kế hoạch: %s.%s " +
                                "Vui lòng xóa hoặc chỉnh sửa các phiếu giao hàng đã lên kế hoạch trước, hoặc giảm số lượng giao dự kiến.",
                        plannedQty, maxPlannedQtyFromOrder, product.getName(),
                        orderedQty, alreadyDeliveredQty, alreadyPlannedQty, deliveryInfo));
            }
        }
    }

    /**
     * Validate update request.
     */
    private void validateDeliveryUpdate(
            Integer deliveryId,
            List<DeliveryItemRequestDTO> requestItems,
            SalesOrder salesOrder,
            Warehouse defaultWarehouse) {

        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một dòng giao hàng");
        }

        // Load current items để exclude khỏi calculation
        List<DeliveryItem> currentItems = deliveryItemRepository.findByDelivery_DeliveryId(deliveryId);

        for (DeliveryItemRequestDTO dto : requestItems) {
            SalesOrderItem salesOrderItem = salesOrderItemRepository.findById(dto.getSalesOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Sales Order Item ID " + dto.getSalesOrderItemId()));

            if (!salesOrderItem.getSalesOrder().getSoId().equals(salesOrder.getSoId())) {
                throw new IllegalArgumentException("Sales Order Item không thuộc về Sales Order này");
            }

            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID " + dto.getProductId()));

            if (!product.getProductId().equals(salesOrderItem.getProduct().getProductId())) {
                throw new IllegalArgumentException("Sản phẩm không khớp với Sales Order Item");
            }

            Warehouse warehouse = dto.getWarehouseId() != null
                    ? getWarehouse(dto.getWarehouseId())
                    : defaultWarehouse;

            BigDecimal plannedQty = defaultBigDecimal(dto.getPlannedQty(), BigDecimal.ZERO);
            BigDecimal deliveredQty = defaultBigDecimal(dto.getDeliveredQty(), BigDecimal.ZERO);

            if (deliveredQty.compareTo(plannedQty) > 0) {
                throw new IllegalArgumentException(
                        String.format("Số lượng đã giao (%s) không được vượt quá số lượng dự kiến (%s) cho sản phẩm %s",
                                deliveredQty, plannedQty, product.getName()));
            }

            // Validate số lượng từ đơn hàng
            BigDecimal orderedQty = salesOrderItem.getQuantity();
            BigDecimal alreadyDeliveredQty = deliveryItemRepository.sumDeliveredQtyBySalesOrderItem(salesOrderItem.getSoiId());
            BigDecimal alreadyPlannedQty = deliveryItemRepository.sumPlannedQtyBySalesOrderItemExcludingDelivered(salesOrderItem.getSoiId());

            // Trừ đi plannedQty của delivery hiện tại
            for (DeliveryItem currentItem : currentItems) {
                if (currentItem.getSalesOrderItem().getSoiId().equals(salesOrderItem.getSoiId())) {
                    alreadyPlannedQty = alreadyPlannedQty.subtract(currentItem.getPlannedQty()).max(BigDecimal.ZERO);
                    break;
                }
            }

            BigDecimal maxPlannedQtyFromOrder = orderedQty.subtract(alreadyDeliveredQty).subtract(alreadyPlannedQty);

            log.info("[VALIDATE UPDATE] Kiểm tra số lượng từ đơn hàng cho sản phẩm {} (SOI ID: {}): Ordered={}, AlreadyDelivered={}, AlreadyPlanned={}, MaxPlannedFromOrder={}",
                    product.getName(), salesOrderItem.getSoiId(), orderedQty, alreadyDeliveredQty, alreadyPlannedQty, maxPlannedQtyFromOrder);

            if (plannedQty.compareTo(maxPlannedQtyFromOrder) > 0) {
                throw new IllegalArgumentException(String.format(
                        "Không thể cập nhật: Số lượng giao dự kiến (%s) vượt quá số lượng còn lại từ đơn hàng (%s) cho sản phẩm %s.",
                        plannedQty, maxPlannedQtyFromOrder, product.getName()));
            }
        }
    }

    private List<DeliveryItem> buildItemsWithGoodIssueQty(
            Delivery delivery,
            List<DeliveryItemRequestDTO> requestItems,
            SalesOrder salesOrder,
            List<GoodIssue> approvedIssues) {

        // Tạo map: productId -> tổng issuedQty từ Good Issue approved cho Delivery này
        java.util.Map<Integer, BigDecimal> goodIssueQtyByProduct = new java.util.HashMap<>();
        for (GoodIssue issue : approvedIssues) {
            List<GoodIssueItem> issueItems = goodIssueItemRepository.findByIssueId(issue.getIssueId());
            for (GoodIssueItem issueItem : issueItems) {
                if (issueItem.getDeliveryItem().getDelivery().getDeliveryId().equals(delivery.getDeliveryId())) {
                    Integer productId = issueItem.getProduct().getProductId();
                    BigDecimal issuedQty = issueItem.getIssuedQty();
                    goodIssueQtyByProduct.merge(productId, issuedQty, BigDecimal::add);
                }
            }
        }

        List<DeliveryItem> items = new ArrayList<>();
        for (DeliveryItemRequestDTO dto : requestItems) {
            SalesOrderItem salesOrderItem = salesOrderItemRepository.findById(dto.getSalesOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sales Order Item not found"));
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            Warehouse warehouse = dto.getWarehouseId() != null
                    ? getWarehouse(dto.getWarehouseId())
                    : delivery.getWarehouse();

            DeliveryItem item = deliveryMapper.toItemEntity(delivery, dto, salesOrderItem, product, warehouse);
            
            // Tự động fill deliveredQty từ Good Issue approved theo productId
            BigDecimal deliveredQtyFromGoodIssue = goodIssueQtyByProduct.getOrDefault(product.getProductId(), BigDecimal.ZERO);
            item.setDeliveredQty(deliveredQtyFromGoodIssue);
            
            log.info("Setting deliveredQty for product {}: {} (from Good Issue)", product.getName(), deliveredQtyFromGoodIssue);
            
            items.add(item);
        }
        return items;
    }

    private List<DeliveryItem> buildItemsWithoutValidation(
            Delivery delivery,
            List<DeliveryItemRequestDTO> requestItems,
            SalesOrder salesOrder) {

        List<DeliveryItem> items = new ArrayList<>();
        for (DeliveryItemRequestDTO dto : requestItems) {
            SalesOrderItem salesOrderItem = salesOrderItemRepository.findById(dto.getSalesOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sales Order Item not found"));
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            Warehouse warehouse = dto.getWarehouseId() != null
                    ? getWarehouse(dto.getWarehouseId())
                    : delivery.getWarehouse();

            DeliveryItem item = deliveryMapper.toItemEntity(delivery, dto, salesOrderItem, product, warehouse);
            items.add(item);
        }
        return items;
    }

    private List<DeliveryItem> buildItemsFromSalesOrder(Delivery delivery, Integer salesOrderId, Warehouse defaultWarehouse) {
        List<DeliveryItem> items = new ArrayList<>();
        List<SalesOrderItem> orderItems = salesOrderItemRepository.findBySalesOrder_SoId(salesOrderId);

        for (SalesOrderItem orderItem : orderItems) {
            // Tính số lượng còn lại cần giao
            // Chỉ tính số lượng đã giao thực tế (từ các Delivery đã Delivered)
            // Và số lượng đã lên kế hoạch nhưng chưa giao (từ các Delivery chưa Delivered)
            BigDecimal deliveredQty = deliveryItemRepository.sumDeliveredQtyBySalesOrderItem(orderItem.getSoiId());
            // Chỉ tính plannedQty từ các Delivery chưa Delivered (Draft, Picked, Shipped)
            BigDecimal plannedQty = deliveryItemRepository.sumPlannedQtyBySalesOrderItemExcludingDelivered(orderItem.getSoiId());
            BigDecimal remainingQty = orderItem.getQuantity().subtract(deliveredQty).subtract(plannedQty);

            if (remainingQty.compareTo(BigDecimal.ZERO) > 0) {
                DeliveryItem item = new DeliveryItem();
                item.setDelivery(delivery);
                item.setSalesOrderItem(orderItem);
                item.setProduct(orderItem.getProduct());
                item.setWarehouse(orderItem.getWarehouse() != null ? orderItem.getWarehouse() : defaultWarehouse);
                item.setOrderedQty(orderItem.getQuantity());
                item.setPlannedQty(remainingQty);
                item.setDeliveredQty(BigDecimal.ZERO);
                item.setUom(orderItem.getUom());
                items.add(item);
            }
        }
        return items;
    }


    private void validateStatusTransition(Delivery.DeliveryStatus currentStatus, Delivery.DeliveryStatus newStatus) {
        if (currentStatus == Delivery.DeliveryStatus.Cancelled) {
            throw new IllegalStateException("Không thể thay đổi trạng thái của phiếu giao hàng đã hủy");
        }

        if (currentStatus == Delivery.DeliveryStatus.Delivered) {
            throw new IllegalStateException("Không thể thay đổi trạng thái của phiếu giao hàng đã giao");
        }

        // Cho phép các chuyển đổi trạng thái hợp lệ
        switch (currentStatus) {
            case Draft:
                if (newStatus != Delivery.DeliveryStatus.Picked && newStatus != Delivery.DeliveryStatus.Cancelled) {
                    throw new IllegalStateException("Chỉ có thể chuyển từ Draft sang Picked hoặc Cancelled");
                }
                break;
            case Picked:
                if (newStatus != Delivery.DeliveryStatus.Shipped && newStatus != Delivery.DeliveryStatus.Cancelled) {
                    throw new IllegalStateException("Chỉ có thể chuyển từ Picked sang Shipped hoặc Cancelled");
                }
                break;
            case Shipped:
                if (newStatus != Delivery.DeliveryStatus.Delivered && newStatus != Delivery.DeliveryStatus.Cancelled) {
                    throw new IllegalStateException("Chỉ có thể chuyển từ Shipped sang Delivered hoặc Cancelled");
                }
                break;
        }
    }

    private Delivery getDeliveryEntity(Integer id) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu giao hàng ID " + id));
        if (delivery.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Phiếu giao hàng đã bị xóa");
        }
        return delivery;
    }

    private SalesOrder getSalesOrder(Integer id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Sales Order ID " + id));
        if (order.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Sales Order đã bị xóa");
        }
        return order;
    }

    private void validateSalesOrderForDelivery(SalesOrder salesOrder) {
        if (salesOrder.getStatus() == SalesOrder.OrderStatus.Cancelled) {
            throw new IllegalStateException("Không thể tạo phiếu giao hàng cho đơn hàng đã hủy");
        }
        if (salesOrder.getApprovalStatus() != SalesOrder.ApprovalStatus.Approved) {
            throw new IllegalStateException("Chỉ có thể tạo phiếu giao hàng cho đơn hàng đã được duyệt");
        }
    }

    private void validateDates(java.time.LocalDate plannedDate, java.time.LocalDate actualDate) {
        if (plannedDate != null && actualDate != null && actualDate.isBefore(plannedDate)) {
            throw new IllegalArgumentException("Ngày giao thực tế không được sớm hơn ngày giao dự kiến");
        }
    }

    private Warehouse getDefaultWarehouse() {
        return warehouseRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho mặc định"));
    }

    private Warehouse getWarehouse(Integer id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho ID " + id));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + authentication.getName()));
    }

    private Delivery.DeliveryStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return Delivery.DeliveryStatus.valueOf(status.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private BigDecimal defaultBigDecimal(BigDecimal value) {
        return defaultBigDecimal(value, BigDecimal.ZERO);
    }

    private BigDecimal defaultBigDecimal(BigDecimal value, BigDecimal defaultValue) {
        return value != null ? value : defaultValue;
    }

    private String generateDeliveryNo() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        String candidate = "DLV-" + datePart + "-" + unique;

        while (deliveryRepository.findByDeliveryNo(candidate) != null) {
            unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
            candidate = "DLV-" + datePart + "-" + unique;
        }
        return candidate;
    }
}