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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @Override
    @Transactional
    public APInvoiceResponseDTO createInvoice(APInvoiceRequestDTO dto) {
        log.info("Creating AP Invoice for Vendor ID: {}", dto.getVendorId());

        // Validate and load entities
        Vendor vendor = vendorRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + dto.getVendorId()));

        PurchaseOrder purchaseOrder = null;
        if (dto.getOrderId() != null) {
            purchaseOrder = orderRepository.findById(dto.getOrderId())
                    .filter(o -> o.getDeletedAt() == null)
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + dto.getOrderId()));
        }

        GoodsReceipt goodsReceipt = null;
        if (dto.getReceiptId() != null) {
            goodsReceipt = receiptRepository.findById(dto.getReceiptId())
                    .filter(gr -> gr.getDeletedAt() == null)
                    .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + dto.getReceiptId()));
            
            // Validate: GR must be Approved
            if (goodsReceipt.getStatus() != GoodsReceipt.GoodsReceiptStatus.Approved) {
                throw new IllegalStateException("Only approved Goods Receipts can be invoiced (current status: " + goodsReceipt.getStatus() + ")");
            }
        }

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
                                .quantity(itemDto.getQuantity())
                                .unitPrice(itemDto.getUnitPrice())
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
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + receiptId));
        
        // Load items separately to avoid cartesian product
        receiptRepository.findByIdWithItems(receiptId);
        
        log.info("GR Status: {}, Items count: {}", goodsReceipt.getStatus(), 
                 goodsReceipt.getItems() != null ? goodsReceipt.getItems().size() : "NULL");

        if (goodsReceipt.getStatus() != GoodsReceipt.GoodsReceiptStatus.Approved) {
            throw new IllegalStateException("Only approved Goods Receipts can be invoiced");
        }

        // Check if invoice already exists for this GR
        List<APInvoice> existingInvoices = invoiceRepository.findByReceiptId(receiptId);
        if (!existingInvoices.isEmpty()) {
            throw new IllegalStateException("AP Invoice already exists for this Goods Receipt");
        }

        PurchaseOrder purchaseOrder = goodsReceipt.getPurchaseOrder();
        if (purchaseOrder == null) {
            throw new IllegalStateException("Purchase Order not found for Goods Receipt ID: " + receiptId);
        }
        
        Vendor vendor = purchaseOrder.getVendor();
        if (vendor == null) {
            throw new IllegalStateException("Vendor not found for Purchase Order ID: " + purchaseOrder.getOrderId());
        }

        // Calculate totals from GR items
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;

        for (GoodsReceiptItem grItem : goodsReceipt.getItems()) {
            PurchaseOrderItem poItem = grItem.getPurchaseOrderItem();
            BigDecimal acceptedQty = grItem.getAcceptedQty();
            BigDecimal unitPrice = poItem.getUnitPrice();
            BigDecimal itemSubtotal = acceptedQty.multiply(unitPrice);
            subtotal = subtotal.add(itemSubtotal);

            if (poItem.getTaxRate() != null && poItem.getTaxRate().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal itemTax = itemSubtotal.multiply(poItem.getTaxRate()).divide(new BigDecimal("100"));
                taxAmount = taxAmount.add(itemTax);
            }
        }

        BigDecimal totalAmount = subtotal.add(taxAmount);

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
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .balanceAmount(totalAmount)
                .status(APInvoice.APInvoiceStatus.Unpaid)
                .notes("Auto-generated from Goods Receipt: " + goodsReceipt.getReceiptNo())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create invoice items from GR items
        List<APInvoiceItem> invoiceItems = goodsReceipt.getItems().stream()
                .map(grItem -> {
                    PurchaseOrderItem poItem = grItem.getPurchaseOrderItem();
                    BigDecimal acceptedQty = grItem.getAcceptedQty();
                    BigDecimal unitPrice = poItem.getUnitPrice();
                    BigDecimal itemSubtotal = acceptedQty.multiply(unitPrice);
                    BigDecimal itemTax = BigDecimal.ZERO;

                    if (poItem.getTaxRate() != null && poItem.getTaxRate().compareTo(BigDecimal.ZERO) > 0) {
                        itemTax = itemSubtotal.multiply(poItem.getTaxRate()).divide(new BigDecimal("100"));
                    }

                    BigDecimal lineTotal = itemSubtotal.add(itemTax);

                    return APInvoiceItem.builder()
                            .apInvoice(invoice)
                            .purchaseOrderItem(poItem)
                            .goodsReceiptItem(grItem)
                            .description(grItem.getProduct().getName())
                            .quantity(acceptedQty)
                            .unitPrice(unitPrice)
                            .taxRate(poItem.getTaxRate())
                            .lineTotal(lineTotal)
                            .build();
                })
                .collect(Collectors.toList());

        invoice.setItems(invoiceItems);

        APInvoice saved = invoiceRepository.save(invoice);
        APInvoice savedWithRelations = invoiceRepository.findByIdWithRelations(saved.getApInvoiceId())
                .orElse(saved);

        log.info("AP Invoice auto-created from GR: {} with invoice number: {}", goodsReceipt.getReceiptNo(), invoiceNo);
        return invoiceMapper.toResponseDTO(savedWithRelations);
    }

    @Override
    public APInvoiceResponseDTO getInvoiceById(Integer invoiceId) {
        APInvoice invoice = invoiceRepository.findByIdWithRelations(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("AP Invoice not found with ID: " + invoiceId));
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
                .orElseThrow(() -> new ResourceNotFoundException("AP Invoice not found with ID: " + invoiceId));

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
                .orElseThrow(() -> new ResourceNotFoundException("AP Invoice not found with ID: " + invoiceId));

        invoice.setDeletedAt(LocalDateTime.now());
        APInvoice saved = invoiceRepository.save(invoice);

        log.info("AP Invoice deleted successfully");
        return invoiceMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public APPaymentResponseDTO addPayment(APPaymentRequestDTO dto) {
        log.info("Adding payment to AP Invoice ID: {}", dto.getApInvoiceId());

        APInvoice invoice = invoiceRepository.findById(dto.getApInvoiceId())
                .filter(inv -> inv.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("AP Invoice not found with ID: " + dto.getApInvoiceId()));

        // Create payment
        APPayment payment = APPayment.builder()
                .apInvoice(invoice)
                .paymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : LocalDateTime.now())
                .amount(dto.getAmount())
                .method(dto.getMethod())
                .referenceNo(dto.getReferenceNo())
                .notes(dto.getNotes())
                .createdAt(LocalDateTime.now())
                .build();

        APPayment saved = paymentRepository.save(payment);

        // Update invoice balance and status
        BigDecimal newBalance = invoice.getBalanceAmount().subtract(dto.getAmount());
        invoice.setBalanceAmount(newBalance);

        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setStatus(APInvoice.APInvoiceStatus.Paid);
        } else if (newBalance.compareTo(invoice.getTotalAmount()) < 0) {
            invoice.setStatus(APInvoice.APInvoiceStatus.Partially_Paid);
        }

        invoice.setUpdatedAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

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

        return String.format("%s%04d", prefix, nextNumber);
    }
}
