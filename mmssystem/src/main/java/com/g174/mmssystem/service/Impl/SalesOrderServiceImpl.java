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
import com.g174.mmssystem.service.EmailService;
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
    private final DeliveryRepository deliveryRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final ARInvoiceRepository arInvoiceRepository;
    private final EmailService emailService;

    @Override
    public SalesOrderResponseDTO createOrder(SalesOrderRequestDTO request) {
        Customer customer = getCustomer(request.getCustomerId());
        SalesQuotation quotation = request.getSalesQuotationId() != null ? getQuotation(request.getSalesQuotationId())
                : null;
        User currentUser = getCurrentUser();

        SalesOrder order = salesOrderMapper.toEntity(request, customer, quotation, currentUser);
        order.setSoNo(generateOrderNo());
        order.setStatus(SalesOrder.OrderStatus.Draft);
        order.setApprovalStatus(SalesOrder.ApprovalStatus.Draft);

        List<SalesOrderItem> items = buildItems(order, request.getItems());
        order.getItems().clear();
        order.getItems().addAll(items);

        recalcTotals(order, items);

        SalesOrder saved = salesOrderRepository.save(order);

        // Nếu tạo SO có liên kết với SQ thì đánh dấu SQ đã được chuyển đổi
        if (quotation != null && quotation.getDeletedAt() == null) {
            if (quotation.getStatus() == SalesQuotation.QuotationStatus.Active ||
                    quotation.getStatus() == SalesQuotation.QuotationStatus.Draft) {
                quotation.setStatus(SalesQuotation.QuotationStatus.Converted);
                salesQuotationRepository.save(quotation);
            }
        }

        return salesOrderMapper.toResponse(saved, items);
    }

    @Override
    public SalesOrderResponseDTO updateOrder(Integer id, SalesOrderRequestDTO request) {
        SalesOrder order = getOrderEntity(id);

        // Không cho sửa khi đã hoàn tất hoặc đã hủy
        if (order.getStatus() == SalesOrder.OrderStatus.Fulfilled
                || order.getStatus() == SalesOrder.OrderStatus.Cancelled) {
            throw new IllegalStateException("Không thể chỉnh sửa đơn hàng đã hoàn tất hoặc đã hủy");
        }

        // Không cho sửa khi đã có Delivery (trừ khi tất cả Delivery đều Cancelled)
        List<Delivery> deliveries = deliveryRepository.findBySalesOrder_SoIdAndDeletedAtIsNull(id);
        boolean hasActiveDelivery = deliveries.stream()
                .anyMatch(d -> d.getStatus() != Delivery.DeliveryStatus.Cancelled);
        if (hasActiveDelivery) {
            throw new IllegalStateException("Không thể chỉnh sửa đơn hàng đã có phiếu giao hàng");
        }

        // Không cho sửa khi đã có AR Invoice
        List<ARInvoice> invoices = arInvoiceRepository.findBySalesOrder_SoIdAndDeletedAtIsNull(id);
        if (!invoices.isEmpty()) {
            throw new IllegalStateException("Không thể chỉnh sửa đơn hàng đã có hóa đơn");
        }

        // Nếu đã gửi khách (Approved) và không phải Manager -> chặn
        if (order.getApprovalStatus() == SalesOrder.ApprovalStatus.Approved) {
            boolean isManager = isManager();
            if (!isManager) {
                throw new IllegalStateException("Đơn hàng đã gửi khách, chỉ Manager mới được sửa.");
            }
            log.warn("Manager {} đang chỉnh sửa đơn hàng đã gửi khách: {}",
                    getCurrentUser().getEmail(), order.getSoNo());
        }

        Customer customer = getCustomer(request.getCustomerId());
        SalesQuotation quotation = request.getSalesQuotationId() != null ? getQuotation(request.getSalesQuotationId())
                : null;
        User currentUser = getCurrentUser();

        salesOrderMapper.updateEntity(order, request, customer, quotation, currentUser);

        salesOrderItemRepository.deleteBySalesOrder_SoId(id);
        order.getItems().clear();
        List<SalesOrderItem> items = buildItems(order, request.getItems());
        order.getItems().addAll(items);

        recalcTotals(order, items);

        SalesOrder saved = salesOrderRepository.save(order);

        // Nếu cập nhật SO có liên kết với SQ thì đảm bảo SQ được đánh dấu đã chuyển đổi
        if (quotation != null && quotation.getDeletedAt() == null) {
            if (quotation.getStatus() == SalesQuotation.QuotationStatus.Active ||
                    quotation.getStatus() == SalesQuotation.QuotationStatus.Draft) {
                quotation.setStatus(SalesQuotation.QuotationStatus.Converted);
                salesQuotationRepository.save(quotation);
            }
        }

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
    public Page<SalesOrderListResponseDTO> getOrders(Integer customerId, String status, String keyword,
            Pageable pageable) {
        Specification<SalesOrder> spec = Specification.where(SalesOrderSpecifications.notDeleted())
                .and(SalesOrderSpecifications.hasCustomer(customerId))
                .and(SalesOrderSpecifications.hasStatus(parseStatus(status)))
                .and(SalesOrderSpecifications.keywordLike(keyword));

        return salesOrderRepository.findAll(spec, pageable)
                .map(salesOrderMapper::toListResponse)
                .map(this::enrichListDtoWithRelations);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesOrderListResponseDTO> getAllOrders(Integer customerId, String status, String keyword) {
        Specification<SalesOrder> spec = Specification.where(SalesOrderSpecifications.notDeleted())
                .and(SalesOrderSpecifications.hasCustomer(customerId))
                .and(SalesOrderSpecifications.hasStatus(parseStatus(status)))
                .and(SalesOrderSpecifications.keywordLike(keyword));

        return salesOrderRepository.findAll(spec).stream()
                .map(salesOrderMapper::toListResponse)
                .map(this::enrichListDtoWithRelations)
                .collect(Collectors.toList());
    }

    private SalesOrderListResponseDTO enrichListDtoWithRelations(SalesOrderListResponseDTO dto) {
        if (dto == null || dto.getOrderId() == null)
            return dto;
        Integer soId = dto.getOrderId();
        boolean hasDelivery = !deliveryRepository.findBySalesOrder_SoIdAndDeletedAtIsNull(soId).isEmpty();
        boolean hasInvoice = !arInvoiceRepository.findBySalesOrder_SoIdAndDeletedAtIsNull(soId).isEmpty();
        dto.setHasDelivery(hasDelivery);
        dto.setHasInvoice(hasInvoice);

        // Check xem đơn hàng đã giao hết hàng chưa (tất cả items đều remainingQty <= 0)
        boolean isFullyDelivered = true;
        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrder_SoId(soId);
        if (items != null && !items.isEmpty()) {
            for (SalesOrderItem item : items) {
                BigDecimal quantity = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                BigDecimal deliveredQty = deliveryItemRepository.sumDeliveredQtyBySalesOrderItem(item.getSoiId());
                if (deliveredQty == null) {
                    deliveredQty = BigDecimal.ZERO;
                }
                BigDecimal remainingQty = quantity.subtract(deliveredQty);
                if (remainingQty.compareTo(BigDecimal.ZERO) > 0) {
                    isFullyDelivered = false;
                    break;
                }
            }
        } else {
            // Nếu không có items thì coi như chưa giao hết
            isFullyDelivered = false;
        }
        dto.setIsFullyDelivered(isFullyDelivered);

        return dto;
    }

    @Override
    public void deleteOrder(Integer id) {
        SalesOrder order = getOrderEntity(id);
        User currentUser = getCurrentUser();
        boolean isManager = isManager();
        SalesQuotation linkedQuotation = order.getSalesQuotation();
        Integer linkedQuotationId = linkedQuotation != null ? linkedQuotation.getSqId() : null;

        // Nếu không phải Manager: chỉ cho xóa SO Draft do chính mình tạo
        if (!isManager) {
            if (order.getApprovalStatus() != SalesOrder.ApprovalStatus.Draft) {
                throw new IllegalStateException("Chỉ có thể xóa đơn hàng ở trạng thái Draft");
            }
            Integer createdById = order.getCreatedBy() != null ? order.getCreatedBy().getId() : null;
            Integer currentUserId = currentUser != null ? currentUser.getId() : null;
            if (createdById == null || currentUserId == null || !createdById.equals(currentUserId)) {
                throw new IllegalStateException("Bạn chỉ có thể xóa đơn hàng Draft do bạn tạo");
            }
        }

        // Không cho xóa khi đã có Delivery (trừ khi tất cả Delivery đều Cancelled)
        List<Delivery> deliveries = deliveryRepository.findBySalesOrder_SoIdAndDeletedAtIsNull(id);
        boolean hasActiveDelivery = deliveries.stream()
                .anyMatch(d -> d.getStatus() != Delivery.DeliveryStatus.Cancelled);
        if (hasActiveDelivery) {
            throw new IllegalStateException("Không thể xóa đơn hàng đã có phiếu giao hàng");
        }

        // Không cho xóa khi đã có AR Invoice
        List<ARInvoice> invoices = arInvoiceRepository.findBySalesOrder_SoIdAndDeletedAtIsNull(id);
        if (!invoices.isEmpty()) {
            throw new IllegalStateException("Không thể xóa đơn hàng đã có hóa đơn");
        }

        // Nếu đã gửi khách (Approved) và không phải Manager -> chặn
        if (order.getApprovalStatus() == SalesOrder.ApprovalStatus.Approved) {
            if (!isManager) {
                throw new IllegalStateException("Đơn hàng đã gửi khách, chỉ Manager mới được xóa.");
            }
            log.warn("Manager {} đang xóa đơn hàng đã gửi khách: {}",
                    getCurrentUser().getEmail(), order.getSoNo());
        }

        order.setDeletedAt(Instant.now());
        salesOrderRepository.save(order);

        // Nếu SO bị xóa và trước đó SQ đã bị đánh dấu Converted, thì cho phép dùng lại
        // SQ
        // Điều kiện: SQ còn tồn tại và không còn SO active nào khác tham chiếu SQ này
        if (linkedQuotationId != null) {
            SalesQuotation quotation = getQuotation(linkedQuotationId);
            if (quotation.getDeletedAt() == null && quotation.getStatus() == SalesQuotation.QuotationStatus.Converted) {
                List<SalesOrder> remainingOrders = salesOrderRepository.findBySalesQuotationId(linkedQuotationId);
                if (remainingOrders == null || remainingOrders.isEmpty()) {
                    // Trả về Active để có thể import lại sang SO
                    quotation.setStatus(SalesQuotation.QuotationStatus.Active);
                    salesQuotationRepository.save(quotation);
                }
            }
        }
    }

    @Override
    public SalesOrderResponseDTO sendToCustomer(Integer id) {
        SalesOrder order = getOrderEntity(id);

        // Chỉ gửi khi đang Draft
        if (order.getApprovalStatus() != SalesOrder.ApprovalStatus.Draft) {
            throw new IllegalStateException("Chỉ có thể gửi khách khi đơn hàng ở trạng thái Draft");
        }

        order.setApprovalStatus(SalesOrder.ApprovalStatus.Approved);
        order.setStatus(SalesOrder.OrderStatus.Approved);
        order.setApprovedAt(Instant.now());
        order.setApprover(getCurrentUser());

        SalesOrder saved = salesOrderRepository.save(order);
        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrder_SoId(id);

        // Gửi email cho khách
        sendOrderEmailIfPossible(saved, items);

        return salesOrderMapper.toResponse(saved, items);
    }

    @Override
    public SalesOrderResponseDTO createFromQuotation(Integer quotationId) {
        SalesQuotation quotation = getQuotation(quotationId);
        if (quotation.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Báo giá không tồn tại");
        }

        // Check: Quotation phải ở Draft hoặc Active
        if (quotation.getStatus() != SalesQuotation.QuotationStatus.Draft &&
                quotation.getStatus() != SalesQuotation.QuotationStatus.Active) {
            throw new IllegalStateException(
                    "Chỉ có thể tạo đơn hàng từ báo giá ở trạng thái Draft hoặc Active");
        }

        Customer customer = quotation.getCustomer();
        User currentUser = getCurrentUser();

        SalesOrder order = new SalesOrder();
        order.setCustomer(customer);
        order.setSalesQuotation(quotation);
        order.setOrderDate(Instant.now());
        order.setShippingAddress(null);
        order.setPaymentTerms(quotation.getPaymentTerms());
        order.setDeliveryTerms(quotation.getDeliveryTerms());
        order.setNotes(quotation.getNotes());
        order.setHeaderDiscountPercent(defaultBigDecimal(quotation.getHeaderDiscountPercent()));
        order.setSoNo(generateOrderNo());
        order.setStatus(SalesOrder.OrderStatus.Draft);
        order.setApprovalStatus(SalesOrder.ApprovalStatus.Draft);
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

        // Sau khi tạo Sales Order thành công, chuyển Quotation sang Converted
        quotation.setStatus(SalesQuotation.QuotationStatus.Converted);
        salesQuotationRepository.save(quotation);

        return salesOrderMapper.toResponse(saved, items);
    }

    private List<SalesOrderItem> buildItems(SalesOrder order, List<SalesOrderItemRequestDTO> requestItems) {
        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một dòng sản phẩm");
        }
        List<SalesOrderItem> items = new ArrayList<>();
        for (SalesOrderItemRequestDTO dto : requestItems) {
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID " + dto.getProductId()));
            Warehouse warehouse = null;
            if (dto.getWarehouseId() != null) {
                warehouse = warehouseRepository.findById(dto.getWarehouseId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Không tìm thấy kho ID " + dto.getWarehouseId()));
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

    private boolean isManager() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null &&
                authentication.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));
    }

    private void sendOrderEmailIfPossible(SalesOrder order, List<SalesOrderItem> items) {
        try {
            Customer customer = order.getCustomer();
            if (customer == null || customer.getContact() == null
                    || !StringUtils.hasText(customer.getContact().getEmail())) {
                log.warn("Skip sending sales order email: missing customer email for SO {}", order.getSoNo());
                return;
            }
            String toEmail = customer.getContact().getEmail().trim();
            String subject = String.format("[Sales Order %s] Gửi đơn hàng", order.getSoNo());

            java.text.NumberFormat nf = java.text.NumberFormat
                    .getInstance(new java.util.Locale("vi", "VN"));

            StringBuilder rows = new StringBuilder();
            int idx = 1;
            for (SalesOrderItem item : items) {
                Product product = item.getProduct();
                String code = product != null && product.getSku() != null ? product.getSku() : "";
                String name = product != null && product.getName() != null ? product.getName() : "";

                String qty = item.getQuantity() != null ? nf.format(item.getQuantity()) : "0";
                String unitPrice = item.getUnitPrice() != null ? nf.format(item.getUnitPrice()) : "0";
                
                // Tính discountPercent từ discountAmount
                BigDecimal baseAmount = (item.getQuantity() != null && item.getUnitPrice() != null) 
                    ? item.getQuantity().multiply(item.getUnitPrice()) : BigDecimal.ZERO;
                BigDecimal discountAmount = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal discountPercent = BigDecimal.ZERO;
                if (baseAmount.compareTo(BigDecimal.ZERO) > 0) {
                    discountPercent = discountAmount
                        .multiply(BigDecimal.valueOf(100))
                        .divide(baseAmount, 2, RoundingMode.HALF_UP);
                }
                String discountPercentStr = discountPercent.toPlainString() + "%%";
                
                String taxRate = item.getTaxRate() != null ? item.getTaxRate().toPlainString() + "%%" : "0%%";
                String lineTotal = item.getLineTotal() != null ? nf.format(item.getLineTotal()) : "0";

                rows.append(
                        """
                                <tr>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:center; width:40px;">%d</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:left;">%s<br/><span style="color:#6b7280; font-size:12px;">%s</span></td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:center; width:80px;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:right; width:120px;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:center; width:100px;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:center; width:70px;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:right; width:130px; font-weight:bold;">%s</td>
                                </tr>
                                """
                                .formatted(idx++, code, name, qty, unitPrice, discountPercentStr, taxRate, lineTotal));
            }

            String total = order.getTotalAmount() != null ? nf.format(order.getTotalAmount()) : "0";
            String customerName = (customer.getFirstName() + " " + customer.getLastName()).trim();
            String paymentTerms = order.getPaymentTerms() != null ? order.getPaymentTerms() : "Không có";
            String deliveryTerms = order.getDeliveryTerms() != null ? order.getDeliveryTerms() : "Không có";
            String headerDiscountPercent = order.getHeaderDiscountPercent() != null 
                ? order.getHeaderDiscountPercent().toPlainString() + "%%" : "0%%";

            String html = """
                    <html>
                    <body style="font-family: Arial, sans-serif; color: #333; line-height:1.5;">
                      <h2 style="color:#1f2937;">Gửi đơn bán hàng: %s</h2>
                      <p>Kính gửi <strong>%s</strong>,</p>
                      <p>Chúng tôi gửi tới quý khách đơn bán hàng số <strong>%s</strong>.</p>
                      <ul style="margin:12px 0 0 18px; padding:0; font-size:14px;">
                        <li><strong>Điều khoản thanh toán:</strong> %s</li>
                        <li><strong>Điều khoản giao hàng:</strong> %s</li>
                      </ul>
                      <table style="border-collapse:collapse; width:100%%; margin-top:16px; font-size:14px;">
                        <thead>
                          <tr style="background:#2563eb; color:#fff;">
                            <th style="padding:10px 12px; border:1px solid #1d4ed8; width:40px;">#</th>
                            <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:left;">Sản phẩm</th>
                            <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:center; width:80px;">Số lượng</th>
                            <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:right; width:120px;">Đơn giá (VND)</th>
                            <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:center; width:100px;">Chiết khấu (%%)</th>
                            <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:center; width:70px;">Thuế (%%)</th>
                            <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:right; width:130px;">Thành tiền (VND)</th>
                          </tr>
                        </thead>
                        <tbody>
                          %s
                        </tbody>
                      </table>
                      <div style="margin-top:20px; font-size:14px; text-align:right;">
                        <p><strong>Chiết khấu cả đơn:</strong> %s</p>
                        <p style="margin-top:8px; font-size:16px;"><strong>Tổng cộng: %s VND</strong></p>
                      </div>
                      <hr style="margin:20px 0; border:none; border-top:1px solid #e5e7eb;"/>
                      <p style="color:#6b7280;">Nếu cần chỉnh sửa, vui lòng phản hồi email này.</p>
                      <p>Trân trọng,<br/><strong>MMS System</strong></p>
                    </body>
                    </html>
                    """.formatted(order.getSoNo(), customerName, order.getSoNo(), paymentTerms, deliveryTerms,
                            rows.toString(), headerDiscountPercent, total);

            emailService.sendHtmlEmail(toEmail, subject, html);
        } catch (Exception e) {
            log.error("Failed to send sales order email for {}: {}", order.getSoNo(), e.getMessage(), e);
        }
    }

    private void recalcTotals(SalesOrder order, List<SalesOrderItem> items) {
        BigDecimal lineSubtotalSum = BigDecimal.ZERO; // sau chiết khấu dòng
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SalesOrderItem item : items) {
            BigDecimal qty = defaultBigDecimal(item.getQuantity(), BigDecimal.ONE);
            BigDecimal unitPrice = defaultBigDecimal(item.getUnitPrice());
            BigDecimal baseAmount = qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

            BigDecimal discount = defaultBigDecimal(item.getDiscountAmount());
            if (discount.compareTo(baseAmount) > 0) {
                discount = baseAmount;
            }

            BigDecimal lineSubtotal = baseAmount.subtract(discount); // sau CK dòng, trước CK chung
            item.setLineTotal(lineSubtotal); // tạm lưu, sẽ cập nhật lại sau CK chung + thuế

            lineSubtotalSum = lineSubtotalSum.add(lineSubtotal);
        }

        BigDecimal headerDiscountPercent = defaultBigDecimal(order.getHeaderDiscountPercent());
        BigDecimal headerDiscountAmount = lineSubtotalSum
                .multiply(headerDiscountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Phân bổ chiết khấu chung theo tỷ lệ lineSubtotal để tính thuế chính xác
        for (SalesOrderItem item : items) {
            BigDecimal lineSubtotal = defaultBigDecimal(item.getLineTotal());
            BigDecimal allocHeaderDiscount = BigDecimal.ZERO;
            if (lineSubtotalSum.compareTo(BigDecimal.ZERO) > 0) {
                allocHeaderDiscount = lineSubtotal
                        .multiply(headerDiscountAmount)
                        .divide(lineSubtotalSum, 2, RoundingMode.HALF_UP);
            }

            BigDecimal lineTaxable = lineSubtotal.subtract(allocHeaderDiscount);
            if (lineTaxable.compareTo(BigDecimal.ZERO) < 0) {
                lineTaxable = BigDecimal.ZERO;
            }

            BigDecimal taxRate = defaultBigDecimal(item.getTaxRate());
            BigDecimal taxAmount = lineTaxable.multiply(taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            BigDecimal lineTotal = lineTaxable.add(taxAmount);

            item.setTaxAmount(taxAmount);
            item.setLineTotal(lineTotal);

            taxTotal = taxTotal.add(taxAmount);
        }

        BigDecimal subtotal = lineSubtotalSum.setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = lineSubtotalSum
                .subtract(headerDiscountAmount)
                .add(taxTotal)
                .setScale(2, RoundingMode.HALF_UP);

        order.setSubtotal(subtotal);
        order.setHeaderDiscountAmount(headerDiscountAmount);
        order.setTaxAmount(taxTotal.setScale(2, RoundingMode.HALF_UP));
        order.setTotalAmount(total);
        // Lưu lại để trả ra FE
        order.setHeaderDiscountAmount(headerDiscountAmount.setScale(2, RoundingMode.HALF_UP));
        order.setHeaderDiscountPercent(headerDiscountPercent.setScale(2, RoundingMode.HALF_UP));
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
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy người dùng: " + authentication.getName()));
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
        String prefix = "SO";
        String maxNo = salesOrderRepository.findMaxOrderNo(prefix);
        
        int nextNum = 1;
        if (maxNo != null && maxNo.startsWith(prefix)) {
            try {
                String numPart = maxNo.substring(prefix.length());
                nextNum = Integer.parseInt(numPart) + 1;
            } catch (NumberFormatException e) {
                // If parsing fails, start from 1
                nextNum = 1;
            }
        }
        
        return String.format("%s%04d", prefix, nextNum);
    }
}