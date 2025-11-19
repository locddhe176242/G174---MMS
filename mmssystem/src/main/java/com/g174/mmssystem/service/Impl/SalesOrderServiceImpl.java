package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.SalesOrderItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.SalesOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.SalesOrderMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.ISalesOrderService;
import com.g174.mmssystem.specification.SalesOrderSpecifications;
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
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SalesOrderServiceImpl implements ISalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final CustomerRepository customerRepository;
    private final SalesQuotationRepository salesQuotationRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final SalesOrderMapper salesOrderMapper;

    @Override
    public SalesOrderResponseDTO createOrder(SalesOrderRequestDTO request) {
        Customer customer = getCustomer(request.getCustomerId());
        SalesQuotation quotation = request.getSalesQuotationId() != null ? getQuotation(request.getSalesQuotationId()) : null;
        User currentUser = getCurrentUser();

        SalesOrder order = salesOrderMapper.toEntity(request, customer, quotation, currentUser);
        order.setSoNo(generateOrderNo());
        order.setStatus(SalesOrder.OrderStatus.Pending);
        order.setApprovalStatus(SalesOrder.ApprovalStatus.Pending);

        List<SalesOrderItem> items = buildItems(order, request.getItems());
        order.getItems().clear();
        order.getItems().addAll(items);

        recalcTotals(order, items);

        SalesOrder saved = salesOrderRepository.save(order);
        return salesOrderMapper.toResponse(saved, items);
    }

    @Override
    public SalesOrderResponseDTO updateOrder(Integer id, SalesOrderRequestDTO request) {
        SalesOrder order = getOrderEntity(id);

        if (order.getStatus() == SalesOrder.OrderStatus.Fulfilled || order.getStatus() == SalesOrder.OrderStatus.Cancelled) {
            throw new IllegalStateException("Không thể chỉnh sửa đơn hàng đã hoàn tất hoặc đã hủy");
        }

        Customer customer = getCustomer(request.getCustomerId());
        SalesQuotation quotation = request.getSalesQuotationId() != null ? getQuotation(request.getSalesQuotationId()) : null;
        User currentUser = getCurrentUser();

        salesOrderMapper.updateEntity(order, request, customer, quotation, currentUser);

        salesOrderItemRepository.deleteBySalesOrder_SoId(id);
        order.getItems().clear();
        List<SalesOrderItem> items = buildItems(order, request.getItems());
        order.getItems().addAll(items);

        recalcTotals(order, items);

        SalesOrder saved = salesOrderRepository.save(order);
        return salesOrderMapper.toResponse(saved, items);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesOrderResponseDTO getOrder(Integer id) {
        SalesOrder order = getOrderEntity(id);
        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrder_SoId(id);
        return salesOrderMapper.toResponse(order, items);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalesOrderListResponseDTO> getOrders(Integer customerId, String status, String approvalStatus, String keyword, Pageable pageable) {
        Specification<SalesOrder> spec = Specification.where(SalesOrderSpecifications.notDeleted())
                .and(SalesOrderSpecifications.hasCustomer(customerId))
                .and(SalesOrderSpecifications.hasStatus(parseStatus(status)))
                .and(SalesOrderSpecifications.hasApprovalStatus(parseApprovalStatus(approvalStatus)))
                .and(SalesOrderSpecifications.keywordLike(keyword));

        return salesOrderRepository.findAll(spec, pageable)
                .map(salesOrderMapper::toListResponse);
    }

    @Override
    public void deleteOrder(Integer id) {
        SalesOrder order = getOrderEntity(id);
        order.setDeletedAt(Instant.now());
        salesOrderRepository.save(order);
    }

    @Override
    public SalesOrderResponseDTO changeStatus(Integer id, String status, String approvalStatus) {
        SalesOrder order = getOrderEntity(id);
        SalesOrder.OrderStatus newStatus = parseStatus(status);
        SalesOrder.ApprovalStatus newApproval = parseApprovalStatus(approvalStatus);

        if (newStatus != null) {
            order.setStatus(newStatus);
        }
        if (newApproval != null) {
            order.setApprovalStatus(newApproval);
            if (newApproval == SalesOrder.ApprovalStatus.Approved) {
                order.setApprovedAt(Instant.now());
                order.setApprover(getCurrentUser());
            }
        }

        SalesOrder saved = salesOrderRepository.save(order);
        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrder_SoId(id);
        return salesOrderMapper.toResponse(saved, items);
    }

    @Override
    public SalesOrderResponseDTO createFromQuotation(Integer quotationId) {
        SalesQuotation quotation = getQuotation(quotationId);
        if (quotation.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Báo giá không tồn tại");
        }
        Customer customer = quotation.getCustomer();
        User currentUser = getCurrentUser();

        SalesOrder order = new SalesOrder();
        order.setCustomer(customer);
        order.setSalesQuotation(quotation);
        order.setOrderDate(Instant.now());
        order.setShippingAddress(null);
        order.setPaymentTerms(quotation.getPaymentTerms());
        order.setNotes(quotation.getNotes());
        order.setSoNo(generateOrderNo());
        order.setStatus(SalesOrder.OrderStatus.Pending);
        order.setApprovalStatus(SalesOrder.ApprovalStatus.Pending);
        order.setCreatedBy(currentUser);
        order.setUpdatedBy(currentUser);

        List<SalesOrderItem> items = new ArrayList<>();
        if (quotation.getItems() != null) {
            quotation.getItems().forEach(qItem -> {
                SalesOrderItem item = new SalesOrderItem();
                item.setSalesOrder(order);
                item.setProduct(qItem.getProduct());
                item.setUom(qItem.getUom());
                item.setQuantity(qItem.getQuantity());
                item.setUnitPrice(qItem.getUnitPrice());
                item.setDiscountAmount(qItem.getDiscountAmount());
                item.setTaxRate(qItem.getTaxRate());
                item.setTaxAmount(qItem.getTaxAmount());
                item.setLineTotal(qItem.getLineTotal());
                item.setNote(qItem.getNote());
                items.add(item);
            });
        }
        order.getItems().addAll(items);
        recalcTotals(order, items);

        SalesOrder saved = salesOrderRepository.save(order);
        return salesOrderMapper.toResponse(saved, items);
    }

    private List<SalesOrderItem> buildItems(SalesOrder order, List<SalesOrderItemRequestDTO> requestItems) {
        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một dòng sản phẩm");
        }
        List<SalesOrderItem> items = new ArrayList<>();
        for (SalesOrderItemRequestDTO dto : requestItems) {
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID " + dto.getProductId()));
            Warehouse warehouse = null;
            if (dto.getWarehouseId() != null) {
                warehouse = warehouseRepository.findById(dto.getWarehouseId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho ID " + dto.getWarehouseId()));
            }
            SalesOrderItem item = salesOrderMapper.toItemEntity(order, dto, product, warehouse);
            BigDecimal qty = defaultBigDecimal(dto.getQuantity(), BigDecimal.ONE);
            BigDecimal unitPrice = defaultBigDecimal(dto.getUnitPrice());
            BigDecimal discountPercent = defaultBigDecimal(dto.getDiscountPercent());
            BigDecimal discountAmount = qty.multiply(unitPrice)
                    .multiply(discountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            item.setDiscountAmount(discountAmount);
            items.add(item);
        }
        return items;
    }

    private void recalcTotals(SalesOrder order, List<SalesOrderItem> items) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SalesOrderItem item : items) {
            BigDecimal qty = defaultBigDecimal(item.getQuantity(), BigDecimal.ONE);
            BigDecimal unitPrice = defaultBigDecimal(item.getUnitPrice());
            BigDecimal baseAmount = qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

            BigDecimal discount = defaultBigDecimal(item.getDiscountAmount());
            if (discount.compareTo(baseAmount) > 0) {
                discount = baseAmount;
            }

            BigDecimal taxable = baseAmount.subtract(discount);
            BigDecimal taxRate = defaultBigDecimal(item.getTaxRate());
            BigDecimal taxAmount = taxable.multiply(taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            BigDecimal lineTotal = taxable.add(taxAmount);

            item.setTaxAmount(taxAmount);
            item.setLineTotal(lineTotal);

            subtotal = subtotal.add(taxable);
            taxTotal = taxTotal.add(taxAmount);
        }

        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setTaxAmount(taxTotal.setScale(2, RoundingMode.HALF_UP));
        order.setTotalAmount(subtotal.add(taxTotal).setScale(2, RoundingMode.HALF_UP));
    }

    private SalesOrder getOrderEntity(Integer id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Sales Order ID " + id));
        if (order.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Sales Order đã bị xóa");
        }
        return order;
    }

    private Customer getCustomer(Integer id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng ID " + id));
    }

    private SalesQuotation getQuotation(Integer id) {
        return salesQuotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo giá ID " + id));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + authentication.getName()));
    }

    private SalesOrder.OrderStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return SalesOrder.OrderStatus.valueOf(status.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private SalesOrder.ApprovalStatus parseApprovalStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return SalesOrder.ApprovalStatus.valueOf(status.trim());
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

    private String generateOrderNo() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        String candidate = "SO-" + datePart + "-" + unique;

        while (salesOrderRepository.findBySoNo(candidate) != null) {
            unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
            candidate = "SO-" + datePart + "-" + unique;
        }
        return candidate;
    }
}

