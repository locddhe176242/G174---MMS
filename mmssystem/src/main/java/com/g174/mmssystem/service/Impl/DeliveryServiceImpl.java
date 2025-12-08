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
import com.g174.mmssystem.service.IService.IWarehouseStockService;
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
import java.util.List;
import java.util.Locale;
import java.util.UUID;

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
    private final IWarehouseStockService warehouseStockService;
    private final WarehouseStockRepository warehouseStockRepository;

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
        log.info("[CREATE DELIVERY] ✅ Đã save Delivery thành công với ID: {}, deliveryNo: {}", saved.getDeliveryId(), saved.getDeliveryNo());
        return deliveryMapper.toResponse(saved, items);
    }

    @Override
    public DeliveryResponseDTO updateDelivery(Integer id, DeliveryRequestDTO request) {
        Delivery delivery = getDeliveryEntity(id);

        if (delivery.getStatus() == Delivery.DeliveryStatus.Delivered ||
                delivery.getStatus() == Delivery.DeliveryStatus.Cancelled) {
            throw new IllegalStateException("Không thể chỉnh sửa phiếu giao hàng đã giao hoặc đã hủy");
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
        
        // ===== BUILD ITEMS (KHÔNG VALIDATION) =====
        List<DeliveryItem> items = buildItemsWithoutValidation(delivery, request.getItems(), salesOrder);
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
        if (delivery.getStatus() == Delivery.DeliveryStatus.Delivered) {
            throw new IllegalStateException("Không thể xóa phiếu giao hàng đã giao");
        }

        // Nếu Delivery đã Shipped, cần hoàn lại số lượng vào kho
        if (delivery.getStatus() == Delivery.DeliveryStatus.Shipped) {
            List<DeliveryItem> items = deliveryItemRepository.findByDelivery_DeliveryId(id);
            restoreStockForItems(delivery, items);
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

        // Khi chuyển sang Delivered: bắt buộc phải có ít nhất một dòng có số lượng đã giao > 0
        if (newStatus == Delivery.DeliveryStatus.Delivered) {
            List<DeliveryItem> itemsForValidation = deliveryItemRepository.findByDelivery_DeliveryId(delivery.getDeliveryId());
            boolean hasDeliveredQty = itemsForValidation.stream()
                    .anyMatch(item -> item.getDeliveredQty() != null
                            && item.getDeliveredQty().compareTo(BigDecimal.ZERO) > 0);
            if (!hasDeliveredQty) {
                throw new IllegalStateException("Vui lòng cập nhật 'Số lượng đã giao' cho ít nhất một sản phẩm trước khi chuyển sang trạng thái 'Đã giao hàng'.");
            }
        }

        // Cập nhật số lượng trong kho khi thay đổi trạng thái
        updateWarehouseStockOnStatusChange(delivery, oldStatus, newStatus);

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

            // ========== CẢNH BÁO: Kiểm tra số lượng trong kho ==========
            WarehouseStock stock = warehouseStockRepository.findByWarehouseIdAndProductId(
                    warehouse.getWarehouseId(), product.getProductId()).orElse(null);
            
            BigDecimal availableStockQty = stock != null ? stock.getQuantity() : BigDecimal.ZERO;
            
            // Tính số lượng đã planned từ các Delivery khác (chưa Delivered)
            BigDecimal alreadyPlannedFromWarehouse = BigDecimal.ZERO;
            List<DeliveryItem> plannedItems = deliveryItemRepository.findPlannedItemsBySalesOrderItem(salesOrderItem.getSoiId());
            for (DeliveryItem item : plannedItems) {
                if (item.getProduct().getProductId().equals(product.getProductId()) &&
                    item.getWarehouse().getWarehouseId().equals(warehouse.getWarehouseId())) {
                    alreadyPlannedFromWarehouse = alreadyPlannedFromWarehouse.add(item.getPlannedQty());
                }
            }
            
            BigDecimal maxPlannedQtyFromStock = availableStockQty.subtract(alreadyPlannedFromWarehouse);
            
            log.info("[VALIDATE CREATE] Kiểm tra số lượng trong kho cho sản phẩm {} trong kho {}: Stock={}, AlreadyPlanned={}, MaxPlannedFromStock={}", 
                    product.getName(), warehouse.getName(), availableStockQty, alreadyPlannedFromWarehouse, maxPlannedQtyFromStock);

            if (plannedQty.compareTo(maxPlannedQtyFromStock) > 0) {
                log.warn("CẢNH BÁO: Số lượng giao dự kiến ({}) vượt quá số lượng có sẵn trong kho ({}) cho sản phẩm {} trong kho {}.", 
                        plannedQty, maxPlannedQtyFromStock, product.getName(), warehouse.getName());
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

    private List<DeliveryItem> buildItemsWithoutValidation(
            Delivery delivery,
            List<DeliveryItemRequestDTO> requestItems,
            SalesOrder salesOrder) {
        
        List<DeliveryItem> items = new ArrayList<>();
        for (DeliveryItemRequestDTO dto : requestItems) {
            SalesOrderItem salesOrderItem = salesOrderItemRepository.findById(dto.getSalesOrderItemId()).get();
            Product product = productRepository.findById(dto.getProductId()).get();
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

    private void updateWarehouseStockOnStatusChange(Delivery delivery, Delivery.DeliveryStatus oldStatus, Delivery.DeliveryStatus newStatus) {
        List<DeliveryItem> items = deliveryItemRepository.findByDelivery_DeliveryId(delivery.getDeliveryId());

        // Khi chuyển sang Shipped: trừ số lượng dự kiến ra khỏi kho (hàng xuất kho)
        if (newStatus == Delivery.DeliveryStatus.Shipped && oldStatus != Delivery.DeliveryStatus.Shipped) {
            decreaseStockForItems(delivery, items, true);
        }

        // Khi chuyển sang Delivered: hoàn lại phần chưa giao vào kho (nếu chỉ giao một phần)
        if (newStatus == Delivery.DeliveryStatus.Delivered && oldStatus != Delivery.DeliveryStatus.Delivered) {
            // Validate: phải có deliveredQty > 0 cho tất cả items
            for (DeliveryItem item : items) {
                if (item.getDeliveredQty() == null || item.getDeliveredQty().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalStateException(
                        String.format("Không thể chuyển sang trạng thái 'Delivered': Sản phẩm %s chưa có số lượng đã giao. Vui lòng cập nhật số lượng đã giao trước.",
                            item.getProduct().getName()));
                }
                if (item.getDeliveredQty().compareTo(item.getPlannedQty()) > 0) {
                    throw new IllegalStateException(
                        String.format("Không thể chuyển sang trạng thái 'Delivered': Số lượng đã giao (%s) vượt quá số lượng dự kiến (%s) cho sản phẩm %s.",
                            item.getDeliveredQty(), item.getPlannedQty(), item.getProduct().getName()));
                }
            }
            restoreUnDeliveredStock(delivery, items);
        }

        // Khi chuyển từ Delivered sang trạng thái khác: trừ lại số lượng đã giao (nếu đã hoàn lại trước đó)
        if (oldStatus == Delivery.DeliveryStatus.Delivered && newStatus != Delivery.DeliveryStatus.Delivered) {
            decreaseStockForDeliveredItems(delivery, items, false);
        }

        // Khi chuyển sang Cancelled và trước đó đã Shipped: hoàn lại số lượng vào kho
        if (newStatus == Delivery.DeliveryStatus.Cancelled && oldStatus == Delivery.DeliveryStatus.Shipped) {
            restoreStockForItems(delivery, items);
        }
    }

    private void decreaseStockForItems(Delivery delivery, List<DeliveryItem> items, boolean throwOnError) {
        for (DeliveryItem item : items) {
            Integer warehouseId = getWarehouseId(item, delivery);
            Integer productId = item.getProduct().getProductId();
            BigDecimal quantity = item.getPlannedQty();

            try {
                warehouseStockService.decreaseStock(warehouseId, productId, quantity);
                log.info("Đã trừ {} sản phẩm ID {} ra khỏi kho ID {} cho Delivery {}",
                        quantity, productId, warehouseId, delivery.getDeliveryNo());
            } catch (Exception e) {
                log.error("Lỗi khi trừ số lượng kho cho Delivery {}: {}", delivery.getDeliveryNo(), e.getMessage());
                if (throwOnError) {
                    throw new IllegalStateException("Không đủ số lượng trong kho để xuất hàng: " + e.getMessage());
                }
            }
        }
    }

    // Hoàn lại phần chưa giao vào kho (khi chỉ giao một phần)
    private void restoreUnDeliveredStock(Delivery delivery, List<DeliveryItem> items) {
        for (DeliveryItem item : items) {
            Integer warehouseId = getWarehouseId(item, delivery);
            Integer productId = item.getProduct().getProductId();
            // Hoàn lại phần chưa giao = plannedQty - deliveredQty
            BigDecimal unDeliveredQty = item.getPlannedQty().subtract(item.getDeliveredQty());

            if (unDeliveredQty.compareTo(BigDecimal.ZERO) > 0) {
                try {
                    warehouseStockService.increaseStock(warehouseId, productId, unDeliveredQty);
                    log.info("Đã hoàn lại {} sản phẩm ID {} vào kho ID {} cho Delivery {} (phần chưa giao: {} - {} = {})",
                            unDeliveredQty, productId, warehouseId, delivery.getDeliveryNo(),
                            item.getPlannedQty(), item.getDeliveredQty(), unDeliveredQty);
                } catch (Exception e) {
                    log.error("Lỗi khi hoàn lại số lượng kho cho Delivery {}: {}", delivery.getDeliveryNo(), e.getMessage());
                }
            }
        }
    }

    // Trừ stock theo số lượng đã giao thực tế (deliveredQty) - dùng khi revert từ Delivered
    private void decreaseStockForDeliveredItems(Delivery delivery, List<DeliveryItem> items, boolean throwOnError) {
        for (DeliveryItem item : items) {
            Integer warehouseId = getWarehouseId(item, delivery);
            Integer productId = item.getProduct().getProductId();
            BigDecimal quantity = item.getDeliveredQty();

            if (quantity.compareTo(BigDecimal.ZERO) > 0) {
                try {
                    warehouseStockService.decreaseStock(warehouseId, productId, quantity);
                    log.info("Đã trừ {} sản phẩm ID {} ra khỏi kho ID {} cho Delivery {} (revert từ Delivered)",
                            quantity, productId, warehouseId, delivery.getDeliveryNo());
                } catch (Exception e) {
                    log.error("Lỗi khi trừ số lượng kho cho Delivery {}: {}", delivery.getDeliveryNo(), e.getMessage());
                    if (throwOnError) {
                        throw new IllegalStateException("Không đủ số lượng trong kho: " + e.getMessage());
                    }
                }
            }
        }
    }

    private void restoreStockForItems(Delivery delivery, List<DeliveryItem> items) {
        for (DeliveryItem item : items) {
            Integer warehouseId = getWarehouseId(item, delivery);
            Integer productId = item.getProduct().getProductId();
            BigDecimal quantity = item.getPlannedQty();

            try {
                warehouseStockService.increaseStock(warehouseId, productId, quantity);
                log.info("Đã hoàn lại {} sản phẩm ID {} vào kho ID {} cho Delivery {}",
                        quantity, productId, warehouseId, delivery.getDeliveryNo());
            } catch (Exception e) {
                log.error("Lỗi khi hoàn lại số lượng kho cho Delivery {}: {}", delivery.getDeliveryNo(), e.getMessage());
                // Không throw exception vì đây là hoàn lại, không ảnh hưởng đến nghiệp vụ chính
            }
        }
    }

    private Integer getWarehouseId(DeliveryItem item, Delivery delivery) {
        return item.getWarehouse() != null ? item.getWarehouse().getWarehouseId() : delivery.getWarehouse().getWarehouseId();
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
