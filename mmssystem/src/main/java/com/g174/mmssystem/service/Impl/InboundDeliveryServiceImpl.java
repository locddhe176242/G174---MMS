package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.InboundDeliveryItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.InboundDeliveryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.InboundDeliveryListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.InboundDeliveryResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.InboundDeliveryMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IInboundDeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InboundDeliveryServiceImpl implements IInboundDeliveryService {

    private final InboundDeliveryRepository inboundDeliveryRepository;
    private final InboundDeliveryItemRepository inboundDeliveryItemRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final WarehouseRepository warehouseRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final InboundDeliveryMapper inboundDeliveryMapper;

    @Override
    @Transactional
    public InboundDeliveryResponseDTO createInboundDelivery(InboundDeliveryRequestDTO requestDTO) {
        log.info("Creating Inbound Delivery for Order ID: {}, Warehouse ID: {}", 
                requestDTO.getOrderId(), requestDTO.getWarehouseId());

        // Validate Purchase Order
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(requestDTO.getOrderId())
                .filter(po -> po.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + requestDTO.getOrderId()));

        // Validate Warehouse
        Warehouse warehouse = warehouseRepository.findById(requestDTO.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + requestDTO.getWarehouseId()));

        // Validate Vendor
        Vendor vendor = vendorRepository.findById(requestDTO.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + requestDTO.getVendorId()));

        // Validate vendor matches Purchase Order vendor
        if (!vendor.getVendorId().equals(purchaseOrder.getVendor().getVendorId())) {
            throw new IllegalArgumentException("Vendor must match Purchase Order vendor");
        }

        // Get created by user
        User createdBy = null;
        if (requestDTO.getCreatedById() != null) {
            createdBy = userRepository.findById(requestDTO.getCreatedById())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + requestDTO.getCreatedById()));
        }

        // Generate Inbound Delivery number if not provided
        String inboundDeliveryNo = requestDTO.getInboundDeliveryNo();
        if (inboundDeliveryNo == null || inboundDeliveryNo.trim().isEmpty()) {
            inboundDeliveryNo = generateInboundDeliveryNo();
        } else if (inboundDeliveryRepository.existsByInboundDeliveryNo(inboundDeliveryNo)) {
            throw new DuplicateResourceException("Inbound Delivery number already exists: " + inboundDeliveryNo);
        }

        // Create Inbound Delivery entity
        InboundDelivery inboundDelivery = InboundDelivery.builder()
                .inboundDeliveryNo(inboundDeliveryNo)
                .purchaseOrder(purchaseOrder)
                .warehouse(warehouse)
                .vendor(vendor)
                .plannedDate(requestDTO.getPlannedDate())
                .shippingAddress(requestDTO.getShippingAddress())
                .status(requestDTO.getStatus() != null ? requestDTO.getStatus() : InboundDelivery.InboundDeliveryStatus.Draft)
                .notes(requestDTO.getNotes())
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create items
        if (requestDTO.getItems() != null && !requestDTO.getItems().isEmpty()) {
            List<InboundDeliveryItem> items = requestDTO.getItems().stream()
                    .map(itemDto -> createInboundDeliveryItem(inboundDelivery, itemDto))
                    .collect(Collectors.toList());
            inboundDelivery.setItems(items);
        }

        InboundDelivery saved = inboundDeliveryRepository.save(inboundDelivery);
        log.info("Inbound Delivery created successfully with ID: {} and number: {}", 
                saved.getInboundDeliveryId(), saved.getInboundDeliveryNo());

        return inboundDeliveryMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public InboundDeliveryResponseDTO createFromPurchaseOrder(Integer orderId) {
        log.info("Creating Inbound Delivery from Purchase Order ID: {}", orderId);

        // Validate Purchase Order
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(orderId)
                .filter(po -> po.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        // Get items from Purchase Order
        List<PurchaseOrderItem> poItems = purchaseOrderItemRepository.findByOrderId(orderId);
        if (poItems == null || poItems.isEmpty()) {
            throw new IllegalStateException("Purchase Order has no items");
        }

        // Create Request DTO
        InboundDeliveryRequestDTO requestDTO = InboundDeliveryRequestDTO.builder()
                .orderId(orderId)
                .warehouseId(1) // Default warehouse, should be configurable
                .vendorId(purchaseOrder.getVendor().getVendorId())
                .plannedDate(purchaseOrder.getDeliveryDate())
                .shippingAddress(purchaseOrder.getShippingAddress())
                .status(InboundDelivery.InboundDeliveryStatus.Pending)
                .items(poItems.stream()
                        .map(poi -> InboundDeliveryItemRequestDTO.builder()
                                .poiId(poi.getPoiId())
                                .productId(poi.getProduct().getProductId())
                                .expectedQty(poi.getQuantity().subtract(poi.getReceivedQty()))
                                .uom(poi.getUom())
                                .build())
                        .collect(Collectors.toList()))
                .build();

        return createInboundDelivery(requestDTO);
    }

    @Override
    public InboundDeliveryResponseDTO getInboundDeliveryById(Integer inboundDeliveryId) {
        InboundDelivery inboundDelivery = inboundDeliveryRepository.findById(inboundDeliveryId)
                .filter(id -> id.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Inbound Delivery not found with ID: " + inboundDeliveryId));

        InboundDeliveryResponseDTO dto = inboundDeliveryMapper.toResponseDTO(inboundDelivery);
        
        // Calculate receivedQty for each item by querying APPROVED GoodsReceiptItems only
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            // Fetch all approved receipts with items in one query to avoid lazy loading issues
            List<GoodsReceipt> approvedReceipts = goodsReceiptRepository.findAllApprovedWithItems();
            
            dto.getItems().forEach(itemDTO -> {
                // Sum receivedQty from approved receipts for this InboundDeliveryItem
                var receivedQty = approvedReceipts.stream()
                        .flatMap(gr -> gr.getItems().stream())
                        .filter(gri -> gri.getInboundDeliveryItem() != null && 
                                      gri.getInboundDeliveryItem().getIdiId().equals(itemDTO.getIdiId()))
                        .map(gri -> gri.getReceivedQty() != null ? gri.getReceivedQty() : java.math.BigDecimal.ZERO)
                        .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                itemDTO.setReceivedQty(receivedQty);
            });
        }
        
        return dto;
    }

    @Override
    public Page<InboundDeliveryListResponseDTO> getAllInboundDeliveries(Pageable pageable) {
        Page<InboundDelivery> page = inboundDeliveryRepository.findAllActive(pageable);
        List<GoodsReceipt> approvedReceipts = goodsReceiptRepository.findAllApprovedWithItems();
        
        return page.map(delivery -> {
            InboundDeliveryListResponseDTO dto = inboundDeliveryMapper.toListResponseDTO(delivery);
            calculateReceivedProgress(dto, delivery, approvedReceipts);
            return dto;
        });
    }

    @Override
    public List<InboundDeliveryListResponseDTO> getAllInboundDeliveriesList() {
        List<InboundDelivery> deliveries = inboundDeliveryRepository.findAllActiveList();
        List<GoodsReceipt> approvedReceipts = goodsReceiptRepository.findAllApprovedWithItems();
        
        return deliveries.stream().map(delivery -> {
            InboundDeliveryListResponseDTO dto = inboundDeliveryMapper.toListResponseDTO(delivery);
            calculateReceivedProgress(dto, delivery, approvedReceipts);
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Override
    public Page<InboundDeliveryListResponseDTO> searchInboundDeliveries(String keyword, Pageable pageable) {
        Page<InboundDelivery> page = inboundDeliveryRepository.searchByKeyword(keyword, pageable);
        List<GoodsReceipt> approvedReceipts = goodsReceiptRepository.findAllApprovedWithItems();
        
        return page.map(delivery -> {
            InboundDeliveryListResponseDTO dto = inboundDeliveryMapper.toListResponseDTO(delivery);
            calculateReceivedProgress(dto, delivery, approvedReceipts);
            return dto;
        });
    }

    // Helper method to calculate received progress
    private void calculateReceivedProgress(InboundDeliveryListResponseDTO dto, InboundDelivery delivery, List<GoodsReceipt> approvedReceipts) {
        if (delivery.getItems() != null && !delivery.getItems().isEmpty()) {
            int totalItems = delivery.getItems().size();
            int receivedItems = 0;
            
            for (var item : delivery.getItems()) {
                // Sum received qty for this item from approved receipts
                java.math.BigDecimal receivedQty = approvedReceipts.stream()
                        .flatMap(gr -> gr.getItems().stream())
                        .filter(gri -> gri.getInboundDeliveryItem() != null &&
                                      gri.getInboundDeliveryItem().getIdiId().equals(item.getIdiId()))
                        .map(gri -> gri.getReceivedQty() != null ? gri.getReceivedQty() : java.math.BigDecimal.ZERO)
                        .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                
                // Check if this item is fully received
                java.math.BigDecimal expectedQty = item.getExpectedQty() != null ? item.getExpectedQty() : java.math.BigDecimal.ZERO;
                if (receivedQty.compareTo(expectedQty) >= 0 && expectedQty.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    receivedItems++;
                }
            }
            
            dto.setTotalItems(totalItems);
            dto.setReceivedItems(receivedItems);
        }
    }


    @Override
    public List<InboundDeliveryResponseDTO> getInboundDeliveriesByOrderId(Integer orderId) {
        List<InboundDelivery> deliveries = inboundDeliveryRepository.findByPurchaseOrder_OrderIdAndDeletedAtIsNull(orderId);
        return inboundDeliveryMapper.toResponseDTOList(deliveries);
    }

    @Override
    public List<InboundDeliveryResponseDTO> getInboundDeliveriesByWarehouseId(Integer warehouseId) {
        List<InboundDelivery> deliveries = inboundDeliveryRepository.findByWarehouse_WarehouseIdAndDeletedAtIsNull(warehouseId);
        return inboundDeliveryMapper.toResponseDTOList(deliveries);
    }

    @Override
    public List<InboundDeliveryResponseDTO> getInboundDeliveriesByVendorId(Integer vendorId) {
        List<InboundDelivery> deliveries = inboundDeliveryRepository.findByVendor_VendorIdAndDeletedAtIsNull(vendorId);
        return inboundDeliveryMapper.toResponseDTOList(deliveries);
    }

    @Override
    @Transactional
    public InboundDeliveryResponseDTO updateInboundDelivery(Integer inboundDeliveryId, InboundDeliveryRequestDTO requestDTO) {
        log.info("Updating Inbound Delivery ID: {}", inboundDeliveryId);

        InboundDelivery inboundDelivery = inboundDeliveryRepository.findById(inboundDeliveryId)
                .filter(id -> id.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Inbound Delivery not found with ID: " + inboundDeliveryId));

        // Check if has Goods Receipt
        List<GoodsReceipt> goodsReceipts = goodsReceiptRepository.findByInboundDeliveryId(inboundDeliveryId);
        if (goodsReceipts != null && !goodsReceipts.isEmpty()) {
            boolean hasApprovedReceipt = goodsReceipts.stream()
                    .anyMatch(gr -> gr.getStatus() == GoodsReceipt.GoodsReceiptStatus.Approved && gr.getDeletedAt() == null);
            if (hasApprovedReceipt) {
                throw new IllegalStateException("Cannot update Inbound Delivery with approved Goods Receipt");
            }
        }

        // Update fields
        if (requestDTO.getPlannedDate() != null) {
            inboundDelivery.setPlannedDate(requestDTO.getPlannedDate());
        }
        if (requestDTO.getShippingAddress() != null) {
            inboundDelivery.setShippingAddress(requestDTO.getShippingAddress());
        }
        if (requestDTO.getStatus() != null) {
            inboundDelivery.setStatus(requestDTO.getStatus());
        }
        if (requestDTO.getNotes() != null) {
            inboundDelivery.setNotes(requestDTO.getNotes());
        }

        if (requestDTO.getUpdatedById() != null) {
            User updatedBy = userRepository.findById(requestDTO.getUpdatedById())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + requestDTO.getUpdatedById()));
            inboundDelivery.setUpdatedBy(updatedBy);
        }

        inboundDelivery.setUpdatedAt(LocalDateTime.now());

        // Update items if provided
        if (requestDTO.getItems() != null) {
            // Clear existing items to avoid orphan removal error
            inboundDelivery.getItems().clear();
            
            // Create new items
            List<InboundDeliveryItem> newItems = new ArrayList<>();
            for (InboundDeliveryItemRequestDTO itemDto : requestDTO.getItems()) {
                InboundDeliveryItem item = createInboundDeliveryItem(inboundDelivery, itemDto);
                newItems.add(item);
            }
            
            // Add all new items
            inboundDelivery.getItems().addAll(newItems);
        }

        InboundDelivery updated = inboundDeliveryRepository.save(inboundDelivery);
        log.info("Inbound Delivery updated successfully: {}", inboundDeliveryId);

        return inboundDeliveryMapper.toResponseDTO(updated);
    }

    @Override
    @Transactional
    public InboundDeliveryResponseDTO updateStatus(Integer inboundDeliveryId, String status) {
        InboundDelivery inboundDelivery = inboundDeliveryRepository.findById(inboundDeliveryId)
                .filter(id -> id.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Inbound Delivery not found with ID: " + inboundDeliveryId));

        try {
            InboundDelivery.InboundDeliveryStatus newStatus = InboundDelivery.InboundDeliveryStatus.valueOf(status);
            inboundDelivery.setStatus(newStatus);
            inboundDelivery.setUpdatedAt(LocalDateTime.now());
            
            InboundDelivery updated = inboundDeliveryRepository.save(inboundDelivery);
            return inboundDeliveryMapper.toResponseDTO(updated);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
    }

    @Override
    @Transactional
    public void deleteInboundDelivery(Integer inboundDeliveryId) {
        InboundDelivery inboundDelivery = inboundDeliveryRepository.findById(inboundDeliveryId)
                .filter(id -> id.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Inbound Delivery not found with ID: " + inboundDeliveryId));

        // Check if has Goods Receipt
        List<GoodsReceipt> goodsReceipts = goodsReceiptRepository.findByInboundDeliveryId(inboundDeliveryId);
        if (goodsReceipts != null && !goodsReceipts.isEmpty()) {
            throw new IllegalStateException("Cannot delete Inbound Delivery with Goods Receipts");
        }

        inboundDelivery.setDeletedAt(LocalDateTime.now());
        inboundDeliveryRepository.save(inboundDelivery);
        log.info("Inbound Delivery soft deleted: {}", inboundDeliveryId);
    }

    @Override
    @Transactional
    public InboundDeliveryResponseDTO cancelInboundDelivery(Integer inboundDeliveryId) {
        InboundDelivery inboundDelivery = inboundDeliveryRepository.findById(inboundDeliveryId)
                .filter(id -> id.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Inbound Delivery not found with ID: " + inboundDeliveryId));

        if (inboundDelivery.getStatus() == InboundDelivery.InboundDeliveryStatus.Completed) {
            throw new IllegalStateException("Cannot cancel completed Inbound Delivery");
        }

        inboundDelivery.setStatus(InboundDelivery.InboundDeliveryStatus.Cancelled);
        inboundDelivery.setUpdatedAt(LocalDateTime.now());

        InboundDelivery updated = inboundDeliveryRepository.save(inboundDelivery);
        return inboundDeliveryMapper.toResponseDTO(updated);
    }

    // Helper methods

    private InboundDeliveryItem createInboundDeliveryItem(InboundDelivery inboundDelivery, InboundDeliveryItemRequestDTO itemDto) {
        PurchaseOrderItem purchaseOrderItem = purchaseOrderItemRepository.findById(itemDto.getPoiId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order Item not found with ID: " + itemDto.getPoiId()));

        Product product = productRepository.findById(itemDto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

        return InboundDeliveryItem.builder()
                .inboundDelivery(inboundDelivery)
                .purchaseOrderItem(purchaseOrderItem)
                .product(product)
                .expectedQty(itemDto.getExpectedQty())
                .uom(itemDto.getUom())
                .notes(itemDto.getNotes())
                .build();
    }

    private String generateInboundDeliveryNo() {
        String prefix = "ID" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        return inboundDeliveryRepository.findTopByInboundDeliveryNoStartingWithOrderByInboundDeliveryNoDesc(prefix)
                .map(id -> {
                    String lastNo = id.getInboundDeliveryNo();
                    int sequenceNumber = Integer.parseInt(lastNo.substring(prefix.length())) + 1;
                    return prefix + String.format("%04d", sequenceNumber);
                })
                .orElse(prefix + "0001");
    }

    @Override
    public String generateUniqueInboundDeliveryNo() {
        String prefix = "ID" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        
        // Tìm số cuối cùng kể cả đã xóa mềm để tránh duplicate
        return inboundDeliveryRepository.findTopByInboundDeliveryNoStartingWithIncludingDeletedOrderByInboundDeliveryNoDesc(prefix)
                .map(id -> {
                    String lastNo = id.getInboundDeliveryNo();
                    int sequenceNumber = Integer.parseInt(lastNo.substring(prefix.length())) + 1;
                    String newNo = prefix + String.format("%04d", sequenceNumber);
                    
                    // Double check: nếu vẫn tồn tại thì tăng tiếp
                    int attempts = 0;
                    while (inboundDeliveryRepository.existsByInboundDeliveryNo(newNo) && attempts < 1000) {
                        sequenceNumber++;
                        newNo = prefix + String.format("%04d", sequenceNumber);
                        attempts++;
                    }
                    
                    return newNo;
                })
                .orElse(prefix + "0001");
    }
}
