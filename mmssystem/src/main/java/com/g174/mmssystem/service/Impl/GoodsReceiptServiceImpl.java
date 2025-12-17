package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.GoodsReceiptRequestDTO;
import com.g174.mmssystem.dto.responseDTO.GoodsReceiptResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.enums.PurchaseOrderApprovalStatus;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.GoodsReceiptMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IGoodsReceiptService;
import com.g174.mmssystem.service.IService.IAPInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GoodsReceiptServiceImpl implements IGoodsReceiptService {

    private final GoodsReceiptRepository receiptRepository;
    private final GoodsReceiptMapper receiptMapper;
    private final PurchaseOrderRepository orderRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PurchaseOrderItemRepository orderItemRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final IAPInvoiceService apInvoiceService;
    private final APInvoiceRepository apInvoiceRepository;
    private final SalesReturnInboundOrderRepository salesReturnInboundOrderRepository;
    private final SalesReturnInboundOrderItemRepository salesReturnInboundOrderItemRepository;
    private final ReturnOrderRepository returnOrderRepository;
    private final ReturnOrderItemRepository returnOrderItemRepository;
    private final InboundDeliveryRepository inboundDeliveryRepository;
    private final InboundDeliveryItemRepository inboundDeliveryItemRepository;

    /**
     * Tạo Goods Receipt từ Inbound Delivery (Purchase flow)
     * Flow: PO → Inbound Delivery → Goods Receipt
     */
    @Override
    @Transactional
    public GoodsReceiptResponseDTO createReceipt(GoodsReceiptRequestDTO dto, Integer createdById) {
        log.info("Creating goods receipt from Inbound Delivery ID: {}, Warehouse ID: {}", 
                dto.getInboundDeliveryId(), dto.getWarehouseId());

        // Validate Inbound Delivery
        InboundDelivery inboundDelivery = inboundDeliveryRepository.findById(dto.getInboundDeliveryId())
                .filter(id -> id.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Inbound Delivery not found with ID: " + dto.getInboundDeliveryId()));

        // Validate status: Inbound Delivery must be Pending (chờ nhập kho)
        if (inboundDelivery.getStatus() != InboundDelivery.InboundDeliveryStatus.Pending &&
            inboundDelivery.getStatus() != InboundDelivery.InboundDeliveryStatus.Completed) {
            throw new IllegalStateException("Inbound Delivery must be Pending status to create Goods Receipt");
        }

        // For partial delivery: Allow multiple Goods Receipts for the same Inbound Delivery
        // Don't check if already has approved receipt - user can create multiple GRs to receive items in batches

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + dto.getWarehouseId()));

        // Validate warehouse matches Inbound Delivery warehouse
        if (!warehouse.getWarehouseId().equals(inboundDelivery.getWarehouse().getWarehouseId())) {
            throw new IllegalArgumentException("Warehouse must match Inbound Delivery warehouse");
        }

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdById));

        // Generate receipt number if not provided
        String receiptNo = dto.getReceiptNo();
        if (receiptNo == null || receiptNo.trim().isEmpty()) {
            receiptNo = generateReceiptNo();
        } else if (receiptRepository.existsByReceiptNo(receiptNo)) {
            throw new DuplicateResourceException("Goods Receipt number already exists: " + receiptNo);
        }

        // Create receipt entity
        GoodsReceipt receipt = GoodsReceipt.builder()
                .receiptNo(receiptNo)
                .inboundDelivery(inboundDelivery)
                .warehouse(warehouse)
                .receivedDate(dto.getReceivedDate() != null ? dto.getReceivedDate().toLocalDateTime() : LocalDateTime.now())
                .status(GoodsReceipt.GoodsReceiptStatus.Pending)
                .sourceType(GoodsReceipt.SourceType.Purchase)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Load Inbound Delivery items
        List<InboundDeliveryItem> inboundItems = inboundDeliveryItemRepository.findByInboundDeliveryId(dto.getInboundDeliveryId());
        if (inboundItems == null || inboundItems.isEmpty()) {
            throw new IllegalStateException("Inbound Delivery has no items");
        }

        // Create items from DTO
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<GoodsReceiptItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        InboundDeliveryItem idiItem = inboundItems.stream()
                                .filter(idi -> idi.getIdiId().equals(itemDto.getIdiId()))
                                .findFirst()
                                .orElseThrow(() -> new ResourceNotFoundException("Inbound Delivery Item not found with ID: " + itemDto.getIdiId()));

                        Product product = productRepository.findById(itemDto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                        // Validate received qty <= expected qty
                        if (itemDto.getReceivedQty().compareTo(idiItem.getExpectedQty()) > 0) {
                            throw new IllegalArgumentException("Received quantity cannot exceed expected quantity");
                        }

                        return GoodsReceiptItem.builder()
                                .goodsReceipt(receipt)
                                .inboundDeliveryItem(idiItem)
                                .product(product)
                                .receivedQty(itemDto.getReceivedQty())
                                .acceptedQty(itemDto.getAcceptedQty() != null ? itemDto.getAcceptedQty() : itemDto.getReceivedQty())
                                .remark(itemDto.getRemark())
                                .build();
                    })
                    .collect(Collectors.toList());
            receipt.setItems(items);
        }

        GoodsReceipt saved = receiptRepository.save(receipt);
        
        // DO NOT update Inbound Delivery status here - it will be updated when GR is approved
        // Status will change to Completed only when all items are fully received

        GoodsReceipt savedWithRelations = receiptRepository.findByIdWithRelations(saved.getReceiptId())
                .orElse(saved);

        log.info("Goods receipt created successfully with ID: {} and number: {}", saved.getReceiptId(), saved.getReceiptNo());
        return receiptMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO createReceiptFromSalesReturnInboundOrder(Integer sriId, GoodsReceiptRequestDTO dto, Integer createdById) {
        try {
            log.info("Creating goods receipt from Sales Return Inbound Order ID: {}, Warehouse ID: {}", sriId, dto.getWarehouseId());
            log.info("DTO: receiptNo={}, warehouseId={}, receivedDate={}, sourceType={}, itemsCount={}", 
                    dto.getReceiptNo(), dto.getWarehouseId(), dto.getReceivedDate(), dto.getSourceType(), 
                    dto.getItems() != null ? dto.getItems().size() : 0);

        // Validate and load Sales Return Inbound Order
        SalesReturnInboundOrder inboundOrder = salesReturnInboundOrderRepository.findById(sriId)
                .filter(sri -> sri.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Return Inbound Order not found with ID: " + sriId));

        // Validate status: must be Draft or SentToWarehouse (không cần Approved)
        if (inboundOrder.getStatus() != SalesReturnInboundOrder.Status.Draft &&
            inboundOrder.getStatus() != SalesReturnInboundOrder.Status.SentToWarehouse) {
            throw new IllegalStateException("Sales Return Inbound Order must be Draft or SentToWarehouse to create Goods Receipt");
        }

        // Check if Sales Return Inbound Order already has an approved Goods Receipt
        List<GoodsReceipt> existingReceipts = receiptRepository.findByReturnOrderId(inboundOrder.getReturnOrder().getRoId());
        boolean hasApprovedReceipt = existingReceipts.stream()
                .anyMatch(r -> r.getStatus() == GoodsReceipt.GoodsReceiptStatus.Approved 
                        && r.getSourceType() == GoodsReceipt.SourceType.SalesReturn
                        && r.getDeletedAt() == null);
        
        if (hasApprovedReceipt) {
            throw new IllegalStateException("Đơn nhập hàng lại này đã có phiếu nhập kho được phê duyệt. Không thể tạo phiếu nhập mới.");
        }

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + dto.getWarehouseId()));

        // Validate warehouse matches Sales Return Inbound Order warehouse
        if (!warehouse.getWarehouseId().equals(inboundOrder.getWarehouse().getWarehouseId())) {
            throw new IllegalArgumentException("Warehouse must match Sales Return Inbound Order warehouse");
        }

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdById));

        // Generate receipt number if not provided
        String receiptNo = dto.getReceiptNo();
        if (receiptNo == null || receiptNo.trim().isEmpty()) {
            receiptNo = generateReceiptNo();
        } else if (receiptRepository.existsByReceiptNo(receiptNo)) {
            throw new DuplicateResourceException("Goods Receipt number already exists: " + receiptNo);
        }

        // Create receipt entity
        GoodsReceipt receipt = GoodsReceipt.builder()
                .receiptNo(receiptNo)
                .sourceType(GoodsReceipt.SourceType.SalesReturn)
                .returnOrder(inboundOrder.getReturnOrder())
                .warehouse(warehouse)
                .receivedDate(dto.getReceivedDate() != null ? dto.getReceivedDate().toLocalDateTime() : LocalDateTime.now())
                .status(GoodsReceipt.GoodsReceiptStatus.Pending)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Load Sales Return Inbound Order items
        List<SalesReturnInboundOrderItem> inboundItems = salesReturnInboundOrderItemRepository.findByInboundOrder_SriId(sriId);
        log.info("Loaded {} inbound items for SRI ID: {}", inboundItems != null ? inboundItems.size() : 0, sriId);
        
        if (inboundItems == null || inboundItems.isEmpty()) {
            throw new IllegalStateException("Sales Return Inbound Order không có items nào");
        }

        // Create Goods Receipt items from Sales Return Inbound Order items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            log.info("Processing {} items from DTO", dto.getItems().size());
            List<GoodsReceiptItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        log.info("Processing item: roiId={}, productId={}, receivedQty={}", 
                                itemDto.getRoiId(), itemDto.getProductId(), itemDto.getReceivedQty());
                        
                        // Find corresponding SalesReturnInboundOrderItem by roiId
                        SalesReturnInboundOrderItem sriItem = inboundItems.stream()
                                .filter(item -> {
                                    if (item.getReturnOrderItem() == null) {
                                        log.warn("SalesReturnInboundOrderItem has null ReturnOrderItem");
                                        return false;
                                    }
                                    return item.getReturnOrderItem().getRoiId().equals(itemDto.getRoiId());
                                })
                                .findFirst()
                                .orElseThrow(() -> {
                                    log.error("Sales Return Inbound Order Item not found for ROI ID: {}. Available ROI IDs: {}", 
                                            itemDto.getRoiId(), 
                                            inboundItems.stream()
                                                    .map(i -> i.getReturnOrderItem() != null ? i.getReturnOrderItem().getRoiId() : "null")
                                                    .collect(Collectors.toList()));
                                    return new ResourceNotFoundException("Sales Return Inbound Order Item not found for ROI ID: " + itemDto.getRoiId());
                                });

                        ReturnOrderItem roi;
                        if (itemDto.getRoiId() != null) {
                            roi = returnOrderItemRepository.findById(itemDto.getRoiId())
                                    .orElseThrow(() -> {
                                        log.error("Return Order Item not found with ID: {}", itemDto.getRoiId());
                                        return new ResourceNotFoundException("Return Order Item not found with ID: " + itemDto.getRoiId());
                                    });
                        } else {
                            // Use roiId from sriItem if not provided in DTO
                            roi = sriItem.getReturnOrderItem();
                            if (roi == null) {
                                log.error("SalesReturnInboundOrderItem has null ReturnOrderItem");
                                throw new IllegalStateException("Sales Return Inbound Order Item không có thông tin Return Order Item");
                            }
                            log.info("Using roiId from sriItem: {}", roi.getRoiId());
                        }

                        Product product = productRepository.findById(itemDto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                        // Validate receivedQty <= plannedQty
                        if (itemDto.getReceivedQty().compareTo(sriItem.getPlannedQty()) > 0) {
                            throw new IllegalArgumentException("Received quantity cannot exceed planned quantity");
                        }

                        // For Sales Return, if acceptedQty is null or zero, default to receivedQty
                        BigDecimal acceptedQty = itemDto.getAcceptedQty();
                        if (acceptedQty == null || acceptedQty.compareTo(BigDecimal.ZERO) <= 0) {
                            acceptedQty = itemDto.getReceivedQty();
                            log.info("Setting acceptedQty = receivedQty ({}) for Sales Return item", acceptedQty);
                        }
                        
                        return GoodsReceiptItem.builder()
                                .goodsReceipt(receipt)
                                .returnOrderItem(roi)
                                .product(product)
                                .receivedQty(itemDto.getReceivedQty())
                                .acceptedQty(acceptedQty)
                                .remark(itemDto.getRemark())
                                .build();
                    })
                    .collect(Collectors.toList());
            receipt.setItems(items);
        } else {
            // Auto-create items from Sales Return Inbound Order items if not provided
            List<GoodsReceiptItem> items = inboundItems.stream()
                    .map(sriItem -> {
                        Product product = sriItem.getProduct();
                        if (product == null) {
                            throw new IllegalStateException("Sales Return Inbound Order Item không có thông tin sản phẩm");
                        }
                        ReturnOrderItem roi = sriItem.getReturnOrderItem();
                        if (roi == null) {
                            throw new IllegalStateException("Sales Return Inbound Order Item không có thông tin Return Order Item");
                        }
                        BigDecimal plannedQty = sriItem.getPlannedQty() != null ? sriItem.getPlannedQty() : BigDecimal.ZERO;
                        // For auto-created items, acceptedQty defaults to plannedQty (same as receivedQty)
                        return GoodsReceiptItem.builder()
                                .goodsReceipt(receipt)
                                .returnOrderItem(roi)
                                .product(product)
                                .receivedQty(plannedQty)
                                .acceptedQty(plannedQty) // Default to plannedQty for auto-created items
                                .remark(sriItem.getNote())
                                .build();
                    })
                    .collect(Collectors.toList());
            
            if (items.isEmpty()) {
                throw new IllegalStateException("Không thể tạo items từ Sales Return Inbound Order");
            }
            
            receipt.setItems(items);
        }

        GoodsReceipt saved = receiptRepository.save(receipt);
        GoodsReceipt savedWithRelations = receiptRepository.findByIdWithRelations(saved.getReceiptId())
                .orElse(saved);

            log.info("Goods receipt created successfully from Sales Return Inbound Order with ID: {} and number: {}", saved.getReceiptId(), saved.getReceiptNo());
            return receiptMapper.toResponseDTO(savedWithRelations);
        } catch (Exception e) {
            log.error("Error creating goods receipt from Sales Return Inbound Order ID: {}", sriId, e);
            log.error("Exception type: {}, Message: {}", e.getClass().getName(), e.getMessage());
            throw e; // Re-throw để GlobalExceptionHandler xử lý
        }
    }

    @Override
    public GoodsReceiptResponseDTO getReceiptById(Integer receiptId) {
        log.info("Fetching goods receipt ID: {}", receiptId);

        // First get basic info with relations
        GoodsReceipt receipt = receiptRepository.findByIdWithRelations(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + receiptId));

        // Then fetch items separately
        GoodsReceipt receiptWithItems = receiptRepository.findByIdWithItems(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + receiptId));
        
        // Set items to the main receipt
        receipt.setItems(receiptWithItems.getItems());

        GoodsReceiptResponseDTO dto = receiptMapper.toResponseDTO(receipt);
        dto.setHasInvoice(checkIfReceiptHasInvoice(receipt.getReceiptId()));
        
        return dto;
    }

    @Override
    public List<GoodsReceiptResponseDTO> getAllReceipts() {
        log.info("Fetching all goods receipts");

        List<GoodsReceipt> receipts = receiptRepository.findAllActive();
        return receiptMapper.toResponseDTOList(receipts);
    }

    @Override
    public Page<GoodsReceiptResponseDTO> getAllReceipts(Pageable pageable) {
        log.info("Fetching goods receipts with pagination and relations");

        Page<GoodsReceipt> receipts = receiptRepository.findAllActiveWithRelations(pageable);
        
        // Load all approved receipts for progress calculation
        List<GoodsReceipt> allApprovedReceipts = receiptRepository.findAllApprovedWithItems();
        
        return receipts.map(receipt -> {
            GoodsReceiptResponseDTO dto = receiptMapper.toResponseDTO(receipt);
            dto.setHasInvoice(checkIfReceiptHasInvoice(receipt.getReceiptId()));
            
            // Calculate total received quantity from ALL approved GRs for this Inbound Delivery
            if (receipt.getInboundDelivery() != null) {
                Integer inboundDeliveryId = receipt.getInboundDelivery().getInboundDeliveryId();
                
                // Sum all received qty from approved GRs for this Inbound Delivery
                double totalReceived = allApprovedReceipts.stream()
                        .filter(gr -> gr.getInboundDelivery() != null && 
                                     gr.getInboundDelivery().getInboundDeliveryId().equals(inboundDeliveryId))
                        .flatMap(gr -> gr.getItems().stream())
                        .mapToDouble(item -> item.getReceivedQty() != null ? item.getReceivedQty().doubleValue() : 0.0)
                        .sum();
                
                dto.setTotalReceivedQty(totalReceived);
                
                // The totalExpectedQty is already set by mapper from InboundDelivery items
            }
            
            return dto;
        });
    }
    
    private boolean checkIfReceiptHasInvoice(Integer receiptId) {
        // Only count active invoices (not Cancelled)
        return apInvoiceRepository.findByReceiptId(receiptId).stream()
                .anyMatch(inv -> inv.getStatus() != com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Cancelled);
    }

    @Override
    public List<GoodsReceiptResponseDTO> searchReceipts(String keyword) {
        log.info("Searching goods receipts with keyword: {}", keyword);

        List<GoodsReceipt> receipts = receiptRepository.searchReceipts(keyword);
        return receiptMapper.toResponseDTOList(receipts);
    }

    @Override
    public Page<GoodsReceiptResponseDTO> searchReceipts(String keyword, Pageable pageable) {
        log.info("Searching goods receipts with keyword: {} and pagination", keyword);

        Page<GoodsReceipt> receipts = receiptRepository.searchReceipts(keyword, pageable);
        
        // Load all approved receipts for progress calculation
        List<GoodsReceipt> allApprovedReceipts = receiptRepository.findAllApprovedWithItems();
        
        return receipts.map(receipt -> {
            GoodsReceiptResponseDTO dto = receiptMapper.toResponseDTO(receipt);
            dto.setHasInvoice(checkIfReceiptHasInvoice(receipt.getReceiptId()));
            
            // Calculate total received quantity from ALL approved GRs for this Inbound Delivery
            if (receipt.getInboundDelivery() != null) {
                Integer inboundDeliveryId = receipt.getInboundDelivery().getInboundDeliveryId();
                
                // Sum all received qty from approved GRs for this Inbound Delivery
                double totalReceived = allApprovedReceipts.stream()
                        .filter(gr -> gr.getInboundDelivery() != null && 
                                     gr.getInboundDelivery().getInboundDeliveryId().equals(inboundDeliveryId))
                        .flatMap(gr -> gr.getItems().stream())
                        .mapToDouble(item -> item.getReceivedQty() != null ? item.getReceivedQty().doubleValue() : 0.0)
                        .sum();
                
                dto.setTotalReceivedQty(totalReceived);
            }
            
            return dto;
        });
    }

    @Override
    public List<GoodsReceiptResponseDTO> getReceiptsByInboundDeliveryId(Integer inboundDeliveryId) {
        log.info("Fetching goods receipts for Inbound Delivery ID: {}", inboundDeliveryId);

        List<GoodsReceipt> receipts = receiptRepository.findByInboundDeliveryId(inboundDeliveryId);
        return receiptMapper.toResponseDTOList(receipts);
    }

    @Override
    public List<GoodsReceiptResponseDTO> getReceiptsByWarehouseId(Integer warehouseId) {
        log.info("Fetching goods receipts for Warehouse ID: {}", warehouseId);

        List<GoodsReceipt> receipts = receiptRepository.findByWarehouseId(warehouseId);
        return receiptMapper.toResponseDTOList(receipts);
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO updateReceipt(Integer receiptId, GoodsReceiptRequestDTO dto, Integer updatedById) {
        log.info("Updating goods receipt ID: {}", receiptId);

        GoodsReceipt receipt = receiptRepository.findById(receiptId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + receiptId));

        if (receipt.getStatus() == GoodsReceipt.GoodsReceiptStatus.Approved) {
            throw new IllegalStateException("Cannot update approved receipt");
        }

        // Update items if provided
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            // Remove existing items one by one to avoid orphan removal issues
            if (receipt.getItems() != null && !receipt.getItems().isEmpty()) {
                // Create a copy to avoid ConcurrentModificationException
                List<GoodsReceiptItem> itemsToRemove = new ArrayList<>(receipt.getItems());
                receipt.getItems().clear();
                // The orphan removal will handle deletion
            }
            
            // Create new items
            List<GoodsReceiptItem> newItems = dto.getItems().stream()
                    .map(itemDto -> {
                        InboundDeliveryItem idi = inboundDeliveryItemRepository.findById(itemDto.getIdiId())
                                .orElseThrow(() -> new ResourceNotFoundException("Inbound Delivery Item not found with ID: " + itemDto.getIdiId()));

                        Product product = productRepository.findById(itemDto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                        return GoodsReceiptItem.builder()
                                .goodsReceipt(receipt)
                                .inboundDeliveryItem(idi)
                                .product(product)
                                .receivedQty(itemDto.getReceivedQty())
                                .acceptedQty(itemDto.getAcceptedQty() != null ? itemDto.getAcceptedQty() : BigDecimal.ZERO)
                                .remark(itemDto.getRemark())
                                .build();
                    })
                    .collect(Collectors.toList());
            
            // Add new items to the existing collection
            receipt.getItems().addAll(newItems);
        }

        receipt.setUpdatedAt(LocalDateTime.now());
        GoodsReceipt saved = receiptRepository.save(receipt);
        GoodsReceipt savedWithRelations = receiptRepository.findByIdWithRelations(saved.getReceiptId())
                .orElse(saved);

        log.info("Goods receipt updated successfully");
        return receiptMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO approveReceipt(Integer receiptId, Integer approverId) {
        log.info("Approving goods receipt ID: {} by approver ID: {}", receiptId, approverId);

        // Load GR with items to update PO item received quantities
        GoodsReceipt receipt = receiptRepository.findByIdWithItems(receiptId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + receiptId));

        if (receipt.getStatus() != GoodsReceipt.GoodsReceiptStatus.Pending) {
            throw new IllegalStateException("Only pending receipts can be approved");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverId));

        receipt.setStatus(GoodsReceipt.GoodsReceiptStatus.Approved);
        receipt.setApprovedBy(approver);
        receipt.setApprovedAt(LocalDateTime.now());
        receipt.setUpdatedAt(LocalDateTime.now());

        GoodsReceipt saved = receiptRepository.save(receipt);
        
        // Load items with relations before processing
        GoodsReceipt savedWithItems = receiptRepository.findByIdWithItems(saved.getReceiptId())
                .orElseThrow(() -> new IllegalStateException("Failed to load Goods Receipt items after save"));
        
        if (savedWithItems.getItems() == null || savedWithItems.getItems().isEmpty()) {
            throw new IllegalStateException("Goods Receipt has no items to process");
        }
        
        log.info("Processing {} items for Goods Receipt ID: {}", savedWithItems.getItems().size(), saved.getReceiptId());
        
        // Handle based on source type
        if (saved.getSourceType() == GoodsReceipt.SourceType.Purchase) {
            // Update PO Items: Track received quantities through Inbound Delivery Items
            log.info("Updating PO items received_qty for {} GRN items", savedWithItems.getItems().size());
            for (GoodsReceiptItem grItem : savedWithItems.getItems()) {
                InboundDeliveryItem idiItem = grItem.getInboundDeliveryItem();
                if (idiItem != null && idiItem.getPurchaseOrderItem() != null) {
                    PurchaseOrderItem poItem = idiItem.getPurchaseOrderItem();
                    BigDecimal acceptedQty = grItem.getAcceptedQty();
                    BigDecimal currentReceived = poItem.getReceivedQty() != null ? poItem.getReceivedQty() : BigDecimal.ZERO;
                    BigDecimal newReceived = currentReceived.add(acceptedQty);
                    
                    poItem.setReceivedQty(newReceived);
                    orderItemRepository.save(poItem);
                    
                    log.info("POI {} received_qty: {} + {} = {} (ordered: {})", 
                             poItem.getPoiId(), currentReceived, acceptedQty, newReceived, poItem.getQuantity());
                    
                    // Check over-receipt
                    if (newReceived.compareTo(poItem.getQuantity()) > 0) {
                        log.warn("Over-receipt detected! POI {}: received {} > ordered {}", 
                                 poItem.getPoiId(), newReceived, poItem.getQuantity());
                    }
                }
            }
        } else if (saved.getSourceType() == GoodsReceipt.SourceType.SalesReturn) {
            // Update Return Order goods receipt status
            ReturnOrder returnOrder = saved.getReturnOrder();
            if (returnOrder != null) {
                returnOrder.setGoodsReceiptStatus(ReturnOrder.GoodsReceiptStatus.Completed);
                returnOrder.setGoodsReceipt(saved);
                returnOrderRepository.save(returnOrder);
                log.info("Updated Return Order {} goods_receipt_status to Completed", returnOrder.getRoId());
            }

            List<SalesReturnInboundOrder> inboundOrders = salesReturnInboundOrderRepository.findByReturnOrderId(returnOrder.getRoId());
            for (SalesReturnInboundOrder sri : inboundOrders) {
                if (sri.getStatus() != SalesReturnInboundOrder.Status.Completed &&
                    sri.getStatus() != SalesReturnInboundOrder.Status.Cancelled) {
                    sri.setStatus(SalesReturnInboundOrder.Status.Completed);
                    salesReturnInboundOrderRepository.save(sri);
                    log.info("Updated Sales Return Inbound Order {} status to Completed", sri.getSriId());
                }
            }
        }
        
        // Update Warehouse Stock: Increase inventory quantity (for both Purchase and SalesReturn)
        Integer warehouseId = saved.getWarehouse().getWarehouseId();
        log.info("Updating warehouse stock for warehouse ID: {}", warehouseId);
        
        for (GoodsReceiptItem grItem : savedWithItems.getItems()) {
            Integer productId = grItem.getProduct() != null ? grItem.getProduct().getProductId() : null;
            BigDecimal acceptedQty = grItem.getAcceptedQty();
            
            if (productId == null) {
                log.error("Goods Receipt Item {} has null product", grItem.getGriId());
                throw new IllegalStateException("Goods Receipt Item has null product");
            }
            
            if (acceptedQty == null || acceptedQty.compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("Goods Receipt Item {} has invalid acceptedQty: {}", grItem.getGriId(), acceptedQty);
                continue; // Skip items with zero or negative quantity
            }
            
            log.info("Processing stock update for product {} with acceptedQty {}", productId, acceptedQty);
            
            // Try to update existing stock
            int updated = warehouseStockRepository.updateStockQuantity(warehouseId, productId, acceptedQty);
            
            if (updated == 0) {
                // Stock record doesn't exist, create new one
                log.info("Creating new stock record for warehouse {} product {} with quantity {}", warehouseId, productId, acceptedQty);
                WarehouseStock newStock = new WarehouseStock();
                newStock.setWarehouseId(warehouseId);
                newStock.setProductId(productId);
                newStock.setQuantity(acceptedQty);
                warehouseStockRepository.save(newStock);
                log.info("Created stock: warehouse {} product {} quantity {}", warehouseId, productId, acceptedQty);
            } else {
                log.info("Updated stock: warehouse {} product {} +{}", warehouseId, productId, acceptedQty);
            }
        }
        
        log.info("Goods receipt approved successfully, items and warehouse stock updated");

        // Check if Inbound Delivery is fully received and update status
        if (saved.getSourceType() == GoodsReceipt.SourceType.Purchase && saved.getInboundDelivery() != null) {
            InboundDelivery inboundDelivery = saved.getInboundDelivery();
            
            // Load Inbound Delivery items to avoid lazy loading exception
            List<InboundDeliveryItem> inboundItems = inboundDeliveryItemRepository.findByInboundDeliveryId(
                    inboundDelivery.getInboundDeliveryId());
            
            // Load all approved GRs for this Inbound Delivery
            List<GoodsReceipt> allApprovedReceipts = receiptRepository.findAllApprovedWithItems();
            
            // Check if all items are fully received
            boolean allItemsFullyReceived = true;
            for (InboundDeliveryItem idiItem : inboundItems) {
                BigDecimal expectedQty = idiItem.getExpectedQty() != null ? idiItem.getExpectedQty() : BigDecimal.ZERO;
                
                // Sum received qty from all approved GRs for this item
                BigDecimal totalReceived = allApprovedReceipts.stream()
                        .filter(gr -> gr.getInboundDelivery() != null && 
                                     gr.getInboundDelivery().getInboundDeliveryId().equals(inboundDelivery.getInboundDeliveryId()))
                        .flatMap(gr -> gr.getItems().stream())
                        .filter(gri -> gri.getInboundDeliveryItem() != null && 
                                      gri.getInboundDeliveryItem().getIdiId().equals(idiItem.getIdiId()))
                        .map(gri -> gri.getReceivedQty() != null ? gri.getReceivedQty() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                if (totalReceived.compareTo(expectedQty) < 0) {
                    allItemsFullyReceived = false;
                    break;
                }
            }
            
            // Update Inbound Delivery status if all items are fully received
            if (allItemsFullyReceived) {
                log.info("All items fully received for Inbound Delivery {}. Updating status to Completed", 
                         inboundDelivery.getInboundDeliveryId());
                inboundDelivery.setStatus(InboundDelivery.InboundDeliveryStatus.Completed);
                inboundDeliveryRepository.save(inboundDelivery);
            } else {
                log.info("Inbound Delivery {} has partial receipt. Status remains Pending", 
                         inboundDelivery.getInboundDeliveryId());
            }
        }

        // Auto-create AP Invoice only for Purchase (not for SalesReturn)
        if (saved.getSourceType() == GoodsReceipt.SourceType.Purchase) {
            // Check PO completion status after receiving items
            // Access PO through InboundDelivery
            PurchaseOrder purchaseOrder = saved.getInboundDelivery() != null ? 
                    saved.getInboundDelivery().getPurchaseOrder() : null;
            
            if (purchaseOrder != null) {
                // Reload PO with items to check completion status
                PurchaseOrder poWithItems = orderRepository.findByIdWithRelations(purchaseOrder.getOrderId())
                    .orElse(purchaseOrder);
                
                boolean allItemsFullyReceived = true;
                boolean anyItemPartiallyReceived = false;
                
                for (PurchaseOrderItem poItem : poWithItems.getItems()) {
                    BigDecimal orderedQty = poItem.getQuantity();
                    BigDecimal receivedQty = poItem.getReceivedQty() != null ? poItem.getReceivedQty() : BigDecimal.ZERO;
                    
                    if (receivedQty.compareTo(orderedQty) < 0) {
                        allItemsFullyReceived = false;
                        if (receivedQty.compareTo(BigDecimal.ZERO) > 0) {
                            anyItemPartiallyReceived = true;
                        }
                    }
                }
                
                // Auto-create AP Invoice from this Goods Receipt
                try {
                    log.info("Auto-creating AP Invoice for Goods Receipt ID: {}", receiptId);
                    apInvoiceService.createInvoiceFromGoodsReceipt(receiptId);
                    log.info("AP Invoice created successfully for Goods Receipt ID: {}", receiptId);
                } catch (IllegalStateException e) {
                    log.warn("AP Invoice not created for Goods Receipt ID: {}. Reason: {}", receiptId, e.getMessage());
                } catch (Exception e) {
                    log.error("Failed to auto-create AP Invoice for Goods Receipt ID: {}. Error: {}", receiptId, e.getMessage(), e);
                }
                
                // Update PO status based on received quantities
                if (allItemsFullyReceived) {
                    log.info("All items fully received. Updating PO {} status to Completed", poWithItems.getOrderId());
                    poWithItems.setStatus(PurchaseOrderStatus.Completed);
                    orderRepository.save(poWithItems);
                } else if (anyItemPartiallyReceived) {
                    log.info("Partial delivery detected for PO {}. Status remains Sent (partially received).", poWithItems.getOrderId());
                    // Keep status as Sent - indicates delivery in progress
                }
            }
        } else {
            log.info("Skipping AP Invoice creation for SalesReturn Goods Receipt ID: {}", receiptId);
        }
        
        // Load full relations for response - split queries to avoid cartesian product
        GoodsReceipt savedWithRelations = receiptRepository.findByIdWithRelations(saved.getReceiptId())
                .orElse(saved);
        // Items already loaded in savedWithItems above, no need to reload

        return receiptMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO rejectReceipt(Integer receiptId, Integer approverId, String reason) {
        log.info("Rejecting goods receipt ID: {} by approver ID: {}", receiptId, approverId);

        GoodsReceipt receipt = receiptRepository.findById(receiptId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + receiptId));

        if (receipt.getStatus() != GoodsReceipt.GoodsReceiptStatus.Pending) {
            throw new IllegalStateException("Only pending receipts can be rejected");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverId));

        receipt.setStatus(GoodsReceipt.GoodsReceiptStatus.Rejected);
        receipt.setApprovedBy(approver);
        receipt.setApprovedAt(LocalDateTime.now());
        receipt.setUpdatedAt(LocalDateTime.now());

        GoodsReceipt saved = receiptRepository.save(receipt);
        GoodsReceipt savedWithRelations = receiptRepository.findByIdWithRelations(saved.getReceiptId())
                .orElse(saved);

        log.info("Goods receipt rejected successfully");
        return receiptMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO deleteReceipt(Integer receiptId) {
        log.info("Deleting goods receipt ID: {}", receiptId);

        GoodsReceipt receipt = receiptRepository.findById(receiptId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + receiptId));

        // Validate: Cannot delete approved receipt
        if (receipt.getStatus() == GoodsReceipt.GoodsReceiptStatus.Approved) {
            throw new IllegalStateException("Không thể xóa phiếu nhập kho đã được phê duyệt");
        }

        // Validate: Cannot delete if has active invoice (not Cancelled)
        boolean hasActiveInvoice = apInvoiceRepository.findByReceiptId(receiptId).stream()
                .anyMatch(inv -> inv.getStatus() != com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Cancelled);
        if (hasActiveInvoice) {
            throw new IllegalStateException("Không thể xóa phiếu nhập kho đã có hóa đơn");
        }

        receipt.setDeletedAt(LocalDateTime.now());
        GoodsReceipt saved = receiptRepository.save(receipt);

        log.info("Goods receipt deleted successfully");
        return receiptMapper.toResponseDTO(saved);
    }

    @Override
    public boolean existsByReceiptNo(String receiptNo) {
        return receiptRepository.existsByReceiptNo(receiptNo);
    }

    @Override
    public String generateReceiptNo() {
        String prefix = "GR" + java.time.Year.now().getValue();
        java.util.Optional<GoodsReceipt> lastReceipt = receiptRepository.findTopByReceiptNoStartingWithOrderByReceiptNoDesc(prefix);
        
        int nextNumber = 1;
        if (lastReceipt.isPresent()) {
            String lastNo = lastReceipt.get().getReceiptNo();
            try {
                String numberPart = lastNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Could not parse number from Receipt number: {}", lastNo);
            }
        }
        
        // Kiểm tra và tìm số tiếp theo nếu bị trùng
        String receiptNo;
        int maxAttempts = 100;
        int attempts = 0;
        
        do {
            receiptNo = String.format("%s%04d", prefix, nextNumber);
            if (!receiptRepository.existsByReceiptNo(receiptNo)) {
                break;
            }
            nextNumber++;
            attempts++;
            
            if (attempts >= maxAttempts) {
                log.error("Could not generate unique Receipt number after {} attempts", maxAttempts);
                throw new RuntimeException("Không thể tạo mã phiếu nhập kho duy nhất. Vui lòng thử lại sau.");
            }
        } while (true);
        
        return receiptNo;
    }
}

