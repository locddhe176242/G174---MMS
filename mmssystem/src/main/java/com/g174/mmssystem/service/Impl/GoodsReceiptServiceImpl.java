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

    @Override
    @Transactional
    public GoodsReceiptResponseDTO createReceipt(GoodsReceiptRequestDTO dto, Integer createdById) {
        log.info("Creating goods receipt for Order ID: {}, Warehouse ID: {}", dto.getOrderId(), dto.getWarehouseId());

        // Validate and load entities
        PurchaseOrder purchaseOrder = orderRepository.findById(dto.getOrderId())
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + dto.getOrderId()));

        // Allow multiple GRs for partial deliveries - removed the single GR restriction
        log.info("Allowing multiple goods receipts for PO {} to support partial deliveries", dto.getOrderId());

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + dto.getWarehouseId()));

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
                .purchaseOrder(purchaseOrder)
                .warehouse(warehouse)
                .receivedDate(dto.getReceivedDate() != null ? dto.getReceivedDate() : LocalDateTime.now())
                .status(GoodsReceipt.GoodsReceiptStatus.Pending)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<GoodsReceiptItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        PurchaseOrderItem poi = orderItemRepository.findById(itemDto.getPoiId())
                                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order Item not found with ID: " + itemDto.getPoiId()));

                        Product product = productRepository.findById(itemDto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                        return GoodsReceiptItem.builder()
                                .goodsReceipt(receipt)
                                .purchaseOrderItem(poi)
                                .product(product)
                                .receivedQty(itemDto.getReceivedQty())
                                .acceptedQty(itemDto.getAcceptedQty() != null ? itemDto.getAcceptedQty() : BigDecimal.ZERO)
                                .remark(itemDto.getRemark())
                                .build();
                    })
                    .collect(Collectors.toList());
            receipt.setItems(items);
        }

        GoodsReceipt saved = receiptRepository.save(receipt);
        GoodsReceipt savedWithRelations = receiptRepository.findByIdWithRelations(saved.getReceiptId())
                .orElse(saved);

        log.info("Goods receipt created successfully with ID: {} and number: {}", saved.getReceiptId(), saved.getReceiptNo());
        return receiptMapper.toResponseDTO(savedWithRelations);
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
        return receipts.map(receipt -> {
            // Ensure PO items are loaded for progress calculation
            if (receipt.getPurchaseOrder() != null && receipt.getPurchaseOrder().getOrderId() != null) {
                PurchaseOrder po = orderRepository.findByIdWithRelations(receipt.getPurchaseOrder().getOrderId())
                    .orElse(receipt.getPurchaseOrder());
                receipt.setPurchaseOrder(po);
            }
            
            GoodsReceiptResponseDTO dto = receiptMapper.toResponseDTO(receipt);
            dto.setHasInvoice(checkIfReceiptHasInvoice(receipt.getReceiptId()));
            return dto;
        });
    }
    
    private boolean checkIfReceiptHasInvoice(Integer receiptId) {
        return !apInvoiceRepository.findByReceiptId(receiptId).isEmpty();
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
        return receipts.map(receiptMapper::toResponseDTO);
    }

    @Override
    public List<GoodsReceiptResponseDTO> getReceiptsByOrderId(Integer orderId) {
        log.info("Fetching goods receipts for Order ID: {}", orderId);

        List<GoodsReceipt> receipts = receiptRepository.findByOrderId(orderId);
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
            receipt.getItems().clear();
            List<GoodsReceiptItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        PurchaseOrderItem poi = orderItemRepository.findById(itemDto.getPoiId())
                                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order Item not found with ID: " + itemDto.getPoiId()));

                        Product product = productRepository.findById(itemDto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                        return GoodsReceiptItem.builder()
                                .goodsReceipt(receipt)
                                .purchaseOrderItem(poi)
                                .product(product)
                                .receivedQty(itemDto.getReceivedQty())
                                .acceptedQty(itemDto.getAcceptedQty() != null ? itemDto.getAcceptedQty() : BigDecimal.ZERO)
                                .remark(itemDto.getRemark())
                                .build();
                    })
                    .collect(Collectors.toList());
            receipt.setItems(items);
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
        
        // Update PO Items: Track received quantities
        log.info("Updating PO items received_qty for {} GRN items", saved.getItems().size());
        for (GoodsReceiptItem grItem : saved.getItems()) {
            PurchaseOrderItem poItem = grItem.getPurchaseOrderItem();
            if (poItem != null) {
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
        
        // Update Warehouse Stock: Increase inventory quantity
        Integer warehouseId = saved.getWarehouse().getWarehouseId();
        log.info("Updating warehouse stock for warehouse ID: {}", warehouseId);
        
        for (GoodsReceiptItem grItem : saved.getItems()) {
            Integer productId = grItem.getProduct().getProductId();
            BigDecimal acceptedQty = grItem.getAcceptedQty();
            
            // Try to update existing stock
            int updated = warehouseStockRepository.updateStockQuantity(warehouseId, productId, acceptedQty);
            
            if (updated == 0) {
                // Stock record doesn't exist, create new one
                log.info("Creating new stock record for warehouse {} product {}", warehouseId, productId);
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
        
        // Check PO completion status after receiving items
        PurchaseOrder purchaseOrder = saved.getPurchaseOrder();
        boolean allItemsFullyReceived = true;
        boolean anyItemPartiallyReceived = false;
        
        for (PurchaseOrderItem poItem : purchaseOrder.getItems()) {
            BigDecimal orderedQty = poItem.getQuantity();
            BigDecimal receivedQty = poItem.getReceivedQty() != null ? poItem.getReceivedQty() : BigDecimal.ZERO;
            
            if (receivedQty.compareTo(orderedQty) < 0) {
                allItemsFullyReceived = false;
                if (receivedQty.compareTo(BigDecimal.ZERO) > 0) {
                    anyItemPartiallyReceived = true;
                }
            }
        }
        
        // Update PO status based on received quantities
        if (allItemsFullyReceived) {
            log.info("All items fully received. Updating PO {} status to Completed", purchaseOrder.getOrderId());
            purchaseOrder.setStatus(PurchaseOrderStatus.Completed);
            orderRepository.save(purchaseOrder);
            
            // Auto-create AP Invoice when PO is completed (all items received)
            // Invoice will include ALL goods receipts of this PO
            try {
                log.info("Auto-creating AP Invoice for completed PO ID: {} (includes all GRs)", purchaseOrder.getOrderId());
                apInvoiceService.createInvoiceFromPurchaseOrder(purchaseOrder.getOrderId());
                log.info("AP Invoice created successfully for completed PO ID: {}", purchaseOrder.getOrderId());
            } catch (IllegalStateException e) {
                log.warn("AP Invoice not created for PO ID: {}. Reason: {}", purchaseOrder.getOrderId(), e.getMessage());
            } catch (Exception e) {
                log.error("Failed to auto-create AP Invoice for PO ID: {}. Error: {}", purchaseOrder.getOrderId(), e.getMessage(), e);
            }
        } else if (anyItemPartiallyReceived) {
            log.info("Partial delivery detected for PO {}. Status remains Sent (partially received). Invoice will be created when fully received.", purchaseOrder.getOrderId());
            // Keep status as Sent - indicates delivery in progress
            // Invoice will NOT be created until all items are received
        }
        
        log.info("Goods receipt approved successfully, PO items and warehouse stock updated");
        
        // Load full relations for response - split queries to avoid cartesian product
        GoodsReceipt savedWithRelations = receiptRepository.findByIdWithRelations(saved.getReceiptId())
                .orElse(saved);
        receiptRepository.findByIdWithItems(saved.getReceiptId()); // Load items separately

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

        // Validate: Cannot delete if has invoice
        boolean hasInvoice = !apInvoiceRepository.findByReceiptId(receiptId).isEmpty();
        if (hasInvoice) {
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

