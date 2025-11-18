package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.GoodsReceiptRequestDTO;
import com.g174.mmssystem.dto.responseDTO.GoodsReceiptResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.GoodsReceiptMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IGoodsReceiptService;
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

    @Override
    @Transactional
    public GoodsReceiptResponseDTO createReceipt(GoodsReceiptRequestDTO dto, Integer createdById) {
        log.info("Creating goods receipt for Order ID: {}, Warehouse ID: {}", dto.getOrderId(), dto.getWarehouseId());

        // Validate and load entities
        PurchaseOrder purchaseOrder = orderRepository.findById(dto.getOrderId())
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + dto.getOrderId()));

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

        GoodsReceipt receipt = receiptRepository.findByIdWithRelations(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + receiptId));

        return receiptMapper.toResponseDTO(receipt);
    }

    @Override
    public List<GoodsReceiptResponseDTO> getAllReceipts() {
        log.info("Fetching all goods receipts");

        List<GoodsReceipt> receipts = receiptRepository.findAllActive();
        return receiptMapper.toResponseDTOList(receipts);
    }

    @Override
    public Page<GoodsReceiptResponseDTO> getAllReceipts(Pageable pageable) {
        log.info("Fetching goods receipts with pagination");

        Page<GoodsReceipt> receipts = receiptRepository.findAllActive(pageable);
        return receipts.map(receiptMapper::toResponseDTO);
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

        GoodsReceipt receipt = receiptRepository.findById(receiptId)
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
        GoodsReceipt savedWithRelations = receiptRepository.findByIdWithRelations(saved.getReceiptId())
                .orElse(saved);

        log.info("Goods receipt approved successfully");
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
        
        return String.format("%s%04d", prefix, nextNumber);
    }
}

