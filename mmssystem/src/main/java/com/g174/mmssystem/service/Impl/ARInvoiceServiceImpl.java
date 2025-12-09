package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.ARInvoiceItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ARInvoiceRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ARPaymentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARPaymentResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.ARInvoiceMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IARInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ARInvoiceServiceImpl implements IARInvoiceService {

    private final ARInvoiceRepository arInvoiceRepository;
    private final ARInvoiceItemRepository arInvoiceItemRepository;
    private final ARPaymentRepository arPaymentRepository;
    private final DeliveryRepository deliveryRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ARInvoiceMapper arInvoiceMapper;
    private final CreditNoteRepository creditNoteRepository;
    private final com.g174.mmssystem.service.IService.ICustomerBalanceService customerBalanceService;

    @Override
    public ARInvoiceResponseDTO createInvoice(ARInvoiceRequestDTO request) {
        Customer customer = getCustomer(request.getCustomerId());
        SalesOrder salesOrder = request.getSalesOrderId() != null ? getSalesOrder(request.getSalesOrderId()) : null;
        Delivery delivery = request.getDeliveryId() != null ? getDelivery(request.getDeliveryId()) : null;

        if (delivery != null) {
            validateDeliveryForInvoice(delivery);
        }

        User currentUser = getCurrentUser();

        ARInvoice invoice = arInvoiceMapper.toEntity(request, customer, salesOrder, delivery, currentUser);
        invoice.setInvoiceNo(generateInvoiceNo());
        invoice.setCreatedBy(currentUser);
        invoice.setUpdatedBy(currentUser);
        invoice.setStatus(ARInvoice.InvoiceStatus.Unpaid);

        List<ARInvoiceItem> items = buildItems(invoice, request.getItems(), delivery, salesOrder);
        invoice.getItems().clear();
        invoice.getItems().addAll(items);

        recalcTotals(invoice, items);

        ARInvoice saved = arInvoiceRepository.save(invoice);

        // Cập nhật customer balance
        customerBalanceService.updateOnInvoiceCreated(customer.getCustomerId(), saved.getTotalAmount());

        return arInvoiceMapper.toResponse(saved, items, new ArrayList<>());
    }

    @Override
    public ARInvoiceResponseDTO createInvoiceFromDelivery(Integer deliveryId) {
        Delivery delivery = getDelivery(deliveryId);
        validateDeliveryForInvoice(delivery);

        SalesOrder salesOrder = delivery.getSalesOrder();
        Customer customer = salesOrder != null ? salesOrder.getCustomer() : null;
        if (customer == null) {
            throw new IllegalStateException("Delivery không có thông tin khách hàng");
        }

        User currentUser = getCurrentUser();

        ARInvoiceRequestDTO request = new ARInvoiceRequestDTO();
        request.setDeliveryId(deliveryId);
        request.setSalesOrderId(salesOrder != null ? salesOrder.getSoId() : null);
        request.setCustomerId(customer.getCustomerId());
        request.setInvoiceDate(LocalDate.now());
        request.setDueDate(LocalDate.now().plusDays(30));

        List<ARInvoiceItemRequestDTO> items = buildItemsFromDelivery(delivery);
        request.setItems(items);

        return createInvoice(request);
    }

    @Override
    public ARInvoiceResponseDTO updateInvoice(Integer invoiceId, ARInvoiceRequestDTO request) {
        // Invoice gốc không được chỉnh sửa theo nghiệp vụ ERP chuẩn
        // Nếu cần điều chỉnh, phải tạo Credit Note (hóa đơn điều chỉnh) mới
        throw new IllegalStateException("Hóa đơn gốc không được chỉnh sửa. Vui lòng tạo Credit Note (hóa đơn điều chỉnh) để điều chỉnh hóa đơn này.");
    }

    @Override
    @Transactional
    public ARInvoiceResponseDTO getInvoiceById(Integer invoiceId) {
        ARInvoice invoice = getInvoiceEntity(invoiceId);
        // Recalculate balance để đảm bảo luôn đúng
        recalculateInvoiceBalance(invoice);
        List<ARInvoiceItem> items = arInvoiceItemRepository.findByInvoice_ArInvoiceId(invoiceId);
        List<ARPayment> payments = arPaymentRepository.findByInvoice_ArInvoiceIdOrderByPaymentDateDesc(invoiceId);
        return arInvoiceMapper.toResponse(invoice, items, payments);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ARInvoiceListResponseDTO> getAllInvoices() {
        List<ARInvoice> invoices = arInvoiceRepository.findAllActiveInvoices();
        return invoices.stream()
                .map(arInvoiceMapper::toListResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteInvoice(Integer invoiceId) {
        ARInvoice invoice = getInvoiceEntity(invoiceId);

        if (invoice.getStatus() == ARInvoice.InvoiceStatus.Paid) {
            throw new IllegalStateException("Không thể xóa hóa đơn đã thanh toán");
        }

        List<ARPayment> payments = arPaymentRepository.findByInvoice_ArInvoiceId(invoiceId);
        if (!payments.isEmpty()) {
            throw new IllegalStateException("Không thể xóa hóa đơn đã có thanh toán");
        }

        // Cập nhật customer balance trước khi xóa
        customerBalanceService.updateOnInvoiceDeleted(invoice.getCustomer().getCustomerId(), invoice.getTotalAmount());

        invoice.setDeletedAt(Instant.now());
        arInvoiceRepository.save(invoice);
    }

    @Override
    public ARPaymentResponseDTO addPayment(ARPaymentRequestDTO request) {
        ARInvoice invoice = getInvoiceEntity(request.getInvoiceId());

        if (invoice.getStatus() == ARInvoice.InvoiceStatus.Paid) {
            throw new IllegalStateException("Hóa đơn đã thanh toán đủ, không thể thêm thanh toán");
        }

        if (invoice.getStatus() == ARInvoice.InvoiceStatus.Cancelled) {
            throw new IllegalStateException("Không thể thanh toán cho hóa đơn đã hủy");
        }

        BigDecimal remainingBalance = invoice.getBalanceAmount();
        if (request.getAmount().compareTo(remainingBalance) > 0) {
            throw new IllegalArgumentException(
                    String.format("Số tiền thanh toán (%,.0f) vượt quá số tiền còn nợ (%,.0f)",
                            request.getAmount(), remainingBalance));
        }

        ARPayment payment = arInvoiceMapper.toPaymentEntity(request, invoice);
        ARPayment saved = arPaymentRepository.save(payment);

        // Cập nhật customer balance
        customerBalanceService.updateOnPaymentAdded(invoice.getCustomer().getCustomerId(), request.getAmount());

        // Cập nhật balance_amount và status
        BigDecimal newBalance = invoice.getBalanceAmount().subtract(request.getAmount());
        invoice.setBalanceAmount(newBalance);

        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(ARInvoice.InvoiceStatus.Paid);
        } else {
            invoice.setStatus(ARInvoice.InvoiceStatus.PartiallyPaid);
        }

        arInvoiceRepository.save(invoice);

        return arInvoiceMapper.toPaymentResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ARPaymentResponseDTO> getPaymentsByInvoiceId(Integer invoiceId) {
        List<ARPayment> payments = arPaymentRepository.findByInvoice_ArInvoiceIdOrderByPaymentDateDesc(invoiceId);
        return payments.stream()
                .map(arInvoiceMapper::toPaymentResponse)
                .collect(Collectors.toList());
    }

    // ========== Helper Methods ==========

    private List<ARInvoiceItem> buildItems(ARInvoice invoice, List<ARInvoiceItemRequestDTO> itemDTOs,
                                           Delivery delivery, SalesOrder salesOrder) {
        List<ARInvoiceItem> items = new ArrayList<>();
        if (itemDTOs == null || itemDTOs.isEmpty()) {
            return items;
        }

        for (ARInvoiceItemRequestDTO dto : itemDTOs) {
            DeliveryItem deliveryItem = dto.getDeliveryItemId() != null ?
                    getDeliveryItem(dto.getDeliveryItemId()) : null;
            SalesOrderItem salesOrderItem = deliveryItem != null ? deliveryItem.getSalesOrderItem() :
                    (dto.getSalesOrderItemId() != null ? getSalesOrderItem(dto.getSalesOrderItemId()) : null);
            Product product = getProduct(dto.getProductId());

            ARInvoiceItem item = arInvoiceMapper.toItemEntity(invoice, dto, deliveryItem, salesOrderItem, product);
            items.add(item);
        }
        return items;
    }

    private List<ARInvoiceItemRequestDTO> buildItemsFromDelivery(Delivery delivery) {
        List<ARInvoiceItemRequestDTO> items = new ArrayList<>();
        List<DeliveryItem> deliveryItems = deliveryItemRepository.findByDelivery_DeliveryId(delivery.getDeliveryId());

        for (DeliveryItem di : deliveryItems) {
            if (di.getDeliveredQty() == null || di.getDeliveredQty().compareTo(BigDecimal.ZERO) <= 0) {
                continue; // Bỏ qua items chưa giao
            }

            SalesOrderItem soi = di.getSalesOrderItem();
            Product product = di.getProduct();

            ARInvoiceItemRequestDTO itemDTO = new ARInvoiceItemRequestDTO();
            itemDTO.setDeliveryItemId(di.getDiId());
            itemDTO.setSalesOrderItemId(soi != null ? soi.getSoiId() : null);
            itemDTO.setProductId(product != null ? product.getProductId() : null);
            itemDTO.setDescription(product != null ? product.getName() : null);
            itemDTO.setQuantity(di.getDeliveredQty());
            itemDTO.setUnitPrice(soi != null ? soi.getUnitPrice() : BigDecimal.ZERO);
            itemDTO.setTaxRate(soi != null ? soi.getTaxRate() : BigDecimal.ZERO);

            // Tính toán taxAmount và lineTotal
            BigDecimal baseTotal = itemDTO.getQuantity().multiply(itemDTO.getUnitPrice());
            BigDecimal taxAmount = baseTotal.multiply(itemDTO.getTaxRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = baseTotal.add(taxAmount);

            itemDTO.setTaxAmount(taxAmount);
            itemDTO.setLineTotal(lineTotal);

            items.add(itemDTO);
        }

        return items;
    }

    private void recalcTotals(ARInvoice invoice, List<ARInvoiceItem> items) {
        BigDecimal subtotal = items.stream()
                .map(item -> item.getQuantity().multiply(item.getUnitPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal taxAmount = items.stream()
                .map(ARInvoiceItem::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmount = subtotal.add(taxAmount);

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(totalAmount);
        invoice.setBalanceAmount(totalAmount); // Ban đầu balance = total
    }

    private void validateDeliveryForInvoice(Delivery delivery) {
        if (delivery.getStatus() != Delivery.DeliveryStatus.Delivered) {
            throw new IllegalStateException("Chỉ có thể tạo hóa đơn từ Delivery đã giao hàng (Delivered)");
        }
    }

    /**
     * Tính lại balance của Invoice từ Credit Notes và Payments
     */
    private void recalculateInvoiceBalance(ARInvoice invoice) {
        // Bắt đầu từ totalAmount
        BigDecimal balance = invoice.getTotalAmount();

        // Trừ đi tất cả Credit Notes đã áp dụng (Issued hoặc Applied)
        List<CreditNote> creditNotes = creditNoteRepository.findByInvoice_ArInvoiceIdAndDeletedAtIsNull(invoice.getArInvoiceId());
        for (CreditNote cn : creditNotes) {
            if (cn.getStatus() == CreditNote.CreditNoteStatus.Issued ||
                    cn.getStatus() == CreditNote.CreditNoteStatus.Applied) {
                balance = balance.subtract(cn.getTotalAmount());
            }
        }

        // Trừ đi tất cả Payments
        BigDecimal totalPaid = arPaymentRepository.getTotalPaidByInvoiceId(invoice.getArInvoiceId());
        if (totalPaid != null) {
            balance = balance.subtract(totalPaid);
        }

        // Đảm bảo balance không âm
        balance = balance.max(BigDecimal.ZERO);

        // Cập nhật balance
        if (invoice.getBalanceAmount().compareTo(balance) != 0) {
            log.info("Recalculating balance for Invoice {}: {} -> {}",
                    invoice.getInvoiceNo(), invoice.getBalanceAmount(), balance);
            invoice.setBalanceAmount(balance);

            // Cập nhật status nếu cần
            if (balance.compareTo(BigDecimal.ZERO) == 0) {
                if (invoice.getStatus() != ARInvoice.InvoiceStatus.Paid) {
                    invoice.setStatus(ARInvoice.InvoiceStatus.Paid);
                }
            } else if (invoice.getStatus() == ARInvoice.InvoiceStatus.Paid) {
                // Nếu đã Paid nhưng balance > 0, chuyển về PartiallyPaid
                invoice.setStatus(ARInvoice.InvoiceStatus.PartiallyPaid);
            } else if (invoice.getStatus() == ARInvoice.InvoiceStatus.Unpaid && totalPaid != null && totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                // Nếu đã có payment nhưng vẫn Unpaid, chuyển sang PartiallyPaid
                invoice.setStatus(ARInvoice.InvoiceStatus.PartiallyPaid);
            }

            arInvoiceRepository.save(invoice);
        }
    }

    private String generateInvoiceNo() {
        String prefix = "INV-";
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = String.valueOf((int) (Math.random() * 1000));
        return prefix + timestamp.substring(timestamp.length() - 6) + random;
    }

    // ========== Entity Getters ==========

    private ARInvoice getInvoiceEntity(Integer id) {
        return arInvoiceRepository.findById(id)
                .filter(inv -> inv.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + id));
    }

    private Customer getCustomer(Integer id) {
        return customerRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng với ID: " + id));
    }

    private SalesOrder getSalesOrder(Integer id) {
        return salesOrderRepository.findById(id)
                .filter(so -> so.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Sales Order với ID: " + id));
    }

    private SalesOrderItem getSalesOrderItem(Integer id) {
        return salesOrderItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Sales Order Item với ID: " + id));
    }

    private Delivery getDelivery(Integer id) {
        return deliveryRepository.findById(id)
                .filter(d -> d.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Delivery với ID: " + id));
    }

    private DeliveryItem getDeliveryItem(Integer id) {
        return deliveryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Delivery Item với ID: " + id));
    }

    private Product getProduct(Integer id) {
        return productRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Người dùng chưa đăng nhập");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + email));
    }
}
