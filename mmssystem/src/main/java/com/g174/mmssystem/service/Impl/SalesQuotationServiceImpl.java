package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.SalesQuotationItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.SalesQuotationRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationResponseDTO;
import com.g174.mmssystem.entity.Customer;
import com.g174.mmssystem.entity.Product;
import com.g174.mmssystem.entity.SalesQuotation;
import com.g174.mmssystem.entity.SalesQuotationItem;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.Contact;
import com.g174.mmssystem.entity.SalesOrder;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.SalesQuotationMapper;
import com.g174.mmssystem.repository.CustomerRepository;
import com.g174.mmssystem.repository.ProductRepository;
import com.g174.mmssystem.repository.SalesQuotationItemRepository;
import com.g174.mmssystem.repository.SalesQuotationRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.EmailService;
import com.g174.mmssystem.service.IService.ISalesQuotationService;
import com.g174.mmssystem.specification.SalesQuotationSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
public class SalesQuotationServiceImpl implements ISalesQuotationService {

    private final SalesQuotationRepository quotationRepository;
    private final com.g174.mmssystem.repository.SalesOrderRepository salesOrderRepository;
    private final SalesQuotationItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SalesQuotationMapper quotationMapper;
    private final EmailService emailService;

    @Override
    public SalesQuotationResponseDTO createQuotation(SalesQuotationRequestDTO request) {
        Customer customer = getCustomer(request.getCustomerId());
        User currentUser = getCurrentUser();

        SalesQuotation quotation = quotationMapper.toEntity(request, customer, currentUser);
        quotation.setQuotationNo(generateQuotationNo());
        quotation.setStatus(SalesQuotation.QuotationStatus.Draft);

        List<SalesQuotationItem> items = buildItems(quotation, request.getItems());
        quotation.getItems().clear();
        quotation.getItems().addAll(items);

        recalcTotals(quotation, items);

        SalesQuotation saved = quotationRepository.save(quotation);
        // Không gửi email ở bước tạo Draft. Email chỉ gửi khi chuyển sang Active.
        return quotationMapper.toResponseDTO(saved, items);
    }

    @Override
    public SalesQuotationResponseDTO updateQuotation(Integer id, SalesQuotationRequestDTO request) {
        SalesQuotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Quotation not found with id: " + id));

        if (quotation.getDeletedAt() != null) {
            throw new IllegalStateException("Sales Quotation has been deleted");
        }

        if (quotation.getStatus() == SalesQuotation.QuotationStatus.Converted ||
                quotation.getStatus() == SalesQuotation.QuotationStatus.Cancelled) {
            throw new IllegalStateException("Không thể chỉnh sửa báo giá ở trạng thái " + quotation.getStatus());
        }

        // Check: Nếu status = Active (đã gửi khách), chỉ Manager mới được sửa
        if (quotation.getStatus() == SalesQuotation.QuotationStatus.Active) {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                throw new IllegalStateException("Không xác định được người dùng hiện tại");
            }

            // Check role Manager
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isManager = authentication != null &&
                    authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

            if (!isManager) {
                throw new IllegalStateException("Báo giá đã gửi khách, chỉ Manager mới được sửa");
            }

            // Log warning
            log.warn("Manager {} đang chỉnh sửa báo giá đã gửi khách: {}",
                    currentUser.getEmail(), quotation.getQuotationNo());
        }

        Customer customer = getCustomer(request.getCustomerId());
        User currentUser = getCurrentUser();
        quotationMapper.updateEntity(quotation, request, customer, currentUser);

        quotation.getItems().clear();
        itemRepository.deleteBySalesQuotation_SqId(id);
        List<SalesQuotationItem> items = buildItems(quotation, request.getItems());
        quotation.getItems().addAll(items);

        recalcTotals(quotation, items);

