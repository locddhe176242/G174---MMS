package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.APInvoiceRequestDTO;
import com.g174.mmssystem.dto.requestDTO.APPaymentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.APInvoiceResponseDTO;
import com.g174.mmssystem.dto.responseDTO.APPaymentResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.APInvoiceMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IAPInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class APInvoiceServiceImpl implements IAPInvoiceService {

    private final APInvoiceRepository invoiceRepository;
    private final APInvoiceItemRepository invoiceItemRepository;
    private final APPaymentRepository paymentRepository;
    private final APInvoiceMapper invoiceMapper;
    private final VendorRepository vendorRepository;
    private final PurchaseOrderRepository orderRepository;
    private final GoodsReceiptRepository receiptRepository;
    private final PurchaseOrderItemRepository orderItemRepository;
    private final GoodsReceiptItemRepository receiptItemRepository;
    private final com.g174.mmssystem.service.IService.IVendorBalanceService vendorBalanceService;

    @Override
    @Transactional
    public APInvoiceResponseDTO createInvoice(APInvoiceRequestDTO dto) {
        log.info("Creating AP Invoice for Vendor ID: {} (PO: {}, GRN: {})", 
                 dto.getVendorId(), dto.getOrderId(), dto.getReceiptId());

        // Validate and load entities
        Vendor vendor = vendorRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found  " + dto.getVendorId()));

        // Optional: Link to Purchase Order (can be null for prepayment/manual invoices)
        PurchaseOrder purchaseOrder = null;
        if (dto.getOrderId() != null) {
            purchaseOrder = orderRepository.findById(dto.getOrderId())
                    .filter(o -> o.getDeletedAt() == null)
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found  " + dto.getOrderId()));
            log.info("Invoice linked to PO: {}", purchaseOrder.getPoNo());
        }

        // Optional: Link to Goods Receipt (can be null for prepayment/PO-based invoices)
        GoodsReceipt goodsReceipt = null;
        if (dto.getReceiptId() != null) {
            goodsReceipt = receiptRepository.findById(dto.getReceiptId())
                    .filter(gr -> gr.getDeletedAt() == null)
                    .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found  " + dto.getReceiptId()));
            
            // Validate: GR must be Approved
            if (goodsReceipt.getStatus() != GoodsReceipt.GoodsReceiptStatus.Approved) {
                throw new IllegalStateException("Only approved Goods Receipts can be invoiced (current status: " + goodsReceipt.getStatus() + ")");
            }
            log.info("Invoice linked to GRN: {}", goodsReceipt.getReceiptNo());
        }
        
        // Note: Both PO and GRN can be null - this allows:
        // 1. Prepayment invoices (no PO/GRN)
        // 2. Manual invoices
        // 3. Future: Consolidated invoices (multiple PO/GRN)

        // Generate invoice number if not provided
        String invoiceNo = dto.getInvoiceNo();
        if (invoiceNo == null || invoiceNo.trim().isEmpty()) {
            invoiceNo = generateInvoiceNo();
        } else if (invoiceRepository.existsByInvoiceNo(invoiceNo)) {
            throw new DuplicateResourceException("AP Invoice number already exists: " + invoiceNo);
        }

        // Create invoice entity
        APInvoice invoice = APInvoice.builder()
                .invoiceNo(invoiceNo)
                .vendor(vendor)
                .purchaseOrder(purchaseOrder)
                .goodsReceipt(goodsReceipt)
                .invoiceDate(dto.getInvoiceDate())
                .dueDate(dto.getDueDate())
                .subtotal(dto.getSubtotal() != null ? dto.getSubtotal() : BigDecimal.ZERO)
                .taxAmount(dto.getTaxAmount() != null ? dto.getTaxAmount() : BigDecimal.ZERO)
                .totalAmount(dto.getTotalAmount() != null ? dto.getTotalAmount() : BigDecimal.ZERO)
                .balanceAmount(dto.getBalanceAmount() != null ? dto.getBalanceAmount() : dto.getTotalAmount())
                .headerDiscount(dto.getHeaderDiscount() != null ? dto.getHeaderDiscount() : BigDecimal.ZERO)
                .status(dto.getStatus() != null ? dto.getStatus() : APInvoice.APInvoiceStatus.Unpaid)
                .notes(dto.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<APInvoiceItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        PurchaseOrderItem poi = null;
                        if (itemDto.getPoiId() != null) {
                            poi = orderItemRepository.findById(itemDto.getPoiId())
                                    .orElse(null);
                        }

                        GoodsReceiptItem gri = null;
                        if (itemDto.getGriId() != null) {
                            gri = receiptItemRepository.findById(itemDto.getGriId())
                                    .orElse(null);
                        }

                        return APInvoiceItem.builder()
                                .apInvoice(invoice)
                                .purchaseOrderItem(poi)
                                .goodsReceiptItem(gri)
                                .description(itemDto.getDescription())
                                .uom(itemDto.getUom())
                                .quantity(itemDto.getQuantity())
                                .unitPrice(itemDto.getUnitPrice())
                                .discountPercent(itemDto.getDiscountPercent() != null ? itemDto.getDiscountPercent() : BigDecimal.ZERO)
                                .taxRate(itemDto.getTaxRate())
                                .lineTotal(itemDto.getLineTotal())
                                .build();
                    })
                    .collect(Collectors.toList());
            invoice.setItems(items);
        }

        APInvoice saved = invoiceRepository.save(invoice);
        APInvoice savedWithRelations = invoiceRepository.findByIdWithRelations(saved.getApInvoiceId())
                .orElse(saved);

        // Update vendor balance
        try {
            vendorBalanceService.updateOnInvoiceCreated(vendor.getVendorId(), saved.getTotalAmount());
        } catch (Exception e) {
            log.error("Failed to update vendor balance for vendor {}: {}", vendor.getVendorId(), e.getMessage());
        }

        log.info("AP Invoice created successfully with ID: {} and number: {}", saved.getApInvoiceId(), saved.getInvoiceNo());
        return invoiceMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public APInvoiceResponseDTO createInvoiceFromGoodsReceipt(Integer receiptId) {
        log.info("Creating AP Invoice from Goods Receipt ID: {}", receiptId);

        // Load GR with all relations needed for invoice creation
        GoodsReceipt goodsReceipt = receiptRepository.findByIdWithRelations(receiptId)
                .filter(gr -> gr.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found  " + receiptId));
        
        // Load items separately to avoid cartesian product - reassign to get items populated
        goodsReceipt = receiptRepository.findByIdWithItems(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt items not found  " + receiptId));
        
        log.info("GR Status: {}, Items count: {}", goodsReceipt.getStatus(), 
                 goodsReceipt.getItems() != null ? goodsReceipt.getItems().size() : "NULL");

        if (goodsReceipt.getStatus() != GoodsReceipt.GoodsReceiptStatus.Approved) {
            throw new IllegalStateException("Only approved Goods Receipts can be invoiced");
        }

        // Check if active invoice already exists for this GR
        // ERP Standard: 1 Goods Receipt = 1 Active Invoice (multiple payments on that invoice)
        // Allow creating new invoice if existing one is Cancelled
        List<APInvoice> existingInvoices = invoiceRepository.findByReceiptId(receiptId);
        List<APInvoice> activeInvoices = existingInvoices.stream()
                .filter(inv -> inv.getStatus() != APInvoice.APInvoiceStatus.Cancelled)
                .toList();
        
        if (!activeInvoices.isEmpty()) {
            throw new IllegalStateException("Hóa đơn đã được tạo cho phiếu nhập kho này");
        }

        // Access PurchaseOrder directly from GoodsReceipt
        PurchaseOrder purchaseOrder = goodsReceipt.getPurchaseOrder();
        
        if (purchaseOrder == null) {
            throw new IllegalStateException("No Purchase Order found for Goods Receipt " + receiptId);
        }
        
        Vendor vendor = purchaseOrder.getVendor();
        if (vendor == null) {
            throw new IllegalStateException("Vendor not found for Purchase Order " + purchaseOrder.getOrderId());
        }

        // Get header discount from PO
        BigDecimal headerDiscountPercent = purchaseOrder.getHeaderDiscount() != null 
                ? purchaseOrder.getHeaderDiscount() : BigDecimal.ZERO;

        // Calculate totals from GR items directly (more accurate than using PO ratios)
        // This ensures correct calculation even if PO was saved with wrong values
        BigDecimal subtotalBeforeDiscount = BigDecimal.ZERO; // Tổng trước chiết khấu
        BigDecimal totalLineDiscount = BigDecimal.ZERO;
        BigDecimal subtotalAfterLineDiscount = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        
        List<APInvoiceItem> invoiceItems = new ArrayList<>();
        
        for (GoodsReceiptItem grItem : goodsReceipt.getItems()) {
            // Get PurchaseOrderItem by matching product
            PurchaseOrderItem poItem = purchaseOrder.getItems().stream()
                    .filter(item -> item.getProduct().getProductId().equals(grItem.getProduct().getProductId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Purchase Order Item not found for product: " + grItem.getProduct().getName()));
            
            BigDecimal acceptedQty = grItem.getAcceptedQty();
            BigDecimal unitPrice = poItem.getUnitPrice();
            BigDecimal lineDiscountPercent = poItem.getDiscountPercent() != null ? poItem.getDiscountPercent() : BigDecimal.ZERO;
            BigDecimal taxRate = poItem.getTaxRate() != null ? poItem.getTaxRate() : BigDecimal.ZERO;
            
            // Calculate line subtotal (before any discount)
            BigDecimal lineSubtotal = acceptedQty.multiply(unitPrice);
            subtotalBeforeDiscount = subtotalBeforeDiscount.add(lineSubtotal);
            
            // Apply line discount
            BigDecimal lineDiscountAmount = lineSubtotal.multiply(lineDiscountPercent)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal lineAfterDiscount = lineSubtotal.subtract(lineDiscountAmount);
            
            totalLineDiscount = totalLineDiscount.add(lineDiscountAmount);
            subtotalAfterLineDiscount = subtotalAfterLineDiscount.add(lineAfterDiscount);
            
            APInvoiceItem invoiceItem = APInvoiceItem.builder()
                    .purchaseOrderItem(poItem)
                    .goodsReceiptItem(grItem)
                    .description(grItem.getProduct().getName())
                    .quantity(acceptedQty)
                    .unitPrice(unitPrice)
                    .discountPercent(lineDiscountPercent)
                    .taxRate(taxRate)
                    .lineTotal(lineAfterDiscount) // Store value after line discount only
                    .build();
            
            invoiceItems.add(invoiceItem);
        }
        
        // Apply header discount on subtotal after line discounts
        BigDecimal headerDiscountAmount = subtotalAfterLineDiscount.multiply(headerDiscountPercent)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal subtotalAfterAllDiscounts = subtotalAfterLineDiscount.subtract(headerDiscountAmount);
        
        // Calculate tax on final subtotal (after all discounts)
        for (APInvoiceItem item : invoiceItems) {
            PurchaseOrderItem poItem = item.getPurchaseOrderItem();
            BigDecimal taxRate = poItem.getTaxRate() != null ? poItem.getTaxRate() : BigDecimal.ZERO;
            
            // Get line total after line discount
            BigDecimal lineAfterDiscount = item.getLineTotal();
            
            // Apply header discount proportion
            BigDecimal lineHeaderDiscountAmount = lineAfterDiscount.multiply(headerDiscountPercent)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal lineFinalAmount = lineAfterDiscount.subtract(lineHeaderDiscountAmount);
            
            // Calculate tax on final amount
            BigDecimal lineTax = lineFinalAmount.multiply(taxRate)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            
            taxAmount = taxAmount.add(lineTax);
            
            // Update lineTotal to be the amount BEFORE tax (after all discounts)
            item.setLineTotal(lineFinalAmount);
        }
        
        BigDecimal totalAmount = subtotalAfterAllDiscounts.add(taxAmount);

        // Generate invoice number
        String invoiceNo = generateInvoiceNo();

        // Create invoice
        APInvoice invoice = APInvoice.builder()
                .invoiceNo(invoiceNo)
                .vendor(vendor)
                .purchaseOrder(purchaseOrder)
                .goodsReceipt(goodsReceipt)
                .invoiceDate(goodsReceipt.getReceivedDate().toLocalDate())
                .dueDate(goodsReceipt.getReceivedDate().toLocalDate().plusDays(30)) // Default 30 days payment term
                .subtotal(subtotalBeforeDiscount) // Tổng trước chiết khấu
                .headerDiscount(headerDiscountPercent)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .balanceAmount(totalAmount)
                .status(APInvoice.APInvoiceStatus.Unpaid)
                .notes("Auto-generated from Goods Receipt: " + goodsReceipt.getReceiptNo())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Set invoice reference for items
        invoiceItems.forEach(item -> item.setApInvoice(invoice));
        invoice.setItems(invoiceItems);

        APInvoice saved = invoiceRepository.save(invoice);
        APInvoice savedWithRelations = invoiceRepository.findByIdWithRelations(saved.getApInvoiceId())
                .orElse(saved);

        // Update vendor balance
        try {
            vendorBalanceService.updateOnInvoiceCreated(vendor.getVendorId(), saved.getTotalAmount());
        } catch (Exception e) {
            log.error("Failed to update vendor balance for vendor {}: {}", vendor.getVendorId(), e.getMessage());
        }

        log.info("AP Invoice auto-created from GR: {} with invoice number: {}", goodsReceipt.getReceiptNo(), invoiceNo);
        return invoiceMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public APInvoiceResponseDTO createInvoiceFromPurchaseOrder(Integer orderId) {
        log.info("Creating AP Invoice from completed Purchase Order ID: {}", orderId);

        // Load PO with all relations
        PurchaseOrder purchaseOrder = orderRepository.findByIdWithRelations(orderId)
                .filter(po -> po.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found  " + orderId));

        // Check if PO is completed
        if (purchaseOrder.getStatus() != com.g174.mmssystem.enums.PurchaseOrderStatus.Completed) {
            throw new IllegalStateException("Only completed Purchase Orders can be invoiced");
        }

        // Check if invoice already exists for this PO
        List<APInvoice> existingInvoices = invoiceRepository.findByOrderId(orderId);
        if (!existingInvoices.isEmpty()) {
            throw new IllegalStateException("AP Invoice already exists for this Purchase Order");
        }

        // Get all approved GRs for this PO (new flow: direct PO → GR)
        List<GoodsReceipt> goodsReceipts = receiptRepository.findByPurchaseOrder_OrderIdAndDeletedAtIsNull(orderId).stream()
                .filter(gr -> gr.getStatus() == GoodsReceipt.GoodsReceiptStatus.Approved)
                .toList();

        if (goodsReceipts.isEmpty()) {
            throw new IllegalStateException("No approved Goods Receipts found for Purchase Order ID: " + orderId);
        }

        Vendor vendor = purchaseOrder.getVendor();
        if (vendor == null) {
            throw new IllegalStateException("Vendor not found for Purchase Order ID: " + orderId);
        }

        // Use PO totals (which already include all discounts and taxes)
        BigDecimal subtotal = purchaseOrder.getTotalBeforeTax();
        BigDecimal taxAmount = purchaseOrder.getTaxAmount();
        BigDecimal totalAmount = purchaseOrder.getTotalAfterTax();

        // Generate invoice number
        String invoiceNo = generateInvoiceNo();

        // Use the last GR's received date as invoice date
        GoodsReceipt lastGR = goodsReceipts.get(goodsReceipts.size() - 1);

        // Build notes with all GR numbers
        StringBuilder notesBuilder = new StringBuilder();
        notesBuilder.append("Auto-generated from completed PO: ").append(purchaseOrder.getPoNo());
        notesBuilder.append("\nBao gồm ").append(goodsReceipts.size()).append(" phiếu nhập kho: ");
        notesBuilder.append(goodsReceipts.stream()
                .map(GoodsReceipt::getReceiptNo)
                .collect(java.util.stream.Collectors.joining(", ")));
        notesBuilder.append("\nTổng giá trị: ").append(totalAmount.toString()).append(" VNĐ");

        // Create invoice
        APInvoice invoice = APInvoice.builder()
                .invoiceNo(invoiceNo)
                .vendor(vendor)
                .purchaseOrder(purchaseOrder)
                .goodsReceipt(lastGR) // Reference to last GR
                .invoiceDate(lastGR.getReceivedDate().toLocalDate())
                .dueDate(lastGR.getReceivedDate().toLocalDate().plusDays(30))
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .balanceAmount(totalAmount)
                .status(APInvoice.APInvoiceStatus.Unpaid)
                .notes(notesBuilder.toString())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create invoice items from PO items
        List<APInvoiceItem> invoiceItems = purchaseOrder.getItems().stream()
                .map(poItem -> {
                    BigDecimal quantity = poItem.getQuantity();
                    BigDecimal unitPrice = poItem.getUnitPrice();
                    BigDecimal lineTotal = poItem.getLineTotal();

                    return APInvoiceItem.builder()
                            .apInvoice(invoice)
                            .purchaseOrderItem(poItem)
                            .goodsReceiptItem(null) // No specific GR item since this covers all GRs
                            .description(poItem.getProduct().getName())
                            .quantity(quantity)
                            .unitPrice(unitPrice)
                            .lineTotal(lineTotal)
                            .build();
                })
                .toList();

        invoice.setItems(invoiceItems);

        APInvoice saved = invoiceRepository.save(invoice);
        APInvoice savedWithRelations = invoiceRepository.findByIdWithRelations(saved.getApInvoiceId())
                .orElse(saved);

        // Update vendor balance
        try {
            vendorBalanceService.updateOnInvoiceCreated(vendor.getVendorId(), saved.getTotalAmount());
        } catch (Exception e) {
            log.error("Failed to update vendor balance for vendor {}: {}", vendor.getVendorId(), e.getMessage());
        }

        log.info("AP Invoice created from completed PO: {} with invoice number: {} (covering {} GRs)", 
                 purchaseOrder.getPoNo(), invoiceNo, goodsReceipts.size());
        return invoiceMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    public APInvoiceResponseDTO getInvoiceById(Integer invoiceId) {
        APInvoice invoice = invoiceRepository.findByIdWithRelations(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("AP Invoice not found  " + invoiceId));
        return invoiceMapper.toResponseDTO(invoice);
    }

    @Override
    public List<APInvoiceResponseDTO> getAllInvoices() {
        List<APInvoice> invoices = invoiceRepository.findAllActive();
        return invoices.stream()
                .map(invoiceMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Page<APInvoiceResponseDTO> getAllInvoices(Pageable pageable) {
        Page<APInvoice> invoices = invoiceRepository.findAllActive(pageable);
        return invoices.map(invoiceMapper::toResponseDTO);
    }

    @Override
    public List<APInvoiceResponseDTO> searchInvoices(String keyword) {
        List<APInvoice> invoices = invoiceRepository.searchInvoices(keyword);
        return invoices.stream()
                .map(invoiceMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Page<APInvoiceResponseDTO> searchInvoices(String keyword, Pageable pageable) {
        Page<APInvoice> invoices = invoiceRepository.searchInvoices(keyword, pageable);
        return invoices.map(invoiceMapper::toResponseDTO);
    }

    @Override
    public List<APInvoiceResponseDTO> getInvoicesByVendorId(Integer vendorId) {
        List<APInvoice> invoices = invoiceRepository.findByVendorId(vendorId);
        return invoices.stream()
                .map(invoiceMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<APInvoiceResponseDTO> getInvoicesByOrderId(Integer orderId) {
        List<APInvoice> invoices = invoiceRepository.findByOrderId(orderId);
        return invoices.stream()
                .map(invoiceMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<APInvoiceResponseDTO> getInvoicesByReceiptId(Integer receiptId) {
        List<APInvoice> invoices = invoiceRepository.findByReceiptId(receiptId);
        return invoices.stream()
                .map(invoiceMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<APInvoiceResponseDTO> getInvoicesByStatus(APInvoice.APInvoiceStatus status) {
        List<APInvoice> invoices = invoiceRepository.findByStatus(status);
        return invoices.stream()
                .map(invoiceMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public APInvoiceResponseDTO updateInvoice(Integer invoiceId, APInvoiceRequestDTO dto) {
        log.info("Updating AP Invoice ID: {}", invoiceId);

        APInvoice invoice = invoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("AP Invoice not found  " + invoiceId));

        // Validate invoice can be edited
        if (!"Unpaid".equals(invoice.getStatus()) && !"Chưa thanh toán".equals(invoice.getStatus())) {
            throw new IllegalStateException("Không thể chỉnh sửa hóa đơn có trạng thái: " + invoice.getStatus());
        }
        if (invoice.getBalanceAmount().compareTo(invoice.getTotalAmount()) != 0) {
            throw new IllegalStateException("Không thể chỉnh sửa hóa đơn đã có thanh toán một phần");
        }

        // Update fields
        if (dto.getInvoiceDate() != null) {
            invoice.setInvoiceDate(dto.getInvoiceDate());
        }
        if (dto.getDueDate() != null) {
            invoice.setDueDate(dto.getDueDate());
        }
        if (dto.getSubtotal() != null) {
            invoice.setSubtotal(dto.getSubtotal());
        }
        if (dto.getTaxAmount() != null) {
            invoice.setTaxAmount(dto.getTaxAmount());
        }
        if (dto.getTotalAmount() != null) {
            invoice.setTotalAmount(dto.getTotalAmount());
        }
        if (dto.getBalanceAmount() != null) {
            invoice.setBalanceAmount(dto.getBalanceAmount());
        }
        if (dto.getHeaderDiscount() != null) {
            invoice.setHeaderDiscount(dto.getHeaderDiscount());
        }
        if (dto.getStatus() != null) {
            invoice.setStatus(dto.getStatus());
        }
        if (dto.getNotes() != null) {
            invoice.setNotes(dto.getNotes());
        }

        invoice.setUpdatedAt(LocalDateTime.now());

        APInvoice saved = invoiceRepository.save(invoice);
        APInvoice savedWithRelations = invoiceRepository.findByIdWithRelations(saved.getApInvoiceId())
                .orElse(saved);

        log.info("AP Invoice updated successfully");
        return invoiceMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    @Transactional
    public APInvoiceResponseDTO deleteInvoice(Integer invoiceId) {
        log.info("Deleting AP Invoice ID: {}", invoiceId);

        APInvoice invoice = invoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("AP Invoice not found  " + invoiceId));

        // Store values before delete for balance update
        Integer vendorId = invoice.getVendor().getVendorId();
        BigDecimal totalAmount = invoice.getTotalAmount();

        invoice.setDeletedAt(LocalDateTime.now());
        APInvoice saved = invoiceRepository.save(invoice);

        // Update vendor balance
        try {
            vendorBalanceService.updateOnInvoiceDeleted(vendorId, totalAmount);
        } catch (Exception e) {
            log.error("Failed to update vendor balance for vendor {}: {}", vendorId, e.getMessage());
        }

        log.info("AP Invoice deleted successfully");
        return invoiceMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public APPaymentResponseDTO addPayment(APPaymentRequestDTO dto) {
        log.info("Adding payment to AP Invoice ID: {}", dto.getApInvoiceId());

        APInvoice invoice = invoiceRepository.findById(dto.getApInvoiceId())
                .filter(inv -> inv.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("AP Invoice not found  " + dto.getApInvoiceId()));

        // Auto-generate reference number if not provided
        String referenceNo = dto.getReferenceNo();
        if (referenceNo == null || referenceNo.trim().isEmpty()) {
            referenceNo = generatePaymentReferenceNo();
            log.info("Auto-generated reference number: {}", referenceNo);
        }

        // Create payment
        APPayment payment = APPayment.builder()
                .apInvoice(invoice)
                .paymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : LocalDateTime.now())
                .amount(dto.getAmount())
                .method(dto.getMethod())
                .referenceNo(referenceNo)
                .notes(dto.getNotes())
                .createdAt(LocalDateTime.now())
                .build();

        APPayment saved = paymentRepository.save(payment);

        // Update invoice balance and status
        BigDecimal newBalance = invoice.getBalanceAmount().subtract(dto.getAmount());
        invoice.setBalanceAmount(newBalance);

        boolean invoiceFullyPaid = false;
        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setStatus(APInvoice.APInvoiceStatus.Paid);
            invoiceFullyPaid = true;
        } else if (newBalance.compareTo(invoice.getTotalAmount()) < 0) {
            invoice.setStatus(APInvoice.APInvoiceStatus.Partially_Paid);
        }

        invoice.setUpdatedAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        // Update vendor balance
        try {
            vendorBalanceService.updateOnPaymentAdded(invoice.getVendor().getVendorId(), dto.getAmount());
        } catch (Exception e) {
            log.error("Failed to update vendor balance: {}", e.getMessage());
        }

        // Update Purchase Order status to Completed if invoice is fully paid
        if (invoiceFullyPaid && invoice.getPurchaseOrder() != null) {
            PurchaseOrder po = invoice.getPurchaseOrder();
            if (po.getStatus() != com.g174.mmssystem.enums.PurchaseOrderStatus.Completed) {
                po.setStatus(com.g174.mmssystem.enums.PurchaseOrderStatus.Completed);
                po.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(po);
                log.info("Purchase Order ID {} status updated to Completed", po.getOrderId());
            }
        }

        log.info("Payment added successfully. New balance: {}", newBalance);
        return invoiceMapper.toPaymentResponseDTO(saved);
    }

    @Override
    public List<APPaymentResponseDTO> getPaymentsByInvoiceId(Integer invoiceId) {
        List<APPayment> payments = paymentRepository.findByInvoiceId(invoiceId);
        return payments.stream()
                .map(invoiceMapper::toPaymentResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<APPaymentResponseDTO> getAllPayments(String keyword, Pageable pageable) {
        log.info("Getting all payments with keyword: {}", keyword);
        
        Page<APPayment> payments = paymentRepository.findAllWithSearch(keyword, pageable);
        
        return payments.map(payment -> {
            APPaymentResponseDTO dto = new APPaymentResponseDTO();
            dto.setApPaymentId(payment.getApPaymentId());
            dto.setApInvoiceId(payment.getApInvoice().getApInvoiceId());
            dto.setInvoiceNo(payment.getApInvoice().getInvoiceNo());
            dto.setVendorId(payment.getApInvoice().getVendor().getVendorId());
            dto.setVendorName(payment.getApInvoice().getVendor().getName());
            dto.setVendorCode(payment.getApInvoice().getVendor().getVendorCode());
            dto.setPaymentDate(payment.getPaymentDate());
            dto.setAmount(payment.getAmount());
            dto.setMethod(payment.getMethod());
            dto.setReferenceNo(payment.getReferenceNo());
            dto.setNotes(payment.getNotes());
            dto.setInvoiceStatus(payment.getApInvoice().getStatus());
            dto.setCreatedAt(payment.getCreatedAt());
            return dto;
        });
    }

    @Override
    public boolean existsByInvoiceNo(String invoiceNo) {
        return invoiceRepository.existsByInvoiceNo(invoiceNo);
    }

    @Override
    public String generateInvoiceNo() {
        String prefix = "API" + java.time.Year.now().getValue();
        java.util.Optional<APInvoice> lastInvoice = invoiceRepository.findTopByInvoiceNoStartingWithOrderByInvoiceNoDesc(prefix);

        int nextNumber = 1;
        if (lastInvoice.isPresent()) {
            String lastNo = lastInvoice.get().getInvoiceNo();
            try {
                String numberPart = lastNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Could not parse number from Invoice number: {}", lastNo);
            }
        }

        // Kiểm tra và tìm số tiếp theo nếu bị trùng
        String invoiceNo;
        int maxAttempts = 100;
        int attempts = 0;
        
        do {
            invoiceNo = String.format("%s%04d", prefix, nextNumber);
            if (!invoiceRepository.existsByInvoiceNo(invoiceNo)) {
                break;
            }
            nextNumber++;
            attempts++;
            
            if (attempts >= maxAttempts) {
                log.error("Could not generate unique Invoice number after {} attempts", maxAttempts);
                throw new RuntimeException("Không thể tạo mã hóa đơn duy nhất. Vui lòng thử lại sau.");
            }
        } while (true);
        
        return invoiceNo;
    }

    /**
     * Generate unique payment reference number
     * Format: TXN{YYYYMMDDHHMMSS}{random3digits}
     */
    private String generatePaymentReferenceNo() {
        LocalDateTime now = LocalDateTime.now();
        String timestamp = now.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int random = (int) (Math.random() * 1000);
        return String.format("TXN%s%03d", timestamp, random);
    }
}
