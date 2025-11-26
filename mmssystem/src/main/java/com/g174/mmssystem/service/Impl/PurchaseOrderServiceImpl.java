package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.PurchaseOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseOrderResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.enums.PurchaseOrderApprovalStatus;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import com.g174.mmssystem.enums.PurchaseQuotationStatus;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.PurchaseOrderMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.EmailService;
import com.g174.mmssystem.service.IService.IPurchaseOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final RFQRepository rfqRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PurchaseQuotationItemRepository quotationItemRepository;
    private final PurchaseOrderItemRepository orderItemRepository;
    private final EmailService emailService;

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
            
            // Validate: PQ must be Approved
            if (purchaseQuotation.getStatus() != PurchaseQuotationStatus.Approved) {
                throw new IllegalStateException("Chỉ có thể tạo PO từ Purchase Quotation đã Approved (hiện tại: " + purchaseQuotation.getStatus() + ")");
            }
            
            // Validate: One PQ can only create one PO
            List<PurchaseOrder> existingOrders = orderRepository.findByPqId(dto.getPqId());
            if (existingOrders != null && !existingOrders.isEmpty()) {
                long activeOrderCount = existingOrders.stream()
                        .filter(po -> po.getDeletedAt() == null)
                        .count();
                if (activeOrderCount > 0) {
                    PurchaseOrder existing = existingOrders.stream()
                            .filter(po -> po.getDeletedAt() == null)
                            .findFirst()
                            .orElse(null);
                    String existingPoNo = existing != null ? existing.getPoNo() : "unknown";
                    throw new IllegalStateException("Purchase Quotation đã được chuyển thành PO (PO: " + existingPoNo + "). Mỗi PQ chỉ có thể tạo 1 PO duy nhất.");
                }
            }
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
                .headerDiscount(dto.getHeaderDiscount() != null ? dto.getHeaderDiscount() : BigDecimal.ZERO)
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
                                .discountPercent(itemDto.getDiscountPercent())
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
        
        // Update PQ status to "Ordered" after creating PO
        if (purchaseQuotation != null) {
            purchaseQuotation.setStatus(PurchaseQuotationStatus.Ordered);
            purchaseQuotation.setUpdatedAt(LocalDateTime.now());
            quotationRepository.save(purchaseQuotation);
            log.info("Updated Purchase Quotation {} status to Ordered", purchaseQuotation.getPqNo());
            
            // Update RFQ status to "Completed" if PO created
            RFQ rfq = purchaseQuotation.getRfq();
            if (rfq != null && rfq.getStatus() != RFQ.RFQStatus.Completed) {
                rfq.setStatus(RFQ.RFQStatus.Completed);
                rfq.setUpdatedAt(LocalDateTime.now());
                rfqRepository.save(rfq);
                log.info("Updated RFQ {} status to Completed", rfq.getRfqNo());
            }
        }
        
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
        order.setStatus(PurchaseOrderStatus.Cancelled);
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

        // Validate vendor has email before sending
        Vendor vendor = order.getVendor();
        if (vendor == null || vendor.getContact() == null || 
            vendor.getContact().getEmail() == null || vendor.getContact().getEmail().trim().isEmpty()) {
            throw new IllegalStateException("Cannot send purchase order: Vendor does not have email address. Please update vendor contact information.");
        }

        // Send email to vendor
        try {
            sendPurchaseOrderEmail(order);
            log.info("Purchase order email sent successfully to vendor: {}", vendor.getContact().getEmail());
        } catch (Exception e) {
            log.error("Failed to send purchase order email to vendor: {}", vendor.getContact().getEmail(), e);
            throw new RuntimeException("Failed to send email to vendor. Purchase order status not updated.", e);
        }

        // Only update status if email sent successfully
        order.setStatus(PurchaseOrderStatus.Sent);
        order.setUpdatedAt(LocalDateTime.now());

        PurchaseOrder saved = orderRepository.save(order);
        PurchaseOrder savedWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElse(saved);

        log.info("Purchase order sent successfully with email notification");
        return orderMapper.toResponseDTO(savedWithRelations);
    }

    private void sendPurchaseOrderEmail(PurchaseOrder order) {
        Vendor vendor = order.getVendor();
        String vendorEmail = vendor.getContact().getEmail();
        String subject = "Đơn Hàng Mua #" + order.getPoNo() + " - " + vendor.getName();
        String htmlBody = buildPurchaseOrderEmailTemplate(order);

        try {
            emailService.sendSimpleEmail(vendorEmail, subject, htmlBody);
            log.info("Email sent successfully to vendor: {}", vendorEmail);
        } catch (Exception e) {
            log.error("Error sending PO email to {}: {}", vendorEmail, e.getMessage());
            throw new RuntimeException("Failed to send email to vendor: " + vendorEmail, e);
        }
    }

    private String buildHeaderDiscountRow(PurchaseOrder order) {
        BigDecimal headerDiscount = order.getHeaderDiscount();
        if (headerDiscount == null || headerDiscount.compareTo(BigDecimal.ZERO) <= 0) {
            return "";
        }
        
        BigDecimal discountAmount = (order.getTotalBeforeTax().add(order.getTaxAmount()))
                .multiply(headerDiscount)
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        
        return String.format("""
                <tr style="background-color: #f8f9fa;">
                    <td colspan="8" style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Chiết khấu tổng đơn (%.2f%%):</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #dc3545;">-%,.0f ₫</td>
                </tr>
                """,
                headerDiscount,
                discountAmount
        );
    }

    private String buildPurchaseOrderEmailTemplate(PurchaseOrder order) {
        Vendor vendor = order.getVendor();
        List<PurchaseOrderItem> items = order.getItems();
        
        StringBuilder itemsHtml = new StringBuilder();
        int index = 1;
        for (PurchaseOrderItem item : items) {
            String productName = item.getProduct() != null ? item.getProduct().getName() : "N/A";
            BigDecimal quantity = item.getQuantity();
            BigDecimal unitPrice = item.getUnitPrice();
            BigDecimal discountPercent = item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO;
            BigDecimal taxRate = item.getTaxRate() != null ? item.getTaxRate() : BigDecimal.ZERO;
            BigDecimal taxAmount = item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO;
            BigDecimal lineTotal = item.getLineTotal();
            
            itemsHtml.append(String.format("""
                <tr>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">%d</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">%s</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">%s</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">%.0f</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">%,.0f ₫</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">%.2f%%</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">%.2f%%</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">%,.0f ₫</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">%,.0f ₫</td>
                </tr>
                """, 
                index++,
                productName,
                item.getUom() != null ? item.getUom() : "Cái",
                quantity,
                unitPrice,
                discountPercent,
                taxRate,
                taxAmount,
                lineTotal
            ));
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String deliveryDate = order.getDeliveryDate() != null ? order.getDeliveryDate().format(formatter) : "N/A";

        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
                    .info-box { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
                    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
                    .info-label { font-weight: bold; color: #666; }
                    .info-value { color: #333; }
                    table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
                    th { background-color: #667eea; color: white; padding: 12px; text-align: left; }
                    .total-row { background-color: #f8f9fa; font-weight: bold; font-size: 18px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; }
                    .note { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">📦 ĐƠN HÀNG MUA</h1>
                        <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">%s</p>
                    </div>
                    <div class="content">
                        <p style="font-size: 16px;">Kính gửi <strong>%s</strong>,</p>
                        <p>Chúng tôi xin gửi đến quý công ty đơn hàng mua với thông tin chi tiết như sau:</p>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0; color: #667eea;">📋 Thông Tin Đơn Hàng</h3>
                            <div class="info-row">
                                <span class="info-label">Số đơn hàng:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Nhà cung cấp:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Ngày giao hàng:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Điều khoản thanh toán:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row" style="border-bottom: none;">
                                <span class="info-label">Địa chỉ giao hàng:</span>
                                <span class="info-value">%s</span>
                            </div>
                        </div>
                        
                        <h3 style="color: #667eea; margin-top: 30px;">🛍️ Chi Tiết Sản Phẩm</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align: center;">STT</th>
                                    <th>Sản phẩm</th>
                                    <th style="text-align: center;">ĐVT</th>
                                    <th style="text-align: right;">Số lượng</th>
                                    <th style="text-align: right;">Đơn giá</th>
                                    <th style="text-align: center;">CK (%%)</th>
                                    <th style="text-align: center;">Thuế (%%)</th>
                                    <th style="text-align: right;">Tiền thuế</th>
                                    <th style="text-align: right;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                %s
                            </tbody>
                            <tfoot>
                                <tr style="background-color: #f8f9fa;">
                                    <td colspan="8" style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Tổng trước thuế:</td>
                                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">%,.0f ₫</td>
                                </tr>
                                <tr style="background-color: #f8f9fa;">
                                    <td colspan="8" style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Tổng thuế:</td>
                                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">%,.0f ₫</td>
                                </tr>
                                %s
                                <tr class="total-row">
                                    <td colspan="8" style="padding: 15px; text-align: right; border: 1px solid #ddd;">TỔNG CỘNG:</td>
                                    <td style="padding: 15px; text-align: right; color: #667eea; border: 1px solid #ddd;">%,.0f ₫</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <div class="note">
                            <strong>⚠️ Lưu ý:</strong>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                                <li>Vui lòng xác nhận đơn hàng trong vòng 24 giờ</li>
                                <li>Giao hàng đúng thời hạn cam kết</li>
                                <li>Đảm bảo chất lượng sản phẩm theo yêu cầu</li>
                                <li>Cung cấp đầy đủ chứng từ xuất hàng</li>
                            </ul>
                        </div>
                        
                        <p style="margin-top: 30px;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
                        <p><strong>Trân trọng,</strong><br>
                        <strong style="color: #667eea;">Hệ Thống MMS</strong></p>
                    </div>
                    <div class="footer">
                        <p style="margin: 5px 0;">Đây là email tự động, vui lòng không trả lời trực tiếp.</p>
                        <p style="margin: 5px 0;">&copy; 2025 MMS System. Bảo lưu mọi quyền.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            order.getPoNo(),
            vendor.getName(),
            order.getPoNo(),
            vendor.getName(),
            deliveryDate,
            order.getPaymentTerms() != null ? order.getPaymentTerms() : "N/A",
            order.getShippingAddress() != null ? order.getShippingAddress() : "N/A",
            itemsHtml.toString(),
            order.getTotalBeforeTax(),
            order.getTaxAmount(),
            buildHeaderDiscountRow(order),
            order.getTotalAfterTax()
        );
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

