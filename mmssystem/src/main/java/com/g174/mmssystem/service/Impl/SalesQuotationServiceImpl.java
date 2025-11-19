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
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.SalesQuotationMapper;
import com.g174.mmssystem.repository.CustomerRepository;
import com.g174.mmssystem.repository.ProductRepository;
import com.g174.mmssystem.repository.SalesQuotationItemRepository;
import com.g174.mmssystem.repository.SalesQuotationRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.ISalesQuotationService;
import com.g174.mmssystem.specification.SalesQuotationSpecifications;
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
public class SalesQuotationServiceImpl implements ISalesQuotationService {

    private final SalesQuotationRepository quotationRepository;
    private final SalesQuotationItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SalesQuotationMapper quotationMapper;

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

        recalcTotals(quotation, items, request.getHeaderDiscount());

        SalesQuotation saved = quotationRepository.save(quotation);
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

        Customer customer = getCustomer(request.getCustomerId());
        User currentUser = getCurrentUser();
        quotationMapper.updateEntity(quotation, request, customer, currentUser);

        quotation.getItems().clear();
        itemRepository.deleteBySalesQuotation_SqId(id);
        List<SalesQuotationItem> items = buildItems(quotation, request.getItems());
        quotation.getItems().addAll(items);

        recalcTotals(quotation, items, request.getHeaderDiscount());

        SalesQuotation saved = quotationRepository.save(quotation);
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
    public Page<SalesQuotationListResponseDTO> getQuotations(Integer customerId, String status, String keyword, Pageable pageable) {
        Specification<SalesQuotation> spec = Specification.where(SalesQuotationSpecifications.notDeleted())
                .and(SalesQuotationSpecifications.hasCustomer(customerId))
                .and(SalesQuotationSpecifications.hasStatus(parseStatus(status)))
                .and(SalesQuotationSpecifications.keywordLike(keyword));

        Page<SalesQuotation> page = quotationRepository.findAll(spec, pageable);
        return page.map(quotationMapper::toListResponseDTO);
    }

    @Override
    public void deleteQuotation(Integer id) {
        SalesQuotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Quotation not found with id: " + id));
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
        return quotationMapper.toResponseDTO(saved, items);
    }

    private List<SalesQuotationItem> buildItems(SalesQuotation quotation, List<SalesQuotationItemRequestDTO> requestItems) {
        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một dòng sản phẩm");
        }

        List<SalesQuotationItem> items = new ArrayList<>();
        for (SalesQuotationItemRequestDTO dto : requestItems) {
            Product product = null;
            if (dto.getProductId() != null) {
                product = productRepository.findById(dto.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID " + dto.getProductId()));
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

    private void recalcTotals(SalesQuotation quotation, List<SalesQuotationItem> items, BigDecimal headerDiscount) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SalesQuotationItem item : items) {
            BigDecimal qty = defaultBigDecimal(item.getQuantity(), BigDecimal.ONE);
            BigDecimal unitPrice = defaultBigDecimal(item.getUnitPrice());
            BigDecimal baseAmount = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);

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

        BigDecimal headerDisc = defaultBigDecimal(headerDiscount);
        if (headerDisc.compareTo(subtotal) > 0) {
            headerDisc = subtotal;
        }

        BigDecimal total = subtotal.subtract(headerDisc).add(taxTotal);

        quotation.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        quotation.setHeaderDiscount(headerDisc.setScale(2, RoundingMode.HALF_UP));
        quotation.setTaxAmount(taxTotal.setScale(2, RoundingMode.HALF_UP));
        quotation.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + authentication.getName()));
    }

    private BigDecimal defaultBigDecimal(BigDecimal value) {
        return defaultBigDecimal(value, BigDecimal.ZERO);
    }

    private BigDecimal defaultBigDecimal(BigDecimal value, BigDecimal defaultValue) {
        return value != null ? value : defaultValue;
    }

    private String generateQuotationNo() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        String candidate = "SQ-" + datePart + "-" + unique;

        while (quotationRepository.findByQuotationNo(candidate) != null) {
            unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
            candidate = "SQ-" + datePart + "-" + unique;
        }
        return candidate;
    }
}

