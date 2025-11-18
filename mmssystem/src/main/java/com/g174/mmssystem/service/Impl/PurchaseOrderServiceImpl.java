package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.PurchaseOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseOrderResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.enums.PurchaseOrderApprovalStatus;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.PurchaseOrderMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IPurchaseOrderService;
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
public class PurchaseOrderServiceImpl implements IPurchaseOrderService {

    private final PurchaseOrderRepository orderRepository;
    private final PurchaseOrderMapper orderMapper;
    private final VendorRepository vendorRepository;
    private final PurchaseQuotationRepository quotationRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PurchaseQuotationItemRepository quotationItemRepository;
    private final PurchaseOrderItemRepository orderItemRepository;

    @Override
    @Transactional
    public PurchaseOrderResponseDTO createOrder(PurchaseOrderRequestDTO dto, Integer createdById) {
        log.info("Creating purchase order for Vendor ID: {}", dto.getVendorId());

        // Validate and load entities
        Vendor vendor = vendorRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + dto.getVendorId()));

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdById));

        PurchaseQuotation purchaseQuotation = null;
        if (dto.getPqId() != null) {
            purchaseQuotation = quotationRepository.findById(dto.getPqId())
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase Quotation not found with ID: " + dto.getPqId()));
        }

        // Generate PO number if not provided
        String poNo = dto.getPoNo();
        if (poNo == null || poNo.trim().isEmpty()) {
            poNo = generatePoNo();
        } else if (orderRepository.existsByPoNo(poNo)) {
            throw new DuplicateResourceException("Purchase Order number already exists: " + poNo);
        }

        // Create order entity
        PurchaseOrder order = PurchaseOrder.builder()
                .poNo(poNo)
                .vendor(vendor)
                .purchaseQuotation(purchaseQuotation)
                .orderDate(dto.getOrderDate() != null ? dto.getOrderDate() : LocalDateTime.now())
                .status(dto.getStatus() != null ? dto.getStatus() : PurchaseOrderStatus.Pending)
                .approvalStatus(dto.getApprovalStatus() != null ? dto.getApprovalStatus() : PurchaseOrderApprovalStatus.Pending)
                .paymentTerms(dto.getPaymentTerms())
                .deliveryDate(dto.getDeliveryDate())
                .shippingAddress(dto.getShippingAddress())
                .totalBeforeTax(dto.getTotalBeforeTax() != null ? dto.getTotalBeforeTax() : BigDecimal.ZERO)
                .taxAmount(dto.getTaxAmount() != null ? dto.getTaxAmount() : BigDecimal.ZERO)
                .totalAfterTax(dto.getTotalAfterTax() != null ? dto.getTotalAfterTax() : BigDecimal.ZERO)
                .createdBy(createdBy)
                .updatedBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<PurchaseOrderItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        Product product = productRepository.findById(itemDto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                        PurchaseQuotationItem pqItem = null;
                        if (itemDto.getPqItemId() != null) {
                            pqItem = quotationItemRepository.findById(itemDto.getPqItemId())
                                    .orElse(null);
                        }

                        return PurchaseOrderItem.builder()
                                .purchaseOrder(order)
                                .purchaseQuotationItem(pqItem)
                                .product(product)
                                .uom(itemDto.getUom())
                                .quantity(itemDto.getQuantity())
                                .unitPrice(itemDto.getUnitPrice())
                                .taxRate(itemDto.getTaxRate())
                                .taxAmount(itemDto.getTaxAmount())
                                .lineTotal(itemDto.getLineTotal())
                                .deliveryDate(itemDto.getDeliveryDate())
                                .note(itemDto.getNote())
                                .build();
                    })
                    .collect(Collectors.toList());
            order.setItems(items);
        }

        PurchaseOrder saved = orderRepository.save(order);
        PurchaseOrder savedWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElse(saved);

        log.info("Purchase order created successfully with ID: {} and number: {}", saved.getOrderId(), saved.getPoNo());
        return orderMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    public PurchaseOrderResponseDTO getOrderById(Integer orderId) {
        log.info("Fetching purchase order ID: {}", orderId);

        PurchaseOrder order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        return orderMapper.toResponseDTO(order);
    }

    @Override
    public List<PurchaseOrderResponseDTO> getAllOrders() {
        log.info("Fetching all purchase orders");

        List<PurchaseOrder> orders = orderRepository.findAllActive();
        return orderMapper.toResponseDTOList(orders);
    }

    @Override
    public Page<PurchaseOrderResponseDTO> getAllOrders(Pageable pageable) {
        log.info("Fetching purchase orders with pagination");

        Page<PurchaseOrder> orders = orderRepository.findAllActive(pageable);
        return orders.map(orderMapper::toResponseDTO);
    }

    @Override
    public List<PurchaseOrderResponseDTO> searchOrders(String keyword) {
        log.info("Searching purchase orders with keyword: {}", keyword);

        List<PurchaseOrder> orders = orderRepository.searchOrders(keyword);
        return orderMapper.toResponseDTOList(orders);
    }

    @Override
    public Page<PurchaseOrderResponseDTO> searchOrders(String keyword, Pageable pageable) {
        log.info("Searching purchase orders with keyword: {} and pagination", keyword);

        Page<PurchaseOrder> orders = orderRepository.searchOrders(keyword, pageable);
        return orders.map(orderMapper::toResponseDTO);
    }

    @Override
    public List<PurchaseOrderResponseDTO> getOrdersByVendorId(Integer vendorId) {
        log.info("Fetching purchase orders for Vendor ID: {}", vendorId);

        List<PurchaseOrder> orders = orderRepository.findByVendorId(vendorId);
        return orderMapper.toResponseDTOList(orders);
    }

    @Override
    public List<PurchaseOrderResponseDTO> getOrdersByPqId(Integer pqId) {
        log.info("Fetching purchase orders for Purchase Quotation ID: {}", pqId);

        List<PurchaseOrder> orders = orderRepository.findByPqId(pqId);
        return orderMapper.toResponseDTOList(orders);
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDTO updateOrder(Integer orderId, PurchaseOrderRequestDTO dto, Integer updatedById) {
        log.info("Updating purchase order ID: {}", orderId);

        PurchaseOrder order = orderRepository.findById(orderId)
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        if (order.getStatus() == PurchaseOrderStatus.Completed || order.getStatus() == PurchaseOrderStatus.Cancelled) {
            throw new IllegalStateException("Cannot update order with status: " + order.getStatus());
        }

        User updatedBy = userRepository.findById(updatedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + updatedById));

        // Update fields
        if (dto.getPaymentTerms() != null) {
            order.setPaymentTerms(dto.getPaymentTerms());
        }
        if (dto.getDeliveryDate() != null) {
            order.setDeliveryDate(dto.getDeliveryDate());
        }
        if (dto.getShippingAddress() != null) {
            order.setShippingAddress(dto.getShippingAddress());
        }
        if (dto.getTotalBeforeTax() != null) {
            order.setTotalBeforeTax(dto.getTotalBeforeTax());
        }
        if (dto.getTaxAmount() != null) {
            order.setTaxAmount(dto.getTaxAmount());
        }
        if (dto.getTotalAfterTax() != null) {
            order.setTotalAfterTax(dto.getTotalAfterTax());
        }

        // Update items if provided
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            order.getItems().clear();
            List<PurchaseOrderItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        Product product = productRepository.findById(itemDto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemDto.getProductId()));

                        PurchaseQuotationItem pqItem = null;
                        if (itemDto.getPqItemId() != null) {
                            pqItem = quotationItemRepository.findById(itemDto.getPqItemId())
                                    .orElse(null);
                        }

                        return PurchaseOrderItem.builder()
                                .purchaseOrder(order)
                                .purchaseQuotationItem(pqItem)
                                .product(product)
                                .uom(itemDto.getUom())
                                .quantity(itemDto.getQuantity())
                                .unitPrice(itemDto.getUnitPrice())
                                .taxRate(itemDto.getTaxRate())
                                .taxAmount(itemDto.getTaxAmount())
                                .lineTotal(itemDto.getLineTotal())
                                .deliveryDate(itemDto.getDeliveryDate())
                                .note(itemDto.getNote())
                                .build();
                    })
                    .collect(Collectors.toList());
            order.setItems(items);
        }

        order.setUpdatedBy(updatedBy);
        order.setUpdatedAt(LocalDateTime.now());
        PurchaseOrder saved = orderRepository.save(order);
        PurchaseOrder savedWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElse(saved);

        log.info("Purchase order updated successfully");
        return orderMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDTO approveOrder(Integer orderId, Integer approverId) {
        log.info("Approving purchase order ID: {} by approver ID: {}", orderId, approverId);

        PurchaseOrder order = orderRepository.findById(orderId)
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        if (order.getApprovalStatus() != PurchaseOrderApprovalStatus.Pending) {
            throw new IllegalStateException("Only pending orders can be approved");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverId));

        order.setApprovalStatus(PurchaseOrderApprovalStatus.Approved);
        order.setApprover(approver);
        order.setApprovedAt(LocalDateTime.now());
        order.setStatus(PurchaseOrderStatus.Approved);
        order.setUpdatedAt(LocalDateTime.now());

        PurchaseOrder saved = orderRepository.save(order);
        PurchaseOrder savedWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElse(saved);

        log.info("Purchase order approved successfully");
        return orderMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDTO rejectOrder(Integer orderId, Integer approverId, String reason) {
        log.info("Rejecting purchase order ID: {} by approver ID: {}", orderId, approverId);

        PurchaseOrder order = orderRepository.findById(orderId)
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        if (order.getApprovalStatus() != PurchaseOrderApprovalStatus.Pending) {
            throw new IllegalStateException("Only pending orders can be rejected");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverId));

        order.setApprovalStatus(PurchaseOrderApprovalStatus.Rejected);
        order.setApprover(approver);
        order.setApprovedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        PurchaseOrder saved = orderRepository.save(order);
        PurchaseOrder savedWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElse(saved);

        log.info("Purchase order rejected successfully");
        return orderMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDTO sendOrder(Integer orderId) {
        log.info("Sending purchase order ID: {}", orderId);

        PurchaseOrder order = orderRepository.findById(orderId)
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        if (order.getApprovalStatus() != PurchaseOrderApprovalStatus.Approved) {
            throw new IllegalStateException("Only approved orders can be sent");
        }

        order.setStatus(PurchaseOrderStatus.Sent);
        order.setUpdatedAt(LocalDateTime.now());

        PurchaseOrder saved = orderRepository.save(order);
        PurchaseOrder savedWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElse(saved);

        log.info("Purchase order sent successfully");
        return orderMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDTO completeOrder(Integer orderId) {
        log.info("Completing purchase order ID: {}", orderId);

        PurchaseOrder order = orderRepository.findById(orderId)
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        if (order.getStatus() != PurchaseOrderStatus.Sent) {
            throw new IllegalStateException("Only sent orders can be completed");
        }

        order.setStatus(PurchaseOrderStatus.Completed);
        order.setUpdatedAt(LocalDateTime.now());

        PurchaseOrder saved = orderRepository.save(order);
        PurchaseOrder savedWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElse(saved);

        log.info("Purchase order completed successfully");
        return orderMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDTO cancelOrder(Integer orderId) {
        log.info("Cancelling purchase order ID: {}", orderId);

        PurchaseOrder order = orderRepository.findById(orderId)
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        if (order.getStatus() == PurchaseOrderStatus.Completed) {
            throw new IllegalStateException("Cannot cancel completed order");
        }

        order.setStatus(PurchaseOrderStatus.Cancelled);
        order.setUpdatedAt(LocalDateTime.now());

        PurchaseOrder saved = orderRepository.save(order);
        PurchaseOrder savedWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElse(saved);

        log.info("Purchase order cancelled successfully");
        return orderMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDTO deleteOrder(Integer orderId) {
        log.info("Deleting purchase order ID: {}", orderId);

        PurchaseOrder order = orderRepository.findById(orderId)
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + orderId));

        order.setDeletedAt(LocalDateTime.now());
        PurchaseOrder saved = orderRepository.save(order);

        log.info("Purchase order deleted successfully");
        return orderMapper.toResponseDTO(saved);
    }

    @Override
    public boolean existsByPoNo(String poNo) {
        return orderRepository.existsByPoNo(poNo);
    }

    @Override
    public String generatePoNo() {
        String prefix = "PO" + java.time.Year.now().getValue();
        java.util.Optional<PurchaseOrder> lastOrder = orderRepository.findTopByPoNoStartingWithOrderByPoNoDesc(prefix);
        
        int nextNumber = 1;
        if (lastOrder.isPresent()) {
            String lastNo = lastOrder.get().getPoNo();
            try {
                String numberPart = lastNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Could not parse number from PO number: {}", lastNo);
            }
        }
        
        return String.format("%s%04d", prefix, nextNumber);
    }
}