        SalesQuotation saved = quotationRepository.save(quotation);
        // Nếu báo giá đang ở trạng thái Active, vẫn KHÔNG tự động gửi lại email khi chỉ
        // update.
        // Email chỉ gửi lại khi người dùng thực hiện hành động "Gửi cho khách"
        // (changeStatus -> Active).
        return quotationMapper.toResponseDTO(saved, items);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesQuotationResponseDTO getQuotation(Integer id) {
        SalesQuotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Quotation not found with id: " + id));
        if (quotation.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Sales Quotation not found with id: " + id);
        }
        List<SalesQuotationItem> items = itemRepository.findBySalesQuotation_SqId(id);
        return quotationMapper.toResponseDTO(quotation, items);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalesQuotationListResponseDTO> getQuotations(Integer customerId, String status, String keyword,
            Pageable pageable) {
        Specification<SalesQuotation> spec = Specification.where(SalesQuotationSpecifications.notDeleted())
                .and(SalesQuotationSpecifications.hasCustomer(customerId))
                .and(SalesQuotationSpecifications.hasStatus(parseStatus(status)))
                .and(SalesQuotationSpecifications.keywordLike(keyword));

        Page<SalesQuotation> page = quotationRepository.findAll(spec, pageable);
        return page.map(sq -> enrichListDtoWithSalesOrderInfo(quotationMapper.toListResponseDTO(sq)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesQuotationListResponseDTO> getAllQuotations(Integer customerId, String status, String keyword) {
        Specification<SalesQuotation> spec = Specification.where(SalesQuotationSpecifications.notDeleted())
                .and(SalesQuotationSpecifications.hasCustomer(customerId))
                .and(SalesQuotationSpecifications.hasStatus(parseStatus(status)))
                .and(SalesQuotationSpecifications.keywordLike(keyword));

        List<SalesQuotation> quotations = quotationRepository.findAll(spec,
                Sort.by(Sort.Direction.DESC, "quotationDate"));
        return quotations.stream()
                .map(quotationMapper::toListResponseDTO)
                .map(this::enrichListDtoWithSalesOrderInfo)
                .collect(Collectors.toList());
    }

    private SalesQuotationListResponseDTO enrichListDtoWithSalesOrderInfo(SalesQuotationListResponseDTO dto) {
        if (dto == null || dto.getQuotationId() == null) {
            return dto;
        }
        List<SalesOrder> orders = salesOrderRepository.findBySalesQuotationId(dto.getQuotationId());
        boolean hasSo = orders != null && !orders.isEmpty();
        dto.setHasSalesOrder(hasSo);
        dto.setSalesOrderId(hasSo ? orders.get(0).getSoId() : null);
        return dto;
    }

    @Override
    public void deleteQuotation(Integer id) {
        SalesQuotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Quotation not found with id: " + id));

        // Check 1: Không cho xóa khi đã Converted (đã tạo Sales Order)
        if (quotation.getStatus() == SalesQuotation.QuotationStatus.Converted) {
            throw new IllegalStateException("Không thể xóa báo giá đã chuyển thành đơn hàng");
        }

        // Check 2: Nếu đã có Sales Order được tạo từ Quotation này
        List<com.g174.mmssystem.entity.SalesOrder> orders = salesOrderRepository.findBySalesQuotationId(id);
        if (!orders.isEmpty()) {
            throw new IllegalStateException("Không thể xóa báo giá đã có đơn hàng được tạo từ báo giá này");
        }

        // Check 3: Nếu status = Active (đã gửi khách), chỉ Manager mới được xóa
        if (quotation.getStatus() == SalesQuotation.QuotationStatus.Active) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isManager = authentication != null &&
                    authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

            if (!isManager) {
                throw new IllegalStateException("Báo giá đã gửi khách, chỉ Manager mới được xóa");
            }
        }

        quotation.setDeletedAt(Instant.now());
        quotationRepository.save(quotation);
    }

    @Override
    public SalesQuotationResponseDTO changeStatus(Integer id, String status) {
        SalesQuotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Quotation not found with id: " + id));
        SalesQuotation.QuotationStatus newStatus = parseStatus(status);
        if (newStatus == null) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
        quotation.setStatus(newStatus);
        SalesQuotation saved = quotationRepository.save(quotation);
        List<SalesQuotationItem> items = itemRepository.findBySalesQuotation_SqId(id);
        if (newStatus == SalesQuotation.QuotationStatus.Active) {
            sendQuotationEmailIfPossible(saved);
        }
        return quotationMapper.toResponseDTO(saved, items);
    }

    @Override
    public SalesQuotationResponseDTO cloneQuotation(Integer id) {
        SalesQuotation source = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Quotation not found with id: " + id));

        if (source.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Sales Quotation not found with id: " + id);
        }

        List<SalesQuotationItem> sourceItems = itemRepository.findBySalesQuotation_SqId(id);
        User currentUser = getCurrentUser();
        Customer customer = source.getCustomer();

        SalesQuotation clone = new SalesQuotation();
        clone.setCustomer(customer);
        clone.setQuotationNo(generateQuotationNo());
        clone.setQuotationDate(Instant.now());
        clone.setValidUntil(source.getValidUntil());
        clone.setPaymentTerms(source.getPaymentTerms());
        clone.setDeliveryTerms(source.getDeliveryTerms());
        clone.setHeaderDiscountPercent(source.getHeaderDiscountPercent());
        clone.setNotes(source.getNotes());
        clone.setStatus(SalesQuotation.QuotationStatus.Draft);
        clone.setCreatedBy(currentUser);
        clone.setUpdatedBy(currentUser);

        List<SalesQuotationItem> newItems = cloneItems(clone, sourceItems);
        clone.getItems().clear();
        clone.getItems().addAll(newItems);

        recalcTotals(clone, newItems);

        SalesQuotation saved = quotationRepository.save(clone);
        return quotationMapper.toResponseDTO(saved, newItems);
    }

    private List<SalesQuotationItem> buildItems(SalesQuotation quotation,
            List<SalesQuotationItemRequestDTO> requestItems) {
        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một dòng sản phẩm");
        }

        List<SalesQuotationItem> items = new ArrayList<>();
        for (SalesQuotationItemRequestDTO dto : requestItems) {
            Product product = null;
            if (dto.getProductId() != null) {
                product = productRepository.findById(dto.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy sản phẩm ID " + dto.getProductId()));
            }
            SalesQuotationItem item = quotationMapper.toItemEntity(quotation, dto, product);
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

    private void sendQuotationEmailIfPossible(SalesQuotation quotation) {
        try {
            Customer customer = quotation.getCustomer();
            if (customer == null) {
                log.warn("Skip sending quotation email: customer is null for quotation {}", quotation.getQuotationNo());
                return;
            }
            Contact contact = customer.getContact();
            String toEmail = contact != null ? contact.getEmail() : null;
            if (toEmail == null || toEmail.isBlank()) {
                log.warn("Skip sending quotation email: customer {} has no contact email", customer.getCustomerCode());
                return;
            }

            // Load items to include in email
            List<SalesQuotationItem> items = itemRepository.findBySalesQuotation_SqId(quotation.getSqId());

            String subject = String.format("[Báo giá %s] Gửi đến khách hàng %s", quotation.getQuotationNo(),
                    customer.getCustomerCode());
            String htmlBody = buildQuotationEmailBody(quotation, customer, items);
            emailService.sendHtmlEmail(toEmail.trim(), subject, htmlBody);
        } catch (Exception e) {
            log.error("Failed to send quotation email for {}: {}", quotation.getQuotationNo(), e.getMessage(), e);
        }
    }

    private String buildQuotationEmailBody(SalesQuotation quotation, Customer customer,
            List<SalesQuotationItem> items) {
        String customerName = (customer.getFirstName() + " " + customer.getLastName()).trim();
        String quotationNo = quotation.getQuotationNo();
        java.text.NumberFormat nf = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN"));
        String total = quotation.getTotalAmount() != null ? nf.format(quotation.getTotalAmount()) : "0";

        StringBuilder rows = new StringBuilder();
        if (items != null && !items.isEmpty()) {
            int idx = 1;
            for (SalesQuotationItem item : items) {
                String name = item.getProductName() != null ? item.getProductName() : "";
                String qty = item.getQuantity() != null ? nf.format(item.getQuantity()) : "0";
                String unitPrice = item.getUnitPrice() != null ? nf.format(item.getUnitPrice()) : "0";
                // Tính % chiết khấu từ số tiền: discount% = discountAmount / (quantity * unitPrice) * 100
                String discount = "0%";
                if (item.getDiscountAmount() != null && item.getQuantity() != null && item.getUnitPrice() != null) {
                    java.math.BigDecimal subTotal = item.getQuantity().multiply(item.getUnitPrice());
                    if (subTotal.compareTo(java.math.BigDecimal.ZERO) > 0) {
                        java.math.BigDecimal discountPct = item.getDiscountAmount()
                            .multiply(new java.math.BigDecimal("100"))
                            .divide(subTotal, 2, java.math.RoundingMode.HALF_UP);
                        discount = discountPct.toPlainString() + "%";
                    }
                }
                String taxRate = item.getTaxRate() != null ? item.getTaxRate().toPlainString() + "%" : "0%";
                String lineTotal = item.getLineTotal() != null ? nf.format(item.getLineTotal()) : "0";

                rows.append(
                        """
                                <tr>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:center; width:40px;">%d</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:left;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:center; width:80px;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:right; width:120px;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:right; width:100px;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:center; width:70px;">%s</td>
                                  <td style="padding:8px 12px; border:1px solid #d1d5db; text-align:right; width:130px; font-weight:bold;">%s</td>
                                </tr>
                                """
                                .formatted(idx++, name, qty, unitPrice, discount, taxRate, lineTotal));
            }
        } else {
            rows.append("""
                    <tr>
                      <td colspan="7" style="padding:12px; border:1px solid #d1d5db; text-align:center; color:#6b7280;">
                        Không có dòng sản phẩm
                      </td>
                    </tr>
                    """);
        }

        return String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; line-height:1.5;">
                  <h2 style="color:#1f2937;">Gửi báo giá bán hàng: %s</h2>
                  <p>Kính gửi <strong>%s</strong>,</p>
                  <p>Chúng tôi gửi tới quý khách báo giá bán hàng số <strong>%s</strong>.</p>
                  <table style="border-collapse:collapse; width:100%%; margin-top:16px; font-size:14px;">
                    <thead>
                      <tr style="background:#2563eb; color:#fff;">
                        <th style="padding:10px 12px; border:1px solid #1d4ed8; width:40px;">#</th>
                        <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:left;">Sản phẩm</th>
                        <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:center; width:80px;">SL</th>
                        <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:right; width:120px;">Đơn giá(VND)</th>
                        <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:right; width:100px;">Chiết khấu(%%)</th>
                        <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:center; width:70px;">Thuế(%%)</th>
                        <th style="padding:10px 12px; border:1px solid #1d4ed8; text-align:right; width:130px;">Thành tiền(VND)</th>
                      </tr>
                    </thead>
                    <tbody>
                      %s
                    </tbody>
                  </table>
                  <p style="margin-top:20px; font-size:16px; text-align:right;"><strong>Tổng cộng: %s VNĐ</strong></p>
                  <hr style="margin:20px 0; border:none; border-top:1px solid #e5e7eb;"/>
                  <p style="color:#6b7280;">Nếu cần chỉnh sửa, vui lòng phản hồi email này.</p>
                  <p>Trân trọng,<br/><strong>MMS System</strong></p>
                </body>
                </html>
                """, quotationNo, customerName, quotationNo, rows.toString(), total);
    }

    private List<SalesQuotationItem> cloneItems(SalesQuotation target, List<SalesQuotationItem> sourceItems) {
        List<SalesQuotationItem> items = new ArrayList<>();
        for (SalesQuotationItem src : sourceItems) {
            SalesQuotationItem item = new SalesQuotationItem();
            item.setSalesQuotation(target);
            item.setProduct(src.getProduct());
            item.setProductName(src.getProductName());
            item.setProductCode(src.getProductCode());
            item.setUom(src.getUom());
            item.setQuantity(defaultBigDecimal(src.getQuantity(), BigDecimal.ONE));
            item.setUnitPrice(defaultBigDecimal(src.getUnitPrice()));
            item.setDiscountAmount(defaultBigDecimal(src.getDiscountAmount()));
            item.setTaxRate(defaultBigDecimal(src.getTaxRate()));
            item.setNote(src.getNote());
            // taxAmount & lineTotal will be recalculated in recalcTotals
            items.add(item);
        }
        return items;
    }

    private void recalcTotals(SalesQuotation quotation, List<SalesQuotationItem> items) {
        BigDecimal lineSubtotalSum = BigDecimal.ZERO; // sau chiết khấu dòng
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SalesQuotationItem item : items) {
            BigDecimal qty = defaultBigDecimal(item.getQuantity(), BigDecimal.ONE);
            BigDecimal unitPrice = defaultBigDecimal(item.getUnitPrice());
            BigDecimal baseAmount = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);

            BigDecimal discount = defaultBigDecimal(item.getDiscountAmount());
            if (discount.compareTo(baseAmount) > 0) {
                discount = baseAmount;
            }

            BigDecimal lineSubtotal = baseAmount.subtract(discount); // sau CK dòng
            item.setLineTotal(lineSubtotal); // tạm lưu, sẽ cập nhật sau CK chung + thuế

            lineSubtotalSum = lineSubtotalSum.add(lineSubtotal);
        }

        BigDecimal headerPercent = defaultBigDecimal(quotation.getHeaderDiscountPercent());
        BigDecimal headerAmount = lineSubtotalSum.multiply(headerPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        for (SalesQuotationItem item : items) {
            BigDecimal lineSubtotal = defaultBigDecimal(item.getLineTotal());
            BigDecimal allocHeader = BigDecimal.ZERO;
            if (lineSubtotalSum.compareTo(BigDecimal.ZERO) > 0) {
                allocHeader = lineSubtotal.multiply(headerAmount)
                        .divide(lineSubtotalSum, 2, RoundingMode.HALF_UP);
            }

            BigDecimal lineTaxable = lineSubtotal.subtract(allocHeader);
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
                .subtract(headerAmount)
                .add(taxTotal)
                .setScale(2, RoundingMode.HALF_UP);

        quotation.setSubtotal(subtotal);
        quotation.setHeaderDiscountPercent(headerPercent.setScale(2, RoundingMode.HALF_UP));
        quotation.setHeaderDiscountAmount(headerAmount.setScale(2, RoundingMode.HALF_UP));
        quotation.setTaxAmount(taxTotal.setScale(2, RoundingMode.HALF_UP));
        quotation.setTotalAmount(total);
    }

    private SalesQuotation.QuotationStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return SalesQuotation.QuotationStatus.valueOf(status.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Customer getCustomer(Integer id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng ID " + id));
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

    private BigDecimal defaultBigDecimal(BigDecimal value) {
        return defaultBigDecimal(value, BigDecimal.ZERO);
    }

    private BigDecimal defaultBigDecimal(BigDecimal value, BigDecimal defaultValue) {
        return value != null ? value : defaultValue;
    }

    private String generateQuotationNo() {
        String prefix = "SQ";
        String maxNo = quotationRepository.findMaxQuotationNo(prefix);
        int nextNum = 1;
        if (maxNo != null && maxNo.startsWith(prefix)) {
            try {
                nextNum = Integer.parseInt(maxNo.substring(prefix.length())) + 1;
            } catch (NumberFormatException ignored) {
            }
        }
        return String.format("%s%04d", prefix, nextNum);
    }
}